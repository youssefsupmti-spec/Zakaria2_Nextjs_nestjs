import { G4dAuthShell } from '@/components/auth/auth-shell';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const params = await searchParams;

  return (
    <G4dAuthShell
      title="Nouveau mot de passe"
      subtitle="Définissez un nouveau mot de passe sécurisé pour votre compte G4D."
      footer={
        <div className="g4d-auth-footer-block">
          <a href="/login" className="g4d-auth-link">
            ← Retour à la connexion
          </a>
        </div>
      }
    >
      <ResetPasswordForm
        initialEmail={params.email ?? ''}
        initialToken={params.token ?? ''}
      />
    </G4dAuthShell>
  );
}

