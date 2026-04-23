'use client';
import { usePathname } from 'next/navigation';
import { EnterpriseShell } from '@/components/layout/EnterpriseShell';
import { AIManager } from '@/components/ai/AIManager';
import { AuthGuard } from '@/components/auth/AuthGuard';
export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoutes = ['/login', '/register', '/'];
  const noShell = publicRoutes.includes(pathname) || pathname?.startsWith('/stitch-embed');
  const useShell = !noShell;

  if (!useShell) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <AuthGuard>
      <EnterpriseShell>
        <main className="min-h-screen">{children}</main>
      </EnterpriseShell>
      <AIManager />
    </AuthGuard>
  );
}

