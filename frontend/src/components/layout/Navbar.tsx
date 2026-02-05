'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Threats', path: '/threats' },
  { name: 'Network Analysis', path: '/network' },
  { name: 'Forensics', path: '/forensics' },
  { name: 'Intel Sharing', path: '/sharing' },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [notifications] = useState(3);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-secondary/95 backdrop-blur-sm border-b border-border-subtle h-16">
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="font-display text-xl font-bold tracking-wider text-primary">
              AEGIS-G
            </div>
            <div className="h-6 w-px bg-border-medium"></div>
            <div className="text-sm text-text-secondary font-medium">
              Command Center
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    px-4 py-2 text-sm font-medium transition-all relative
                    ${isActive 
                      ? 'text-primary' 
                      : 'text-text-secondary hover:text-text-primary'
                    }
                  `}
                >
                  {item.name}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* AI Manager Shortcut */}
          <button 
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all border border-primary/30"
            title="AI Assistant (Ctrl+M)"
          >
            <span>AI Assistant</span>
            <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-xs text-text-muted">⌘M</kbd>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded hover:bg-bg-tertiary transition-colors">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger rounded-full text-white text-xs flex items-center justify-center font-semibold">
                {notifications}
              </span>
            )}
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:block text-right">
              <div className="text-sm font-medium text-text-primary">Admin User</div>
              <div className="text-xs text-text-muted">Administrator</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-bold text-sm">
              AU
            </div>
          </div>

          {/* Settings */}
          <button className="p-2 rounded hover:bg-bg-tertiary transition-colors" title="Settings">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

