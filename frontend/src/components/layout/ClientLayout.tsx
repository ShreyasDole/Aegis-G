'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { EnterpriseShell } from '@/components/layout/EnterpriseShell';
import { AIManager } from '@/components/ai/AIManager';
import { AuthGuard } from '@/components/auth/AuthGuard';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoutes = ['/login', '/register', '/'];
  const noShell = publicRoutes.includes(pathname) || pathname?.startsWith('/stitch-embed');
  const useShell = !noShell;

  if (!useShell) {
    return (
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-screen"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    );
  }

  return (
    <AuthGuard>
      <EnterpriseShell>
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-screen"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </EnterpriseShell>
      <AIManager />
    </AuthGuard>
  );
}
