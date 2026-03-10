'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect } from 'react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-secondary/95 backdrop-blur-sm border-b border-border-subtle h-16">
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-display text-xl font-bold tracking-wider text-primary">
            AEGIS-G
          </Link>

          <div className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link href="/dashboard" className={`px-3 py-2 ${pathname === '/dashboard' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}>Dashboard</Link>
            <Link href="/scans" className={`px-3 py-2 ${pathname === '/scans' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}>Incoming Scans</Link>
            <Link href="/threats" className={`px-3 py-2 ${pathname === '/threats' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}>Threats</Link>
            <Link href="/policy" className={`px-3 py-2 ${pathname === '/policy' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}>Policy</Link>
            <Link href="/network" className={`px-3 py-2 ${pathname === '/network' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}>Graph</Link>
            <Link href="/sharing" className={`px-3 py-2 ${pathname === '/sharing' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}>Sharing</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={userMenuRef}>
            <button
              className="flex items-center gap-3 hover:bg-bg-tertiary rounded-lg p-1 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="hidden lg:block text-right">
                <div className="text-sm font-medium text-text-primary">{user?.name || 'User'}</div>
                <div className="text-xs text-text-muted">{user?.role || 'Analyst'}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-bold text-sm">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary border border-border-subtle rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <div className="px-3 py-2 border-b border-border-subtle">
                    <div className="text-sm font-medium text-text-primary">{user?.name || 'User'}</div>
                    <div className="text-xs text-text-muted truncate">{user?.email || ''}</div>
                  </div>
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded transition-colors"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
