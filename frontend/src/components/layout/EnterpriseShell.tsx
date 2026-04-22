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
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

const PRIMARY_NAV: { href: string; label: string; icon: React.ElementType }[] = [
  { href: '/dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
  { href: '/network', label: 'Graph Intelligence', icon: Network },
  { href: '/policy', label: 'Policy Engine', icon: Shield },
  { href: '/reports', label: 'Reports Overview', icon: FileText },
  { href: '/threats', label: 'Threat Analysis', icon: AlertTriangle },
];

const SECONDARY_NAV: { href: string; label: string }[] = [
  { href: '/scans', label: 'Incoming Scans' },
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
        const res = await fetch(`/api/system/health`);
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
    <div className="flex min-h-screen bg-bg-primary">
      <aside className="fixed left-0 top-0 bottom-0 z-40 w-64 border-r border-border-subtle bg-[#14151a] flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.35)]">
        <div className="p-5 border-b border-border-subtle">
          <Link href="/dashboard" className="font-display text-lg font-bold tracking-[0.18em] text-text-primary block hover:text-primary transition-colors">
            AEGIS-G
          </Link>
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] mt-1.5">Enterprise Security</p>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
          {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary/12 text-primary border border-primary/25 shadow-[inset_3px_0_0_0_rgba(59,130,246,0.9)]'
                    : 'text-text-secondary border border-transparent hover:bg-bg-tertiary/60 hover:text-text-primary'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 opacity-90" strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}

          <div className="pt-4 pb-1 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Operations</p>
          </div>
          {SECONDARY_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                pathname === href
                  ? 'text-primary bg-bg-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-primary/50'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border-subtle space-y-2">
          <button
            type="button"
            onClick={openAi}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Assistant
            <span className="text-[9px] font-mono text-text-muted normal-case">⌘M</span>
          </button>

          <Card className="p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Platform
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <Radio className={`w-3 h-3 ${health.database ? 'text-success' : 'text-danger'}`} />
                  Data plane
                </span>
                <span className={health.database ? 'text-success' : 'text-danger'}>{health.database ? 'Live' : 'Down'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <Cpu className={`w-3 h-3 ${health.ai_engine ? 'text-success' : 'text-danger'}`} />
                  AI services
                </span>
                <span className={health.ai_engine ? 'text-success' : 'text-danger'}>{health.ai_engine ? 'Live' : 'Down'}</span>
              </div>
            </div>
          </Card>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-full flex items-center gap-2 rounded-lg p-2 hover:bg-bg-primary transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-text-primary truncate">{user?.name || 'User'}</div>
                <div className="text-[10px] text-text-muted truncate">{user?.role || 'Analyst'}</div>
              </div>
            </button>
            {menuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-bg-secondary border border-border-subtle rounded-lg shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/10"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 ml-64 min-h-screen bg-gradient-to-b from-[#191a1f] via-bg-primary to-[#121318] relative">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 120% 80% at 100% 0%, rgba(59, 130, 246, 0.06), transparent 50%)',
          }}
        />
        {/* pb-24 = clearance for fixed bottom-right AI button */}
        <div className="relative z-0 pb-24">{children}</div>
      </div>
    </div>
  );
}
