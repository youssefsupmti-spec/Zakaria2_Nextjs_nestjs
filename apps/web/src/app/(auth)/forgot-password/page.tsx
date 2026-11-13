import { G4dAuthShell } from '@/components/auth/auth-shell';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <G4dAuthShell
      title="Mot de passe oublié"
      subtitle="Saisissez votre adresse e-mail pour recevoir un lien sécurisé de réinitialisation."
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
      <ForgotPasswordForm />
    </G4dAuthShell>
  );
}
