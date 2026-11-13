import { requireServerAuthSession } from '@/lib/server-auth';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await requireServerAuthSession();

  return (
    <DashboardClient
      user={session.user}
      sessionExpiresAt={session.sessionExpiresAt}
      sessionDuration={session.sessionDuration}
    />
  );
}

