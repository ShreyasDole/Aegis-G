'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/', '/auth/callback'];
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname?.startsWith('/auth/') ||
    pathname?.startsWith('/stitch-embed');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      
      // Redirect to login if trying to access protected route
      if (!isPublicRoute) {
        router.push('/login');
      }
    }
  }, [pathname, router, isPublicRoute]);

  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  // If on public route and authenticated, redirect to dashboard
  if (isPublicRoute && isAuthenticated && pathname === '/') {
    router.push('/dashboard');
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-text-secondary">Redirecting...</div>
      </div>
    );
  }

  // If not authenticated and trying to access protected route, show nothing (redirecting)
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-text-secondary">Redirecting to login...</div>
      </div>
    );
  }

  // Allow access
  return <>{children}</>;
}

