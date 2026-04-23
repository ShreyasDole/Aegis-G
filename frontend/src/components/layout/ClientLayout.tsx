'use client';
import { usePathname } from 'next/navigation';
import { EnterpriseShell } from '@/components/layout/EnterpriseShell';
import { AIManager } from '@/components/ai/AIManager';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AnimatePresence, motion } from 'framer-motion';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoutes = ['/login', '/register', '/'];
  const noShell = publicRoutes.includes(pathname) || pathname?.startsWith('/stitch-embed');
  const useShell = !noShell;

  // Animation variants for page transitions
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  // Public routes don't need auth
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

