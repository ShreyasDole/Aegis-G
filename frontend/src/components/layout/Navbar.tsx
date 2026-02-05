'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Threats', path: '/threats', icon: '🚨' },
  { name: 'Network', path: '/network', icon: '🕸️' },
  { name: 'Forensics', path: '/forensics', icon: '🔍' },
  { name: 'Sharing', path: '/sharing', icon: '🔗' },
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
            <div className="text-3xl group-hover:scale-110 transition-transform">
              🛡️
            </div>
            <div className="font-display text-2xl font-bold text-glow-blue">
              AEGIS-G
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
                    px-4 py-2 rounded-md text-sm font-medium transition-all relative
                    ${isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                    }
                  `}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-glow-blue" />
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
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-secondary to-primary text-white text-sm font-medium hover:shadow-glow-purple transition-all"
            title="AI Manager (Ctrl+M)"
          >
            <span>🤖</span>
            <span>AI Manager</span>
            <kbd className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">⌘M</kbd>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-md hover:bg-bg-tertiary transition-colors">
            <span className="text-xl">🔔</span>
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger rounded-full text-white text-xs flex items-center justify-center animate-pulse">
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
              A
            </div>
          </div>

          {/* Settings */}
          <button className="p-2 rounded-md hover:bg-bg-tertiary transition-colors">
            <span className="text-xl">⚙️</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

