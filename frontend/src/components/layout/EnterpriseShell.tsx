'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import {
  Shield,
  LogOut,
  Sparkles,
  Cpu,
  Radio,
} from 'lucide-react';

export function EnterpriseShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [health, setHealth] = useState({ database: false, ai_engine: false });
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/system/health`);
        if (res.ok) {
          const data = await res.json();
          setHealth({ database: !!data.database, ai_engine: !!data.ai_engine });
        }
      } catch {
        setHealth({ database: false, ai_engine: false });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const openAi = () => {
    window.dispatchEvent(new CustomEvent('openAIAssistant'));
  };

  return (
    <div className="flex flex-col min-h-screen bg-black-true font-satoshi selection:bg-neon-magenta/30 selection:text-white">
      {/* Background & Effects */}
      <div className="fixed inset-0 bg-grid opacity-100 z-0 pointer-events-none" />
      <div className="fixed inset-0 scanline pointer-events-none z-10" />
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-cyan/10 via-neon-cyan/5 to-transparent pointer-events-none z-0 will-change-transform" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-magenta/10 via-neon-magenta/5 to-transparent pointer-events-none z-0 will-change-transform" />

      {/* TOP NAVIGATION */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-[1024px] z-50 px-4">
        <div className="flex items-center justify-between px-6 py-4 bg-black-true/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 hover:scale-105 transition-transform group">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center group-hover:bg-neon-cyan transition-colors overflow-hidden">
              <img src="/logo.png" alt="Aegis Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-cabinet font-bold uppercase tracking-tight text-lg text-white">Aegis-G</span>
          </Link>

          {/* Center Links */}
          <div className="hidden lg:flex items-center gap-5 font-space text-[10px] tracking-[0.1em] uppercase font-bold text-white/60">
            {[
              { href: '/dashboard', label: 'Home' },
              { href: '/scans', label: 'Scans' },
              { href: '/redteam', label: 'Simulator' },
              { href: '/threats', label: 'Threats' },
              { href: '/network', label: 'Graph' },
              { href: '/policy', label: 'Policy' },
              { href: '/reports', label: 'Reports' },
              { href: '/campaign', label: 'Campaign' },
              { href: '/ledger', label: 'Ledger' },
            ].map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors whitespace-nowrap ${
                    isActive ? 'text-neon-cyan' : 'hover:text-neon-cyan'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={openAi}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full font-space text-[10px] uppercase font-bold tracking-widest bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/30 hover:bg-neon-magenta/20 hover:shadow-glow-magenta transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Assistant
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white font-cabinet font-bold hover:border-neon-lime hover:text-neon-lime transition-all"
              >
                {user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'TU'}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-4 w-64 bg-black-true border border-white/20 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50">
                  <div className="p-4 border-b border-white/10">
                    <p className="font-space font-bold uppercase tracking-widest text-[11px] text-white truncate">
                      {user?.name || 'Test User'}
                    </p>
                    <p className="font-space font-bold uppercase tracking-wider text-[9px] text-white/50 truncate">
                      {user?.role || 'analyst'}
                    </p>
                  </div>

                  <div className="p-4 border-b border-white/10 space-y-3">
                    <div className="flex items-center justify-between font-space text-[10px] uppercase font-bold tracking-wider">
                      <span className="flex items-center gap-2 text-white/60">
                        <Radio className={`w-3 h-3 ${health.database ? 'text-neon-lime' : 'text-neon-magenta'}`} />
                        Data plane
                      </span>
                      <span className={health.database ? 'text-neon-lime' : 'text-neon-magenta'}>
                        {health.database ? 'Live' : 'Down'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-space text-[10px] uppercase font-bold tracking-wider">
                      <span className="flex items-center gap-2 text-white/60">
                        <Cpu className={`w-3 h-3 ${health.ai_engine ? 'text-neon-cyan' : 'text-neon-magenta'}`} />
                        AI services
                      </span>
                      <span className={health.ai_engine ? 'text-neon-cyan' : 'text-neon-magenta'}>
                        {health.ai_engine ? 'Live' : 'Down'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 font-space text-[10px] font-bold uppercase tracking-widest text-neon-magenta hover:bg-neon-magenta/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout Sequence
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      {/* We add pt-32 to push content below the fixed header */}
      <main className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-6 py-32 flex flex-col">
        {children}
      </main>
    </div>
  );
}

