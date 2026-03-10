'use client';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { AIManager } from '@/components/ai/AIManager';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoutes = ['/login', '/register', '/'];
  const showNavbar = !publicRoutes.includes(pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "pt-16" : ""}>
        {children}
      </main>
      {showNavbar && <AIManager />}
    </>
  );
}

