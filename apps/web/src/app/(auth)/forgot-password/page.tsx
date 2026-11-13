import { G4dAuthShell } from '@/components/auth/auth-shell';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <G4dAuthShell
      title="Mot de passe oublié"
      subtitle="Saisissez votre adresse e-mail pour recevoir un lien sécurisé de réinitialisation."
      footer={
        <div className="g4d-auth-footer-block">
          <a href="/login" className="g4d-auth-link">
            ← Retour à la connexion
          </a>
        </div>
      }
    >
      <ForgotPasswordForm />
    </G4dAuthShell>
  );
}
