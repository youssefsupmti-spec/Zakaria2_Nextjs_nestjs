import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { AppShell } from '@/components/app-shell/app-shell';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/lib/client-rbac';
import { requireServerAuthSession } from '@/lib/server-auth';
import '../global.css';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [session, cookieStore] = await Promise.all([requireServerAuthSession(), cookies()]);
  const defaultSidebarOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <QueryProvider>
      <AuthProvider initialUser={session.user}>
        <AppShell defaultSidebarOpen={defaultSidebarOpen}>{children}</AppShell>
      </AuthProvider>
    </QueryProvider>
  );
}
