import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { loadBackendEnv } from '@zakaria/backend-config';
import { DatabaseService } from '@zakaria/backend-database';
import {
  ChangePasswordSchema,
  ForgotPasswordRequestSchema,
  LoginRequestSchema,
  RegisterClientSchema,
  RequestContactChangeSchema,
  ResetPasswordRequestSchema,
  SESSION_DURATION_TTL_SECONDS,
  UpdateProfileSchema,
  type LoginResponseDto,
  type SessionDuration,
  type VilleOptionDto,
} from '@zakaria/shared-contracts';
import { parseOrThrowZod } from '../../common/validation/zod-validation';
import { AccessContextService } from '../access-control/access-context.service';
import { AuthAuditService } from './auth-audit.service';
import { AuthRateLimitService } from './auth-rate-limit.service';
import type { RequestMeta } from './auth.types';
import { MailQueueService } from './mail-queue.service';
import { PasswordHasherService } from './password-hasher.service';
import { PermissionResolverService } from './permission-resolver.service';
import { SessionService } from './session.service';

const RESET_TOKEN_TTL_MINUTES = 60;
const NEUTRAL_FORGOT_PASSWORD_MESSAGE =
  "Si cette adresse e-mail correspond à un compte actif, un lien de réinitialisation valable 60 minutes vient d'être envoyé.";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly env = loadBackendEnv();

  constructor(
    private readonly database: DatabaseService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly rateLimit: AuthRateLimitService,
    private readonly permissionResolver: PermissionResolverService,
    private readonly sessionService: SessionService,
    private readonly audit: AuthAuditService,
    private readonly mailQueue: MailQueueService,
    private readonly accessContextService: AccessContextService,
  ) {}

  private hashResetToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private safeEqualHex(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  }

  async login(
    rawPayload: unknown,
    meta: RequestMeta,
  ): Promise<{ response: LoginResponseDto; rawToken: string; ttlSeconds: number }> {
    const parsed = LoginRequestSchema.safeParse(rawPayload);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues[0]?.message ?? 'Données de connexion invalides.',
      );
    }

    const emailNormalized = parsed.data.email.trim().toLowerCase();
    const ipKey = meta.ipAddress ?? 'unknown';

    await this.rateLimit.assertLoginAllowed(ipKey, emailNormalized);

    const activeUser = await this.database.prisma.user.findFirst({
      where: { email: emailNormalized, deletedAt: null },
    });
    const user =
      activeUser ??
      (await this.database.prisma.user.findFirst({
        where: { email: emailNormalized },
        orderBy: { id: 'asc' },
      }));

    if (!user) {
      await this.rateLimit.recordLoginFailure(ipKey, emailNormalized);
      await this.audit.record('login_failed', null, meta);
      throw new UnauthorizedException('Adresse e-mail ou mot de passe incorrect.');
    }

    const passwordCheck = await this.passwordHasher.verifyAndCheckRehash(
      parsed.data.password,
      user.password,
    );

    if (!passwordCheck.valid) {
      await this.rateLimit.recordLoginFailure(ipKey, emailNormalized);
      await this.audit.record('login_failed', user.id, meta);
      throw new UnauthorizedException('Adresse e-mail ou mot de passe incorrect.');
    }

    const resolved = await this.permissionResolver.resolveForUser(user.id, true);
    if (!resolved) {
      throw new UnauthorizedException('Compte introuvable.');
    }

    this.sessionService.assertAccountAccessAllowed(resolved);

    // Migration progressive transparente : Bcrypt $2y$12$ -> Argon2id dès la connexion
    if (passwordCheck.needsRehash) {
      try {
        const argon2Hash = await this.passwordHasher.hashArgon2(parsed.data.password);
        await this.database.prisma.user.update({
          where: { id: user.id },
          data: { password: argon2Hash, passwordAlgo: 'argon2id' },
        });
      } catch (error) {
        this.logger.warn(
          `Rehash progressif différé pour utilisateur ${user.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const durationCode: SessionDuration =
      parsed.data.sessionDuration ?? (parsed.data.rememberMe ? '30d' : '8h');
    const [session, accessContext] = await Promise.all([
      this.sessionService.createSession(user.id, durationCode, meta),
      this.accessContextService.resolveForUser(resolved.user, true),
    ]);

    await this.rateLimit.clearLoginFailures(ipKey, emailNormalized);
    await this.audit.record('login', user.id, meta);

    return {
      rawToken: session.rawToken,
      ttlSeconds: SESSION_DURATION_TTL_SECONDS[durationCode],
      response: {
        user: {
          ...resolved.user,
          accessContext,
        },
        sessionExpiresAt: session.expiresAt.toISOString(),
        sessionDuration: durationCode,
        redirectTo: '/dashboard',
      },
    };
  }

  async logout(rawToken: string | undefined, meta: RequestMeta): Promise<void> {
    if (!rawToken) return;
    const userId = await this.sessionService.revokeSessionByToken(rawToken, 'logout');
    if (userId !== null) {
      await this.audit.record('logout', userId, meta);
    }
  }

  async requestPasswordReset(rawPayload: unknown, meta: RequestMeta): Promise<{ message: string }> {
    const parsed = ForgotPasswordRequestSchema.safeParse(rawPayload);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Adresse e-mail invalide.');
    }

    const emailNormalized = parsed.data.email.trim().toLowerCase();
    const ipKey = meta.ipAddress ?? 'unknown';

    const { emailThrottled } = await this.rateLimit.checkForgotPasswordLimit(
      ipKey,
      emailNormalized,
    );
    if (emailThrottled) {
      return { message: NEUTRAL_FORGOT_PASSWORD_MESSAGE };
    }

    const user = await this.database.prisma.user.findFirst({
      where: { email: emailNormalized, deletedAt: null },
      select: { id: true, email: true, nomComplet: true },
    });

    if (!user) {
      return { message: NEUTRAL_FORGOT_PASSWORD_MESSAGE };
    }

    const resolved = await this.permissionResolver.resolveForUser(user.id, true);
    if (!resolved) {
      return { message: NEUTRAL_FORGOT_PASSWORD_MESSAGE };
    }

    try {
      this.sessionService.assertAccountAccessAllowed(resolved);
    } catch {
      // Ne jamais divulguer le statut du compte sur forgot-password
      return { message: NEUTRAL_FORGOT_PASSWORD_MESSAGE };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    await this.database.prisma.passwordResetToken.upsert({
      where: { email: emailNormalized },
      update: {
        token: tokenHash,
        expiresAt,
        createdAt: now,
      },
      create: {
        email: emailNormalized,
        token: tokenHash,
        expiresAt,
        createdAt: now,
      },
    });

    const basePublicUrl = this.env.APP_PUBLIC_URL.replace(/\/+$/, '');
    const resetUrl = `${basePublicUrl}/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(emailNormalized)}`;

    await this.mailQueue.enqueuePasswordReset({
      email: user.email,
      nomComplet: user.nomComplet,
      resetUrl,
      expiresMinutes: RESET_TOKEN_TTL_MINUTES,
      requestedAtIso: now.toISOString(),
      ipAddress: meta.ipAddress,
    });

    return { message: NEUTRAL_FORGOT_PASSWORD_MESSAGE };
  }

  async resetPassword(rawPayload: unknown, meta: RequestMeta): Promise<{ message: string }> {
    const parsed = ResetPasswordRequestSchema.safeParse(rawPayload);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues[0]?.message ?? 'Données de réinitialisation invalides.',
      );
    }

    const emailNormalized = parsed.data.email.trim().toLowerCase();
    const tokenRecord = await this.database.prisma.passwordResetToken.findUnique({
      where: { email: emailNormalized },
    });

    if (!tokenRecord) {
      throw new BadRequestException(
        'Ce lien de réinitialisation est invalide ou a déjà été utilisé.',
      );
    }

    const expectedHash = this.hashResetToken(parsed.data.token.trim());
    if (!this.safeEqualHex(expectedHash, tokenRecord.token)) {
      throw new BadRequestException('Ce lien de réinitialisation est invalide ou a expiré.');
    }

    const fallbackExpiry = tokenRecord.createdAt
      ? tokenRecord.createdAt.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000
      : 0;
    const effectiveExpiry = tokenRecord.expiresAt?.getTime() ?? fallbackExpiry;

    if (effectiveExpiry <= Date.now()) {
      await this.database.prisma.passwordResetToken
        .delete({ where: { email: emailNormalized } })
        .catch(() => undefined);
      throw new BadRequestException(
        'Ce lien de réinitialisation a expiré (validité 60 minutes). Veuillez en demander un nouveau.',
      );
    }

    const user = await this.database.prisma.user.findFirst({
      where: { email: emailNormalized, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('Compte utilisateur introuvable ou supprimé.');
    }

    const resolved = await this.permissionResolver.resolveForUser(user.id, true);
    if (!resolved) {
      throw new BadRequestException('Compte utilisateur introuvable.');
    }
    this.sessionService.assertAccountAccessAllowed(resolved);

    const newArgon2Hash = await this.passwordHasher.hashArgon2(parsed.data.password);
    const resetAt = new Date();

    await this.database.prisma.$transaction([
      this.database.prisma.user.update({
        where: { id: user.id },
        data: {
          password: newArgon2Hash,
          passwordAlgo: 'argon2id',
          passwordResetAt: resetAt,
        },
      }),
      this.database.prisma.passwordResetToken.delete({
        where: { email: emailNormalized },
      }),
    ]);

    await this.sessionService.revokeAllUserSessions(user.id, 'password_reset');
    await this.audit.record('password_reset', user.id, meta);

    return {
      message:
        'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    };
  }

  /** Liste publique des villes actives pour le formulaire d'inscription et le profil. */
  async listPublicVilles(): Promise<{ villes: VilleOptionDto[] }> {
    const villes = await this.database.prisma.ville.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        nameFr: true,
        codeZone: true,
        zoneId: true,
      },
      orderBy: { nameFr: 'asc' },
    });
    return { villes };
  }

  /**
   * Action métier InscrireClient : crée un vendeur en attente de validation et sa première enseigne,
   * ou restaure une précédente inscription refusée en conservant l'historique des refus.
   */
  async registerClient(rawPayload: unknown, meta: RequestMeta) {
    const dto = parseOrThrowZod(
      RegisterClientSchema,
      rawPayload,
      "Données d'inscription vendeur invalides.",
    );

    const emailNormalized = dto.email.trim().toLowerCase();
    const telephoneNormalized = dto.telephone.trim();
    const businessVilleId = dto.businessVilleId ?? dto.villeId;

    const [villeClient, villeBusiness] = await Promise.all([
      this.database.prisma.ville.findFirst({
        where: { id: dto.villeId, deletedAt: null },
        select: { id: true, nameFr: true },
      }),
      businessVilleId === dto.villeId
        ? Promise.resolve(null)
        : this.database.prisma.ville.findFirst({
            where: { id: businessVilleId, deletedAt: null },
            select: { id: true },
          }),
    ]);

    if (!villeClient) {
      throw new BadRequestException('La ville sélectionnée pour le vendeur est introuvable.');
    }
    if (businessVilleId !== dto.villeId && !villeBusiness) {
      throw new BadRequestException("La ville sélectionnée pour l'enseigne est introuvable.");
    }

    const existingMatches = await this.database.prisma.user.findMany({
      where: {
        OR: [{ email: emailNormalized }, { telephone: telephoneNormalized }],
      },
      select: {
        id: true,
        email: true,
        telephone: true,
        inscriptionStatut: true,
        deletedAt: true,
      },
      orderBy: { id: 'asc' },
    });

    const blockingMatches = existingMatches.filter((u) => u.inscriptionStatut !== 'refusee');
    if (blockingMatches.length > 0) {
      const doublons: Array<{ field: 'email' | 'telephone'; message: string; email: string }> = [];
      for (const m of blockingMatches) {
        if (m.email.toLowerCase() === emailNormalized) {
          doublons.push({
            field: 'email',
            message:
              m.inscriptionStatut === 'en_attente'
                ? 'Une demande avec cette adresse e-mail est déjà en attente de validation.'
                : 'Un compte existe déjà avec cette adresse e-mail.',
            email: m.email,
          });
        }
        if (m.telephone.trim() === telephoneNormalized) {
          doublons.push({
            field: 'telephone',
            message: 'Ce numéro de téléphone est déjà associé à un compte existant.',
            email: m.email,
          });
        }
      }
      throw new ConflictException({
        message: 'Un compte existe déjà avec ces coordonnées.',
        details: doublons,
        doublons,
      });
    }

    const refusedToRestore =
      existingMatches.find((u) => u.email.toLowerCase() === emailNormalized) ??
      existingMatches[0] ??
      null;

    const passwordHash = await this.passwordHasher.hashArgon2(dto.password);

    const result = await this.database.prisma.$transaction(async (tx) => {
      let clientRole = await tx.role.findFirst({
        where: { name: 'client' },
        select: { id: true },
      });
      if (!clientRole) {
        clientRole = await tx.role.create({
          data: {
            name: 'client',
            guardName: 'web',
            portee: 'client',
            systeme: true,
            libelle: 'Vendeur / Client G4D',
          },
          select: { id: true },
        });
      }

      let userId: number;
      let restored = false;

      if (refusedToRestore) {
        const updatedUser = await tx.user.update({
          where: { id: refusedToRestore.id },
          data: {
            nomComplet: dto.nomComplet.trim(),
            civilite: dto.civilite ?? null,
            email: emailNormalized,
            telephone: telephoneNormalized,
            sav: dto.sav?.trim() ?? '',
            villeId: villeClient.id,
            villeName: villeClient.nameFr,
            cin: dto.cin?.trim() ?? '',
            lienLocalisationMaps: dto.lienLocalisationMaps?.trim() ?? '',
            password: passwordHash,
            passwordAlgo: 'argon2id',
            active: false,
            deletedAt: null,
            inscriptionStatut: 'en_attente',
            inscriptionTraiteePar: null,
            inscriptionTraiteeLe: null,
          },
          select: { id: true },
        });
        userId = updatedUser.id;
        restored = true;
      } else {
        const createdUser = await tx.user.create({
          data: {
            nomComplet: dto.nomComplet.trim(),
            civilite: dto.civilite ?? null,
            email: emailNormalized,
            telephone: telephoneNormalized,
            sav: dto.sav?.trim() ?? '',
            villeId: villeClient.id,
            villeName: villeClient.nameFr,
            cin: dto.cin?.trim() ?? '',
            lienLocalisationMaps: dto.lienLocalisationMaps?.trim() ?? '',
            password: passwordHash,
            passwordAlgo: 'argon2id',
            active: false,
            emailsend: 'non',
            inscriptionStatut: 'en_attente',
            inscriptionRefusNombre: 0,
          },
          select: { id: true },
        });
        userId = createdUser.id;
      }

      const existingRoleLink = await tx.userRole.findFirst({
        where: { userId, roleId: clientRole.id },
      });
      if (!existingRoleLink) {
        await tx.userRole.create({
          data: {
            userId,
            roleId: clientRole.id,
          },
        });
      }

      const createdBusiness = await tx.business.create({
        data: {
          userId,
          name: dto.businessName.trim(),
          type: dto.businessType ?? null,
          telephone: dto.businessTelephone?.trim() || telephoneNormalized,
          email: dto.businessEmail?.trim().toLowerCase() || emailNormalized,
          adresse: dto.businessAdresse?.trim() || null,
          villeId: businessVilleId,
          ice: dto.businessIce?.trim() || null,
          rc: dto.businessRc?.trim() || null,
          isActive: true,
        },
        select: { id: true, name: true },
      });

      return { userId, restored, businessId: createdBusiness.id, businessName: createdBusiness.name };
    });

    await this.permissionResolver.invalidateUserCache(result.userId);
    await this.accessContextService.invalidateUser(result.userId);
    await this.audit.record(
      'client_registered',
      result.userId,
      meta,
      `business:${result.businessName} (restored:${result.restored})`,
    );

    return {
      ok: true,
      restored: result.restored,
      userId: result.userId,
      businessId: result.businessId,
      message:
        'Votre demande d’inscription a bien été enregistrée. Elle est en cours de vérification par notre équipe.',
    };
  }

  /** Retourne le profil détaillé de l'utilisateur connecté et l'historique des demandes support coordonnées. */
  async getOwnProfile(userId: number) {
    const user = await this.database.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nomComplet: true,
        civilite: true,
        email: true,
        telephone: true,
        sav: true,
        villeId: true,
        villeName: true,
        cin: true,
        lienLocalisationMaps: true,
        active: true,
        inscriptionStatut: true,
        createdAt: true,
        ville: {
          select: { id: true, nameFr: true, codeZone: true },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('Profil utilisateur introuvable.');
    }

    const contactRequests = await this.database.prisma.authenticationLog.findMany({
      where: { userId, event: 'contact_change_requested' },
      select: {
        id: true,
        location: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      profile: user,
      contactChangeRequests: contactRequests.map((entry) => ({
        id: Number(entry.id),
        detail: entry.location ?? '',
        createdAt: entry.createdAt?.toISOString() ?? null,
      })),
    };
  }

  /** Met à jour les informations personnelles modifiables (coordonnées critiques protégées). */
  async updateOwnProfile(userId: number, rawPayload: unknown) {
    const dto = parseOrThrowZod(
      UpdateProfileSchema,
      rawPayload,
      'Données de mise à jour du profil invalides.',
    );

    let resolvedVilleName: string | undefined;
    if (dto.villeId !== undefined && dto.villeId !== null) {
      const ville = await this.database.prisma.ville.findFirst({
        where: { id: dto.villeId, deletedAt: null },
        select: { id: true, nameFr: true },
      });
      if (!ville) {
        throw new BadRequestException('Ville sélectionnée introuvable.');
      }
      resolvedVilleName = ville.nameFr;
    } else if (dto.villeId === null) {
      resolvedVilleName = '';
    }

    const updated = await this.database.prisma.user.update({
      where: { id: userId },
      data: {
        nomComplet: dto.nomComplet.trim(),
        ...(dto.civilite !== undefined ? { civilite: dto.civilite } : {}),
        ...(dto.villeId !== undefined ? { villeId: dto.villeId } : {}),
        ...(resolvedVilleName !== undefined ? { villeName: resolvedVilleName } : {}),
        cin: dto.cin?.trim() ?? '',
        lienLocalisationMaps: dto.lienLocalisationMaps?.trim() ?? '',
      },
      select: {
        id: true,
        nomComplet: true,
        civilite: true,
        email: true,
        telephone: true,
        sav: true,
        villeId: true,
        villeName: true,
        cin: true,
        lienLocalisationMaps: true,
      },
    });

    await this.permissionResolver.invalidateUserCache(userId);
    return {
      ok: true,
      profile: updated,
      message: 'Vos informations personnelles ont été enregistrées.',
    };
  }

  /** Modifie le mot de passe du compte connecté après vérification du mot de passe actuel. */
  async changeOwnPassword(userId: number, rawPayload: unknown, meta: RequestMeta) {
    const dto = parseOrThrowZod(
      ChangePasswordSchema,
      rawPayload,
      'Données de changement de mot de passe invalides.',
    );

    const user = await this.database.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const check = await this.passwordHasher.verifyAndCheckRehash(dto.currentPassword, user.password);
    if (!check.valid) {
      throw new BadRequestException('Le mot de passe actuel est incorrect.');
    }

    const newHash = await this.passwordHasher.hashArgon2(dto.newPassword);
    await this.database.prisma.user.update({
      where: { id: userId },
      data: {
        password: newHash,
        passwordAlgo: 'argon2id',
        passwordResetAt: new Date(),
      },
    });

    await this.permissionResolver.invalidateUserCache(userId);
    await this.audit.record('password_changed', userId, meta);

    return {
      ok: true,
      message: 'Votre mot de passe a été modifié avec succès.',
    };
  }

  /** Enregistre une demande encadrée de modification d'email, téléphone ou SAV via le journal support. */
  async requestContactChange(userId: number, rawPayload: unknown, meta: RequestMeta) {
    const dto = parseOrThrowZod(
      RequestContactChangeSchema,
      rawPayload,
      'Demande de modification invalide.',
    );

    const summary = `${dto.type} => ${dto.nouvelleValeur.trim()} | Motif: ${dto.motif.trim()}`;
    await this.audit.record('contact_change_requested', userId, meta, summary);

    return {
      ok: true,
      message:
        'Votre demande de modification de coordonnées a été transmise à notre équipe support pour vérification.',
    };
  }
}
