'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [inferenceMode, setInferenceMode] = useState<'local' | 'cloud'>(() => {
    if (typeof window === 'undefined') return 'local';
    return (localStorage.getItem('inference-mode') as 'local' | 'cloud') || 'local';
  });
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [notifications] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
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
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAIAssistant = () => {
    window.dispatchEvent(new CustomEvent('openAIAssistant'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleSettings = () => {
    setShowUserMenu(false);
    console.log('Settings clicked');
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
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Phase 2: Inference Toggle */}
          <div className="hidden lg:flex items-center bg-bg-primary border border-border-subtle rounded-full p-1 gap-1">
            <button 
              onClick={() => { setInferenceMode('local'); localStorage.setItem('inference-mode', 'local'); }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${inferenceMode === 'local' ? 'bg-primary text-white shadow-glow-blue' : 'text-text-muted hover:text-text-secondary'}`}
            >
              ● LOCAL CPU
            </button>
            <button 
              onClick={() => { setInferenceMode('cloud'); localStorage.setItem('inference-mode', 'cloud'); }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${inferenceMode === 'cloud' ? 'bg-secondary text-white shadow-glow-purple' : 'text-text-muted hover:text-text-secondary'}`}
            >
              ○ CLOUD API
            </button>
          </div>

          <Button 
            variant="secondary" 
            className="text-xs py-1.5 h-8 opacity-70 hover:opacity-100" 
            onClick={() => router.push('/threats')}
            title="Go to Threats to export STIX bundles"
          >
            Export SIEM
          </Button>

          {/* AI Assistant Shortcut */}
          <button 
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all border border-primary/30"
            title="AI Assistant (Ctrl+M)"
            onClick={handleAIAssistant}
          >
            <span>AI Assistant</span>
            <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-xs text-text-muted">⌘M</kbd>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button 
              className="relative p-2 rounded hover:bg-bg-tertiary transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-danger rounded-full text-white text-xs flex items-center justify-center font-semibold">
                  {notifications}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-bg-secondary border border-border-subtle rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-border-subtle">
                  <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                </div>
                <div className="p-2">
                  {notifications > 0 ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-bg-primary rounded hover:bg-bg-tertiary cursor-pointer">
                        <div className="text-sm font-medium text-text-primary">New threat detected</div>
                        <div className="text-xs text-text-secondary mt-1">2 minutes ago</div>
                      </div>
                      <div className="p-3 bg-bg-primary rounded hover:bg-bg-tertiary cursor-pointer">
                        <div className="text-sm font-medium text-text-primary">System backup completed</div>
                        <div className="text-xs text-text-secondary mt-1">15 minutes ago</div>
                      </div>
                      <div className="p-3 bg-bg-primary rounded hover:bg-bg-tertiary cursor-pointer">
                        <div className="text-sm font-medium text-text-primary">AI analysis ready</div>
                        <div className="text-xs text-text-secondary mt-1">1 hour ago</div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-text-secondary text-sm">No new notifications</div>
                  )}
                </div>
                {notifications > 0 && (
                  <div className="p-2 border-t border-border-subtle">
                    <button className="w-full text-sm text-primary hover:text-blue-400 text-center py-2" onClick={() => setShowNotifications(false)}>
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile with Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              className="flex items-center gap-3 hover:bg-bg-tertiary rounded-lg p-1 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="hidden lg:block text-right">
                <div className="text-sm font-medium text-text-primary">{user?.name || 'Admin User'}</div>
                <div className="text-xs text-text-muted">{user?.role || 'Administrator'}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-bold text-sm">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AU'}
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary border border-border-subtle rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <div className="px-3 py-2 border-b border-border-subtle">
                    <div className="text-sm font-medium text-text-primary">{user?.name || 'Admin User'}</div>
                    <div className="text-xs text-text-muted">{user?.email || 'admin@agency.gov'}</div>
                  </div>
                  <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary rounded transition-colors" onClick={() => { setShowUserMenu(false); handleSettings(); }}>
                    Settings
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary rounded transition-colors" onClick={() => { setShowUserMenu(false); router.push('/profile'); }}>
                    Profile
                  </button>
                  <div className="border-t border-border-subtle my-1"></div>
                  <button className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded transition-colors" onClick={handleLogout}>
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
};
