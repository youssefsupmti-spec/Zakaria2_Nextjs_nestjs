import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { loadBackendEnv } from '@zakaria/backend-config';
import { DatabaseService } from '@zakaria/backend-database';

const LOGIN_WINDOW_SECONDS = 15 * 60;
const MAX_LOGIN_FAILURES_ACCOUNT = 5;
const MAX_LOGIN_ATTEMPTS_IP = 30;
const FORGOT_PASSWORD_EMAIL_COOLDOWN_SECONDS = 60;
const FORGOT_PASSWORD_IP_WINDOW_SECONDS = 15 * 60;
const MAX_FORGOT_PASSWORD_IP = 10;

@Injectable()
export class AuthRateLimitService {
  private readonly logger = new Logger(AuthRateLimitService.name);
  private readonly prefix = loadBackendEnv().REDIS_PREFIX;

  constructor(private readonly database: DatabaseService) {}

  private accountKey(ip: string, emailNormalized: string): string {
    return `${this.prefix}:auth:rl:login:acct:${ip}:${emailNormalized}`;
  }

  private ipKey(ip: string): string {
    return `${this.prefix}:auth:rl:login:ip:${ip}`;
  }

  private forgotEmailKey(emailNormalized: string): string {
    return `${this.prefix}:auth:rl:fp:email:${emailNormalized}`;
  }

  private forgotIpKey(ip: string): string {
    return `${this.prefix}:auth:rl:fp:ip:${ip}`;
  }

  private async ensureRedisReady(): Promise<boolean> {
    const redis = this.database.getRedisClient();
    if (redis.status === 'ready') return true;
    try {
      if (redis.status === 'wait' || redis.status === 'end') {
        await redis.connect();
      }
      return (redis.status as string) === 'ready';
    } catch {
      return false;
    }
  }

  async assertLoginAllowed(ip: string, emailNormalized: string): Promise<void> {
    if (!(await this.ensureRedisReady())) {
      this.logger.warn('Redis indisponible pour le rate-limit login (passage tolérant).');
      return;
    }

    const redis = this.database.getRedisClient();
    const [acctRaw, ipRaw, acctTtl] = await Promise.all([
      redis.get(this.accountKey(ip, emailNormalized)),
      redis.get(this.ipKey(ip)),
      redis.ttl(this.accountKey(ip, emailNormalized)),
    ]);

    const acctCount = Number(acctRaw ?? 0);
    const ipCount = Number(ipRaw ?? 0);

    if (acctCount >= MAX_LOGIN_FAILURES_ACCOUNT || ipCount >= MAX_LOGIN_ATTEMPTS_IP) {
      const waitMinutes = Math.max(1, Math.ceil((acctTtl > 0 ? acctTtl : LOGIN_WINDOW_SECONDS) / 60));
      throw new HttpException(
        `Trop de tentatives de connexion. Veuillez réessayer dans environ ${waitMinutes} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async recordLoginFailure(ip: string, emailNormalized: string): Promise<void> {
    if (!(await this.ensureRedisReady())) return;
    const redis = this.database.getRedisClient();
    const acctKey = this.accountKey(ip, emailNormalized);
    const ipKey = this.ipKey(ip);

    const acctCount = await redis.incr(acctKey);
    if (acctCount === 1) await redis.expire(acctKey, LOGIN_WINDOW_SECONDS);

    const ipCount = await redis.incr(ipKey);
    if (ipCount === 1) await redis.expire(ipKey, LOGIN_WINDOW_SECONDS);
  }

  async clearLoginFailures(ip: string, emailNormalized: string): Promise<void> {
    if (!(await this.ensureRedisReady())) return;
    const redis = this.database.getRedisClient();
    await redis.del(this.accountKey(ip, emailNormalized));
  }

  /**
   * Respecte la règle métier Laravel : cooldown 60s par e-mail + plafond IP 10 req / 15 min.
   * Retourne `emailThrottled = true` pour rester muet sans révéler l'existence du compte.
   */
  async checkForgotPasswordLimit(
    ip: string,
    emailNormalized: string,
  ): Promise<{ emailThrottled: boolean }> {
    if (!(await this.ensureRedisReady())) {
      return { emailThrottled: false };
    }

    const redis = this.database.getRedisClient();
    const ipKey = this.forgotIpKey(ip);
    const ipCount = await redis.incr(ipKey);
    if (ipCount === 1) {
      await redis.expire(ipKey, FORGOT_PASSWORD_IP_WINDOW_SECONDS);
    }
    if (ipCount > MAX_FORGOT_PASSWORD_IP) {
      throw new HttpException(
        'Trop de demandes de réinitialisation depuis cette adresse. Veuillez patienter quelques minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const emailKey = this.forgotEmailKey(emailNormalized);
    const acquired = await redis.set(
      emailKey,
      '1',
      'EX',
      FORGOT_PASSWORD_EMAIL_COOLDOWN_SECONDS,
      'NX',
    );
    return { emailThrottled: acquired !== 'OK' };
  }
}
