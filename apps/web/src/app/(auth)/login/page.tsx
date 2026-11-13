import { redirect } from 'next/navigation';
import { G4dAuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';
import { getServerAuthSession } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const existingSession = await getServerAuthSession();
  if (existingSession) {
    redirect('/dashboard');
  }

  return (
    <G4dAuthShell title="Connexion" subtitle="Accédez à votre espace logistique G4D">
      <LoginForm />

      <div className="g4d-auth-divider flex items-center gap-3 mt-[22px] mb-[18px]">
        <span className="g4d-auth-divider-line h-px flex-1 bg-[#EEF2F6]" />
        <span className="g4d-auth-divider-text text-[12px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
          ou
        </span>
        <span className="g4d-auth-divider-line h-px flex-1 bg-[#EEF2F6]" />
      </div>

      <div className="g4d-auth-footer-block mt-[6px] pt-5 border-t border-[#EEF2F6] text-center text-[13.5px] font-semibold text-[#64748B]">
        Vous n&apos;avez pas de compte&nbsp;?{' '}
        <a
          href="/#couverture"
          className="g4d-auth-link text-[#1B9DD9] font-extrabold no-underline hover:underline"
        >
          Créer un compte
        </a>
      </div>
    </G4dAuthShell>
  );
}
