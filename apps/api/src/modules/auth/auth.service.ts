import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { loadBackendEnv } from '@zakaria/backend-config';
import { DatabaseService } from '@zakaria/backend-database';
import {
  ForgotPasswordRequestSchema,
  LoginRequestSchema,
  ResetPasswordRequestSchema,
  SESSION_DURATION_TTL_SECONDS,
  type LoginResponseDto,
  type SessionDuration,
} from '@zakaria/shared-contracts';
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
    const session = await this.sessionService.createSession(user.id, durationCode, meta);

    await this.rateLimit.clearLoginFailures(ipKey, emailNormalized);
    await this.audit.record('login', user.id, meta);

    return {
      rawToken: session.rawToken,
      ttlSeconds: SESSION_DURATION_TTL_SECONDS[durationCode],
      response: {
        user: resolved.user,
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

  async requestPasswordReset(
    rawPayload: unknown,
    meta: RequestMeta,
  ): Promise<{ message: string }> {
    const parsed = ForgotPasswordRequestSchema.safeParse(rawPayload);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues[0]?.message ?? 'Adresse e-mail invalide.',
      );
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

  async resetPassword(
    rawPayload: unknown,
    meta: RequestMeta,
  ): Promise<{ message: string }> {
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
      throw new BadRequestException(
        'Ce lien de réinitialisation est invalide ou a expiré.',
      );
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
}

