'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import {
  LayoutDashboard, Network, Shield, FileText, AlertTriangle,
  Search, Cpu, LogOut, Sparkles, Radio, ChevronRight,
  Layers, Share2, BookOpen,
} from 'lucide-react';
import { StatusBar } from '@/components/ui/StatusBar';

/* ─── Navigation config ─── */
const PRIMARY_NAV = [
  { href: '/dashboard',  label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/scans',      label: 'Incoming Scans',   icon: Search },
  { href: '/network',    label: 'Graph Intelligence',icon: Network },
  { href: '/policy',     label: 'Policy Engine',    icon: Shield },
  { href: '/reports',    label: 'Reports',          icon: FileText },
  { href: '/threats',    label: 'Threat Analysis',  icon: AlertTriangle },
];

const OPS_NAV = [
  { href: '/campaign', label: 'Campaign',  icon: Layers },
  { href: '/ledger',   label: 'Ledger',   icon: BookOpen },
  { href: '/sharing',  label: 'Sharing',  icon: Share2 },
];

/* ─── Sidebar nav link ─── */
function NavLink({
  href, label, icon: Icon, active,
}: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <Link href={href} className={`nav-item ${active ? 'active' : ''}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
      <span>{label}</span>
    </Link>
  );
}

/* ─── Main Shell ─── */
export function EnterpriseShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [health, setHealth] = useState({ database: false, ai_engine: false });
  const [user, setUser]     = useState<{ name: string; email: string; role: string } | null>(null);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef  = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* Load user */
  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) { try { setUser(JSON.parse(u)); } catch {} }
  }, []);

  /* Health check */
  useEffect(() => {
    const check = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/system/health`);
        if (res.ok) {
          const d = await res.json();
          setHealth({ database: !!d.database, ai_engine: !!d.ai_engine });
        }
      } catch { setHealth({ database: false, ai_engine: false }); }
    };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, []);

  /* Close menu on outside click */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); }
      if (e.key === 'F' && !e.metaKey && !e.ctrlKey && !(e.target as HTMLElement).matches('input,textarea')) {
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const openAi = () => window.dispatchEvent(new CustomEvent('openAIAssistant'));

  /* Current page label */
  const currentPage =
    [...PRIMARY_NAV, ...OPS_NAV].find(n => pathname === n.href || (n.href !== '/dashboard' && pathname?.startsWith(n.href)))?.label
    || 'Dashboard';

  /* User initials */
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        {/* Workspace logo — 48px */}
        <div
          className="flex items-center gap-2.5 px-4 border-b"
          style={{ height: '48px', minHeight: '48px', borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            <Shield className="w-3 h-3 text-white" strokeWidth={2} />
          </div>
          <span className="font-semibold text-sm text-[#f3f4f6] tracking-tight">AEGIS-G</span>
          <span
            className="ml-auto mono-10 px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(94,106,210,0.12)', color: 'var(--accent)', border: '1px solid rgba(94,106,210,0.2)' }}
          >
            ENT
          </span>
        </div>

        {/* Nav scroll area */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
          <div className="nav-label">Main</div>
          {PRIMARY_NAV.map(({ href, label, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname === href || (href !== '/dashboard' && !!pathname?.startsWith(href))}
            />
          ))}

          <div className="nav-label mt-3">Operations</div>
          {OPS_NAV.map(({ href, label, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname === href}
            />
          ))}


        </nav>

        {/* Platform status */}
        <div
          className="px-3 py-2 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between text-2xs mb-1.5">
            <span className="flex items-center gap-1.5 text-[#6b7280]">
              <Radio className={`w-3 h-3 ${health.database ? 'text-[#10b981]' : 'text-[#ef4444]'}`} />
              Data plane
            </span>
            <span className={`mono-10 ${health.database ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
              {health.database ? 'Online' : 'Down'}
            </span>
          </div>
          <div className="flex items-center justify-between text-2xs">
            <span className="flex items-center gap-1.5 text-[#6b7280]">
              <Cpu className={`w-3 h-3 ${health.ai_engine ? 'text-[#10b981]' : 'text-[#ef4444]'}`} />
              AI services
            </span>
            <span className={`mono-10 ${health.ai_engine ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
              {health.ai_engine ? 'Online' : 'Down'}
            </span>
          </div>
        </div>

        {/* User footer — 48px */}
        <div
          className="border-t"
          style={{ height: '48px', minHeight: '48px', borderColor: 'var(--border-subtle)' }}
          ref={menuRef}
        >
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full h-full flex items-center gap-2.5 px-4 hover:bg-[rgba(255,255,255,0.03)] transition-colors"
          >
            {/* 20px avatar */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 text-[9px] font-semibold"
              style={{ background: 'var(--accent)' }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-xs font-medium text-[#f3f4f6] truncate">{user?.name || 'User'}</div>
              <div className="mono-10 text-[#6b7280] truncate">{user?.role || 'analyst'}</div>
            </div>
            <ChevronRight className="w-3 h-3 text-[#4b5563] shrink-0" />
          </button>

          {menuOpen && (
            <div
              className="absolute bottom-full left-4 right-4 mb-1 rounded-lg border overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-50"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-medium)' }}
            >
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div
        className="flex flex-col flex-1 min-h-screen min-w-0"
        style={{ marginLeft: '240px', marginBottom: '32px' }}
      >
        {/* Header — 48px */}
        <header className="app-header">
          {/* Breadcrumb */}
          <div className="breadcrumb flex-1">
            <span className="text-[#4b5563]">AEGIS-G</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{currentPage}</span>
          </div>

          {/* AI Assistant button — in breadcrumb bar */}
          <button
            onClick={openAi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0"
            style={{ background: 'rgba(94,106,210,0.12)', border: '1px solid rgba(94,106,210,0.25)', color: '#5e6ad2' }}
          >
            <Sparkles className="w-3 h-3" />
            AI Assistant
            <kbd className="ml-1 px-1 rounded text-[9px]" style={{ background: 'rgba(94,106,210,0.2)', color: '#8b96e9', fontFamily: 'JetBrains Mono' }}>⌘M</kbd>
          </button>

          {/* Search */}
          <div
            className={`search-bar transition-all duration-200 ${searchOpen ? 'w-60' : 'w-32'}`}
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
          >
            <Search className="w-3 h-3 flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
              className="bg-transparent border-none outline-none flex-1 text-xs text-[#f3f4f6]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            {!searchOpen && (
              <kbd
                className="shrink-0 px-1 py-0.5 rounded text-[9px]"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}
              >
                F
              </kbd>
            )}
          </div>

          {/* New scan CTA */}
          <Link href="/scans">
            <button className="btn-new btn-md" style={{ borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600 }}>
              New Scan
            </button>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {children}
        </main>
      </div>

      {/* ── STATUS BAR ── */}
      <StatusBar />
    </div>
  );
}
