import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell/app-shell';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/lib/client-rbac';
import { requireServerAuthSession } from '@/lib/server-auth';
import '../global.css';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireServerAuthSession();

  return (
    <QueryProvider>
      <AuthProvider initialUser={session.user}>
        <AppShell>{children}</AppShell>
      </AuthProvider>
    </QueryProvider>
  );
}
