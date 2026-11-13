import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export default async function NotFound() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect('/login');
  }
  redirect('/dashboard');
}
