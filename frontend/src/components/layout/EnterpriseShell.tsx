'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import {
  LayoutDashboard,
  Network,
  Shield,
  FileText,
  AlertTriangle,
  Activity,
  Cpu,
  LogOut,
  Sparkles,
  Radio,
  Search,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

const PRIMARY_NAV: { href: string; label: string; icon: React.ElementType }[] = [
  { href: '/dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
  { href: '/scans', label: 'Incoming Scans', icon: Search },
  { href: '/network', label: 'Graph Intelligence', icon: Network },
  { href: '/policy', label: 'Policy Engine', icon: Shield },
  { href: '/reports', label: 'Reports Overview', icon: FileText },
  { href: '/threats', label: 'Threat Analysis', icon: AlertTriangle },
];

const SECONDARY_NAV: { href: string; label: string }[] = [
  { href: '/campaign', label: 'Campaign' },
  { href: '/ledger', label: 'Ledger' },
  { href: '/sharing', label: 'Sharing' },
];

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
    <div className="flex min-h-screen bg-black-true font-satoshi selection:bg-neon-magenta/30 selection:text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 w-64 border-r border-white/10 bg-black-true flex flex-col overflow-hidden">
        {/* Subtle Sidebar Grid */}
        <div className="absolute inset-0 bg-grid opacity-50 z-0 pointer-events-none" />
        
        <div className="p-5 border-b border-white/10 relative z-10">
          <Link href="/dashboard" className="font-cabinet text-2xl font-black tracking-tighter text-white block hover:text-neon-cyan transition-colors uppercase">
            AEGIS-G
          </Link>
          <p className="font-space text-[10px] text-neon-lime uppercase tracking-widest mt-1.5 font-bold">Enterprise Security</p>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1 relative z-10">
          {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition-all font-space uppercase tracking-wider ${
                  active
                    ? 'bg-neon-cyan/5 text-neon-cyan border border-neon-cyan/20 shadow-[inset_3px_0_0_0_#00f2ff]'
                    : 'text-white/60 border border-transparent hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-neon-cyan' : 'group-hover:text-neon-magenta'}`} strokeWidth={2} />
                {label}
              </Link>
            );
          })}

          <div className="pt-6 pb-2 px-1">
            <p className="font-space text-[10px] font-bold uppercase tracking-widest text-neon-magenta">Operations</p>
          </div>
          {SECONDARY_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2.5 font-space text-[11px] font-bold uppercase tracking-widest transition-colors ${
                pathname === href
                  ? 'text-neon-magenta bg-neon-magenta/5 border border-neon-magenta/20'
                  : 'text-white/50 hover:text-neon-magenta hover:bg-neon-magenta/5 border border-transparent'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3 relative z-10 bg-black-true/80 backdrop-blur-md">
          <button
            type="button"
            onClick={openAi}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold uppercase tracking-widest font-space bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/30 hover:bg-neon-magenta/20 hover:shadow-glow-magenta transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
            AI Assistant
            <span className="text-[9px] text-neon-magenta/50 normal-case ml-1">⌘M</span>
          </button>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-md">
            <p className="font-space text-[10px] font-bold uppercase tracking-widest text-neon-cyan mb-3 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Platform
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between font-space text-[10px] uppercase font-bold tracking-wider">
                <span className="flex items-center gap-2 text-white/60">
                  <Radio className={`w-3 h-3 ${health.database ? 'text-neon-lime' : 'text-neon-magenta'}`} />
                  Data plane
                </span>
                <span className={health.database ? 'text-neon-lime' : 'text-neon-magenta'}>{health.database ? 'Live' : 'Down'}</span>
              </div>
              <div className="flex items-center justify-between font-space text-[10px] uppercase font-bold tracking-wider">
                <span className="flex items-center gap-2 text-white/60">
                  <Cpu className={`w-3 h-3 ${health.ai_engine ? 'text-neon-cyan' : 'text-neon-magenta'}`} />
                  AI services
                </span>
                <span className={health.ai_engine ? 'text-neon-cyan' : 'text-neon-magenta'}>{health.ai_engine ? 'Live' : 'Down'}</span>
              </div>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-full flex items-center gap-3 rounded-lg p-2.5 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 text-left group"
            >
              <div className="w-8 h-8 rounded shrink-0 bg-white/10 border border-white/20 flex items-center justify-center text-white font-cabinet font-bold group-hover:border-neon-lime group-hover:text-neon-lime transition-colors">
                {user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'TU'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-space font-bold uppercase tracking-widest text-[11px] text-white truncate group-hover:text-neon-lime transition-colors">{user?.name || 'Test User'}</div>
                <div className="font-space font-bold uppercase tracking-wider text-[9px] text-white/50 truncate">{user?.role || 'analyst'}</div>
              </div>
            </button>
            {menuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-black-true border border-white/20 rounded-lg shadow-2xl overflow-hidden backdrop-blur-xl z-50">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 font-space text-[10px] font-bold uppercase tracking-widest text-neon-magenta hover:bg-neon-magenta/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Initialize Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Canvas Space */}
      <div className="flex-1 ml-64 min-h-screen bg-black-true relative overflow-hidden text-white border-l border-white/10">
        <div className="absolute inset-0 bg-grid opacity-100 z-0 pointer-events-none" />
        <div className="scanline" />
        {/* Neon Glow Splash behind content */}
        <div className="pointer-events-none absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-neon-cyan/5 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-neon-magenta/5 blur-[120px]" />
        
        <div className="relative z-10 px-8 py-8">{children}</div>
      </div>
    </div>
  );
}
