import { describe, expect, it } from 'vitest';
import { getBullMqConnectionOptions, loadBackendEnv } from '@zakaria/backend-config';

describe('Configuration Backend & Worker SMTP / Redis (Lot 2.5)', () => {
  it('refuse mailpit par défaut en production et active SMTP_CONFIGURED uniquement si configuré', () => {
    const prodWithoutMail = loadBackendEnv({
      NODE_ENV: 'production',
      AUTH_SECRET: 'super-secret-prod-token-123456',
      DATABASE_URL: 'postgresql://user:pass@db:5432/g4d',
    });
    expect(prodWithoutMail.MAIL_HOST).toBe('');
    expect(prodWithoutMail.SMTP_CONFIGURED).toBe(false);

    const prodWithMailpit = loadBackendEnv({
      NODE_ENV: 'production',
      AUTH_SECRET: 'super-secret-prod-token-123456',
      MAIL_HOST: 'mailpit',
    });
    expect(prodWithMailpit.SMTP_CONFIGURED).toBe(false);

    const prodWithSmtp = loadBackendEnv({
      NODE_ENV: 'production',
      AUTH_SECRET: 'super-secret-prod-token-123456',
      MAIL_HOST: 'smtp.resend.com',
      MAIL_PORT: '587',
    });
    expect(prodWithSmtp.SMTP_CONFIGURED).toBe(true);
  });

  it('sépare proprement redis-cache (LRU) et redis-queue (BullMQ noeviction)', () => {
    const env = loadBackendEnv({
      NODE_ENV: 'development',
      REDIS_CACHE_URL: 'redis://127.0.0.1:56379',
      REDIS_QUEUE_URL: 'redis://default:queuepass@127.0.0.1:56380',
    });

    expect(env.REDIS_CACHE.port).toBe(56379);
    expect(env.REDIS_QUEUE.port).toBe(56380);
    expect(env.REDIS_QUEUE.password).toBe('queuepass');

    const bullMqOpts = getBullMqConnectionOptions(env);
    expect(bullMqOpts.port).toBe(56380);
    expect(bullMqOpts.maxRetriesPerRequest).toBeNull();
  });
});
