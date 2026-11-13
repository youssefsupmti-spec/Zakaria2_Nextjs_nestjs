import { redirect } from 'next/navigation';
import { G4dAuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';
import { getServerAuthSession } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const rawNext = params?.next;
  const safeNext =
    rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : undefined;

  const existingSession = await getServerAuthSession();
  if (existingSession) {
    redirect(safeNext ?? '/dashboard');
  }

  return (
    <G4dAuthShell title="Connexion" subtitle="Accédez à votre espace logistique G4D">
      <LoginForm nextRedirect={safeNext} />
    </G4dAuthShell>
  );
}
