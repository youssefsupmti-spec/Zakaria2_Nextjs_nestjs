import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import nodemailer, { type Transporter } from 'nodemailer';
import { loadBackendEnv } from '@zakaria/backend-config';
import {
  MAIL_JOB_PASSWORD_RESET,
  MAIL_QUEUE_NAME,
  type PasswordResetMailJobPayload,
} from '@zakaria/shared-contracts';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

@Injectable()
export class MailWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailWorkerService.name);
  private readonly env = loadBackendEnv();
  private transporter: Transporter | null = null;
  private worker: Worker<PasswordResetMailJobPayload> | null = null;

  onModuleInit(): void {
    this.transporter = nodemailer.createTransport({
      host: this.env.MAIL_HOST,
      port: this.env.MAIL_PORT,
      secure: this.env.MAIL_SECURE,
      ...(this.env.MAIL_USER && this.env.MAIL_PASS
        ? {
            auth: {
              user: this.env.MAIL_USER,
              pass: this.env.MAIL_PASS,
            },
          }
        : {}),
    });

    this.worker = new Worker<PasswordResetMailJobPayload>(
      MAIL_QUEUE_NAME,
      async (job) => this.handleJob(job),
      {
        prefix: this.env.REDIS_PREFIX,
        concurrency: 3,
        connection: {
          host: this.env.REDIS_HOST,
          port: this.env.REDIS_PORT,
          username: this.env.REDIS_USERNAME,
          password: this.env.REDIS_PASSWORD,
          maxRetriesPerRequest: null,
        },
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job e-mail '${job.name}' (#${job.id}) traité avec succès.`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Échec job e-mail '${job?.name ?? 'inconnu'}' (#${job?.id ?? '?'}): ${error.message}`,
      );
    });

    this.logger.log(
      `Worker messagerie BullMQ prêt (queue='${MAIL_QUEUE_NAME}', SMTP='${this.env.MAIL_HOST}:${this.env.MAIL_PORT}').`,
    );
  }

  private async handleJob(job: Job<PasswordResetMailJobPayload>): Promise<void> {
    if (job.name !== MAIL_JOB_PASSWORD_RESET) {
      this.logger.warn(`Type de job e-mail ignoré: ${job.name}`);
      return;
    }

    if (!this.transporter) {
      throw new Error('Transporteur SMTP non initialisé.');
    }

    const { email, nomComplet, resetUrl, expiresMinutes } = job.data;
    const safeName = escapeHtml(nomComplet || 'Partenaire G4D');
    const safeUrl = escapeHtml(resetUrl);

    const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
            <tr>
              <td style="background:#0f172a;padding:24px 32px;text-align:left;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.3px;">G4D <span style="color:#1b9dd9;">Delivery</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Réinitialisation de votre mot de passe</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                  Bonjour <strong>${safeName}</strong>,
                </p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">
                  Une demande de réinitialisation de mot de passe a été effectuée pour votre espace G4D. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe&nbsp;:
                </p>
                <p style="margin:0 0 24px;text-align:center;">
                  <a href="${safeUrl}" style="display:inline-block;background:#1b9dd9;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;">
                    Réinitialiser mon mot de passe
                  </a>
                </p>
                <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#64748b;">
                  Ce lien est valable pendant <strong>${expiresMinutes} minutes</strong> et ne peut être utilisé qu'une seule fois.
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;word-break:break-all;">
                  Si le bouton ne s'affiche pas, copiez ce lien dans votre navigateur :<br/>
                  ${safeUrl}
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f1f5f9;padding:16px 32px;font-size:12px;color:#64748b;text-align:center;">
                Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail — votre mot de passe reste inchangé.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const text = [
      `Bonjour ${nomComplet || 'Partenaire G4D'},`,
      '',
      'Une demande de réinitialisation de mot de passe a été effectuée pour votre compte G4D.',
      `Ouvrez ce lien (valable ${expiresMinutes} minutes) :`,
      resetUrl,
      '',
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
    ].join('\n');

    await this.transporter.sendMail({
      from: this.env.MAIL_FROM,
      to: email,
      subject: 'G4D Delivery — Réinitialisation de votre mot de passe',
      text,
      html,
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.transporter) {
      this.transporter.close();
    }
  }
}

