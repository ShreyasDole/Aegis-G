'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { ShieldCheck, LogOut } from 'lucide-react';
import { ScanlineOverlay } from '@/components/cyber/ScanlineOverlay';

const NAVIGATION = [
  { href: '/dashboard', label: 'COMMAND_CENTER' },
  { href: '/scans', label: 'FORENSICS' },
  { href: '/network', label: 'GRAPH_INTEL' },
  { href: '/policy', label: 'POLICY' },
  { href: '/threats', label: 'THREATS' },
  { href: '/ledger', label: 'LEDGER' },
  { href: '/sharing', label: 'SHARING' },
];

export function EnterpriseShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-base text-white/60 selection:bg-neon-cyan/30 selection:text-white">
      {/* Dynamic Scanline */}
      <ScanlineOverlay />

      {/* FIXED NAVIGATION */}
      <header className="fixed top-4 left-0 right-0 mx-auto w-[96%] max-w-[1280px] z-50">
        <div className="glass-panel rounded-full h-12 px-5 flex items-center gap-3 shadow-card">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-bg-base transition-transform group-hover:scale-105">
              <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-white text-base tracking-tight hidden lg:block">AEGIS-G</span>
          </Link>

          <div className="w-px h-5 bg-white/10 shrink-0" />

          {/* Center Nav — scrollable on small screens */}
          <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            {NAVIGATION.map(({ href, label }) => {
              const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-2.5 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openAIAssistant'))}
              className="hidden md:block text-[9px] font-bold uppercase tracking-widest text-neon-cyan hover:text-white transition-colors"
            >
              AI
            </button>
            <button
              onClick={logout}
              className="text-white/50 hover:text-neon-magenta transition-colors"
              title="Disconnect"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative w-full pt-32 pb-24 z-10">
        {children}
      </main>
    </div>
  );
}
