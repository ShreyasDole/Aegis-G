'use client';
import { usePathname } from 'next/navigation';
import { EnterpriseShell } from '@/components/layout/EnterpriseShell';
import { AIManager } from '@/components/ai/AIManager';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DevExtensionSilencer } from '@/components/dev/DevExtensionSilencer';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoutes = ['/login', '/register', '/'];
  const noShell = publicRoutes.includes(pathname) || pathname?.startsWith('/stitch-embed');
  const useShell = !noShell;

  return (
    <>
      <DevExtensionSilencer />
      {!useShell ? (
        <main className="min-h-screen">{children}</main>
      ) : (
        <AuthGuard>
          <EnterpriseShell>
            <main className="min-h-screen">{children}</main>
          </EnterpriseShell>
          <AIManager />
        </AuthGuard>
      )}
    </>
  );
}

