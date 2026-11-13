import { createHash, randomBytes } from 'node:crypto';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { loadBackendEnv } from '@zakaria/backend-config';
import { DatabaseService } from '@zakaria/backend-database';
import {
  SESSION_DURATION_TTL_SECONDS,
  SessionDurationSchema,
  type SessionDuration,
} from '@zakaria/shared-contracts';
import type { AuthContext, RequestMeta } from './auth.types';
import {
  PermissionResolverService,
  type ResolvedUserAccess,
} from './permission-resolver.service';

const SESSION_CACHE_TTL_SECONDS = 60;
const LAST_ACTIVE_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class SessionService {
  private readonly prefix = loadBackendEnv().REDIS_PREFIX;

  constructor(
    private readonly database: DatabaseService,
    private readonly permissionResolver: PermissionResolverService,
  ) {}

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private sessionCacheKey(sessionIdHash: string): string {
    return `${this.prefix}:auth:sess:${sessionIdHash}`;
  }

  assertAccountAccessAllowed(resolved: ResolvedUserAccess): void {
    if (resolved.deletedAt !== null) {
      throw new ForbiddenException("Ce compte utilisateur n'est plus actif.");
    }
    if (resolved.inscriptionStatut === 'en_attente') {
      throw new ForbiddenException(
        "Votre demande d'inscription est en cours de validation par l'équipe G4D.",
      );
    }
    if (resolved.inscriptionStatut === 'refusee') {
      throw new ForbiddenException(
        "Votre demande d'inscription a été refusée. Contactez le support G4D.",
      );
    }
    if (!resolved.user.active) {
      throw new ForbiddenException(
        'Votre compte est actuellement désactivé. Contactez un administrateur.',
      );
    }
    if (resolved.user.parentId !== null && (resolved.parentDeleted || !resolved.parentActive)) {
      throw new ForbiddenException(
        'Le compte principal titulaire est désactivé ou suspendu.',
      );
    }
    if (resolved.user.roles.length === 0) {
      throw new ForbiddenException(
        "Aucun rôle d'accès n'est attribué à votre compte. Contactez un administrateur.",
      );
    }
  }

  async createSession(
    userId: number,
    durationCode: SessionDuration,
    meta: RequestMeta,
  ): Promise<{ rawToken: string; sessionId: string; expiresAt: Date; durationCode: SessionDuration }> {
    const rawToken = randomBytes(32).toString('base64url');
    const sessionId = this.hashToken(rawToken);
    const ttlSeconds = SESSION_DURATION_TTL_SECONDS[durationCode];
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await this.database.prisma.authSession.create({
      data: {
        id: sessionId,
        userId,
        durationCode,
        expiresAt,
        ipAddress: meta.ipAddress?.slice(0, 45) ?? null,
        userAgent: meta.userAgent ?? null,
      },
    });

    return { rawToken, sessionId, expiresAt, durationCode };
  }

  async validateSession(rawToken: string): Promise<AuthContext> {
    if (!rawToken || rawToken.length < 20) {
      throw new UnauthorizedException('Session manquante ou invalide.');
    }

    const sessionId = this.hashToken(rawToken);
    const redis = this.database.getRedisClient();
    const cacheKey = this.sessionCacheKey(sessionId);

    let sessionMeta: {
      userId: number;
      durationCode: SessionDuration;
      expiresAt: Date;
      createdAt: Date;
      lastActiveAt: Date;
    } | null = null;

    if (redis.status === 'ready') {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as {
            userId: number;
            durationCode: string;
            expiresAt: string;
            createdAt: string;
            lastActiveAt: string;
          };
          const parsedDuration = SessionDurationSchema.safeParse(parsed.durationCode);
          sessionMeta = {
            userId: parsed.userId,
            durationCode: parsedDuration.success ? parsedDuration.data : '8h',
            expiresAt: new Date(parsed.expiresAt),
            createdAt: new Date(parsed.createdAt),
            lastActiveAt: new Date(parsed.lastActiveAt),
          };
        }
      } catch {
        // Fallback BDD
      }
    }

    if (!sessionMeta) {
      const dbSession = await this.database.prisma.authSession.findUnique({
        where: { id: sessionId },
      });

      if (!dbSession || dbSession.revokedAt !== null) {
        throw new UnauthorizedException('Session expirée ou révoquée. Veuillez vous reconnecter.');
      }

      if (dbSession.expiresAt.getTime() <= Date.now()) {
        throw new UnauthorizedException('Votre session a expiré. Veuillez vous reconnecter.');
      }

      const parsedDuration = SessionDurationSchema.safeParse(dbSession.durationCode);
      sessionMeta = {
        userId: dbSession.userId,
        durationCode: parsedDuration.success ? parsedDuration.data : '8h',
        expiresAt: dbSession.expiresAt,
        createdAt: dbSession.createdAt,
        lastActiveAt: dbSession.lastActiveAt,
      };

      if (redis.status === 'ready') {
        const secondsRemaining = Math.max(
          5,
          Math.min(
            SESSION_CACHE_TTL_SECONDS,
            Math.floor((dbSession.expiresAt.getTime() - Date.now()) / 1000),
          ),
        );
        try {
          await redis.set(
            cacheKey,
            JSON.stringify({
              userId: sessionMeta.userId,
              durationCode: sessionMeta.durationCode,
              expiresAt: sessionMeta.expiresAt.toISOString(),
              createdAt: sessionMeta.createdAt.toISOString(),
              lastActiveAt: sessionMeta.lastActiveAt.toISOString(),
            }),
            'EX',
            secondsRemaining,
          );
        } catch {
          // Non bloquant
        }
      }
    } else if (sessionMeta.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Votre session a expiré. Veuillez vous reconnecter.');
    }

    const resolved = await this.permissionResolver.resolveForUser(sessionMeta.userId);
    if (!resolved) {
      throw new UnauthorizedException('Compte introuvable.');
    }

    if (
      resolved.passwordResetAt &&
      resolved.passwordResetAt.getTime() > sessionMeta.createdAt.getTime() + 1000
    ) {
      await this.revokeSessionById(sessionId, 'password_reset');
      throw new UnauthorizedException(
        'Votre mot de passe a été modifié récemment. Veuillez vous reconnecter.',
      );
    }

    this.assertAccountAccessAllowed(resolved);

    if (Date.now() - sessionMeta.lastActiveAt.getTime() > LAST_ACTIVE_TOUCH_INTERVAL_MS) {
      void this.database.prisma.authSession
        .update({
          where: { id: sessionId },
          data: { lastActiveAt: new Date() },
        })
        .catch(() => undefined);
    }

    return {
      sessionId,
      durationCode: sessionMeta.durationCode,
      expiresAt: sessionMeta.expiresAt,
      user: resolved.user,
    };
  }

  async revokeSessionByToken(rawToken: string, reason = 'logout'): Promise<number | null> {
    if (!rawToken) return null;
    const sessionId = this.hashToken(rawToken);
    return this.revokeSessionById(sessionId, reason);
  }

  async revokeSessionById(sessionId: string, reason: string): Promise<number | null> {
    const existing = await this.database.prisma.authSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, revokedAt: true },
    });

    if (!existing) return null;

    if (existing.revokedAt === null) {
      await this.database.prisma.authSession.update({
        where: { id: sessionId },
        data: { revokedAt: new Date(), revokedReason: reason },
      });
    }

    const redis = this.database.getRedisClient();
    if (redis.status === 'ready') {
      await redis.del(this.sessionCacheKey(sessionId)).catch(() => undefined);
    }

    return existing.userId;
  }

  async revokeAllUserSessions(userId: number, reason: string): Promise<void> {
    const activeSessions = await this.database.prisma.authSession.findMany({
      where: { userId, revokedAt: null },
      select: { id: true },
    });

    if (activeSessions.length > 0) {
      await this.database.prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: reason },
      });

      const redis = this.database.getRedisClient();
      if (redis.status === 'ready') {
        await redis
          .del(...activeSessions.map((s) => this.sessionCacheKey(s.id)))
          .catch(() => undefined);
      }
    }

    await this.permissionResolver.invalidateUserCache(userId);
  }
}

