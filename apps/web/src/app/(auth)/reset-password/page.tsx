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
        <div className="mt-5 border-t border-slate-100 pt-4 text-center text-[13px] text-slate-500">
          <a
            href="/login"
            className="font-bold text-[#0284c7] hover:text-[#ea580c] transition-colors"
          >
            ← Retour à la connexion
          </a>
        </div>
      }
    >
      <ResetPasswordForm initialEmail={params.email ?? ''} initialToken={params.token ?? ''} />
    </G4dAuthShell>
  );
}
