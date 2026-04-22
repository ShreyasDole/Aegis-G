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
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[896px] z-50">
        <div className="glass-panel rounded-full h-14 px-4 flex items-center justify-between shadow-card">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-bg-base transition-transform group-hover:scale-105">
              <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="font-display text-white text-xl tracking-tight hidden sm:block">AEGIS-G</span>
          </Link>

          {/* Center Nav */}
          <nav className="flex items-center gap-1 sm:gap-2">
             {NAVIGATION.map(({ href, label }) => {
              const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    isActive 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4 hidden md:flex text-xs font-bold uppercase tracking-widest text-white">
            <button onClick={() => window.dispatchEvent(new CustomEvent('openAIAssistant'))} className="hover:text-neon-cyan transition-colors">
              AI_AGENT
            </button>
            <button onClick={logout} className="hover:text-neon-magenta transition-colors">
              DISCONNECT
            </button>
          </div>
          
          <div className="md:hidden">
            <button onClick={logout} className="text-white/60 hover:text-white">
              <LogOut className="w-4 h-4" />
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
