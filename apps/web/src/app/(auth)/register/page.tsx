import Link from 'next/link';
import { redirect } from 'next/navigation';
import { G4dAuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';
import { getServerAuthSession } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const existingSession = await getServerAuthSession();
  if (existingSession) {
    redirect('/dashboard');
  }

  return (
    <G4dAuthShell
      title="Ouvrir un compte vendeur"
      subtitle="Créez votre accès partenaire et déclarez votre première enseigne en deux étapes."
      footer={
        <div className="mt-5 border-t border-slate-100 pt-4 text-center text-[13px] text-slate-500">
          Déjà inscrit ?{' '}
          <Link
            href="/login"
            className="font-bold text-[#0284c7] hover:text-[#ea580c] transition-colors"
          >
            Se connecter à votre espace
          </Link>
        </div>
      }
    >
      <RegisterForm />
    </G4dAuthShell>
  );
}
