'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Shield, ChevronRight } from 'lucide-react';

const ERRORS: Record<string, string> = {
  access_denied: 'Microsoft sign-in was cancelled or denied.',
  oauth_failed:  'Microsoft sign-in failed. Please try again.',
  no_email:      'Could not get email from Microsoft account.',
  account_disabled: 'Your account is not active. Contact your administrator.',
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState<string | null>(
    searchParams.get('error') ? ERRORS[searchParams.get('error')!] || null : null
  );
  const [showEmail, setShowEmail] = useState(false);

  const handleMicrosoftLogin = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    window.location.href = `${API_URL}/api/auth/outlook`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const detail = Array.isArray(d.detail) ? d.detail[0]?.msg : d.detail;
        throw new Error(detail || 'Login failed');
      }
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      const userRes = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userRes.ok) {
        const u = await userRes.json();
        localStorage.setItem('user', JSON.stringify({ email: u.email, name: u.full_name || 'Agent', role: u.role }));
      }
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0e0e0e' }}>

      {/* Left branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-80 p-8 border-r"
        style={{ background: '#111113', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-12">
            <div
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ background: 'rgba(94,106,210,0.15)', border: '1px solid rgba(94,106,210,0.25)' }}
            >
              <Shield className="w-4 h-4" style={{ color: '#5e6ad2' }} />
            </div>
            <span className="font-semibold text-[#f3f4f6]">AEGIS-G</span>
          </div>

          <h2 className="text-lg font-semibold text-[#f3f4f6] mb-2">Cognitive Defense Grid</h2>
          <p className="text-sm text-[#6b7280] leading-relaxed mb-8">
            National security operations platform powered by distributed multi-agent AI forensics.
          </p>

          {/* Feature list */}
          {[
            'Multi-modal threat attribution',
            'Real-time graph intelligence',
            'Policy enforcement engine',
            'Blockchain audit ledger',
            'STIX 2.1 intelligence sharing',
          ].map(f => (
            <div key={f} className="flex items-center gap-2.5 mb-3">
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#5e6ad2' }} />
              <span className="text-xs text-[#9ca3af]">{f}</span>
            </div>
          ))}
        </div>

        <p className="text-2xs text-[#4b5563]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          v2.0.0 · Classified
        </p>
      </div>

      {/* Right login area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Shield className="w-5 h-5" style={{ color: '#5e6ad2' }} />
            <span className="font-semibold text-[#f3f4f6]">AEGIS-G</span>
          </div>

          <h1 className="text-xl font-semibold text-[#f3f4f6] mb-1">Sign in</h1>
          <p className="text-sm text-[#6b7280] mb-8">AEGIS-G enterprise portal</p>

          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
            >
              {error}
            </div>
          )}

          {/* Microsoft SSO */}
          <button
            onClick={handleMicrosoftLogin}
            className="btn btn-secondary btn-lg w-full mb-3 justify-center"
            style={{ borderRadius: '6px', gap: '8px' }}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21" fill="none">
              <path d="M10 0H0v10h10V0zm11 0H10.5v10H21V0zM10 10.5H0V21h10V10.5zm11 0H10.5V21H21V10.5z" fill="currentColor" />
            </svg>
            Continue with Microsoft
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs" style={{ background: '#0e0e0e', color: '#4b5563' }}>or</span>
            </div>
          </div>

          {/* Email form toggle */}
          {!showEmail ? (
            <button
              onClick={() => setShowEmail(true)}
              className="btn btn-ghost btn-lg w-full justify-center"
              style={{ borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Continue with email
            </button>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Demo hint */}
              <div
                className="px-3 py-2.5 rounded-lg text-xs"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}
              >
                Demo: test@aegis.com / TestPassword123!
              </div>

              <Input
                type="email"
                label="Email"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEmail(false)}
                  className="btn btn-ghost flex-1 justify-center"
                  style={{ borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary flex-1 justify-center"
                  style={{ borderRadius: '6px' }}
                >
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>
          )}

          {/* Register link */}
          <p className="mt-6 text-center text-xs text-[#6b7280]">
            Need access?{' '}
            <Link href="/register" className="text-[#5e6ad2] hover:underline">
              Request account
            </Link>
          </p>

          {/* Security notice */}
          <div
            className="mt-6 px-3 py-2.5 rounded-lg"
            style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)' }}
          >
            <p className="text-2xs leading-relaxed" style={{ color: '#9ca3af' }}>
              <span style={{ color: '#f97316', fontWeight: 500 }}>Classified system. </span>
              Unauthorized access is prohibited. All activity is monitored and logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
