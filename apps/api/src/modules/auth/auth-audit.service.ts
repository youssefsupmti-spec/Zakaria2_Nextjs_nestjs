import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@zakaria/backend-database';
import type { RequestMeta } from './auth.types';

export type AuthAuditEvent =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_reset'
  | 'client_registered'
  | 'password_changed'
  | 'profile_updated'
  | 'avatar_updated'
  | 'sessions_revoked_others'
  | 'contact_change_requested'
  | 'inscription_accepted'
  | 'inscription_rejected';

function parseUserAgentSummary(userAgent: string | null): {
  browser: string | null;
  platform: string | null;
  device: string | null;
} {
  if (!userAgent) {
    return { browser: null, platform: null, device: null };
  }

  let browser = 'Inconnu';
  if (userAgent.includes('Edg/')) browser = 'Edge';
  else if (userAgent.includes('Chrome/')) browser = 'Chrome';
  else if (userAgent.includes('Firefox/')) browser = 'Firefox';
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Safari';
  else if (userAgent.includes('curl/')) browser = 'curl';

  let platform = 'Inconnu';
  if (userAgent.includes('Windows')) platform = 'Windows';
  else if (userAgent.includes('Android')) platform = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) platform = 'iOS';
  else if (userAgent.includes('Mac OS X')) platform = 'macOS';
  else if (userAgent.includes('Linux')) platform = 'Linux';

  const device = /Mobi|Android|iPhone|iPad/i.test(userAgent) ? 'Mobile' : 'Desktop';

  return { browser, platform, device };
}

@Injectable()
export class AuthAuditService {
  private readonly logger = new Logger(AuthAuditService.name);

  constructor(private readonly database: DatabaseService) {}

  async record(
    event: AuthAuditEvent,
    userId: number | null,
    meta: RequestMeta,
    detail: string | null = null,
  ): Promise<void> {
    const parsed = parseUserAgentSummary(meta.userAgent);
    try {
      await this.database.prisma.authenticationLog.create({
        data: {
          userId,
          event,
          ipAddress: meta.ipAddress?.slice(0, 45) ?? null,
          userAgent: meta.userAgent ?? null,
          browser: parsed.browser,
          platform: parsed.platform,
          device: parsed.device,
          location: detail ? detail.slice(0, 255) : null,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Échec d'enregistrement du log d'audit '${event}': ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
