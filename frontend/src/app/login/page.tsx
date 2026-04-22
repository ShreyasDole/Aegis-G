'use client';
import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { AuthBrandingPanel } from '@/components/layout/AuthBrandingPanel';
import { Lock } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Microsoft sign-in was cancelled or denied.',
  oauth_failed: 'Microsoft sign-in failed. Please try again.',
  no_email: 'Could not get email from Microsoft account.',
  account_disabled: 'Your account is not active. Contact your administrator.',
};

function LoginInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err && ERROR_MESSAGES[err]) setError(ERROR_MESSAGES[err]);
  }, [searchParams]);

  const handleMicrosoftLogin = () => {
    window.location.href = '/api/auth/outlook';
  };

  const handleLogin = async (e: React.FormEvent) => {
    setError(null);
    e.preventDefault();
    setIsLoading(true);
    try {
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({}));
        const detail = Array.isArray(errorData.detail) ? errorData.detail[0]?.msg : errorData.detail;
        throw new Error(detail || 'Login failed');
      }
      const data = await loginResponse.json();
      localStorage.setItem('token', data.access_token);
      const userResponse = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        localStorage.setItem(
          'user',
          JSON.stringify({
            email: userData.email,
            name: userData.full_name || 'Agent',
            role: userData.role,
          })
        );
      }
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg-primary">
      <AuthBrandingPanel />

      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 relative">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.35), transparent)',
          }}
        />

        <Card className="w-full max-w-[420px] z-10 border-border-medium/80 shadow-modal">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-bg-primary border border-border-subtle flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary tracking-tight">Sign in</h1>
              <p className="text-xs text-text-muted">AEGIS-G enterprise portal</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="button"
              variant="primary"
              className="w-full py-3 text-sm flex items-center justify-center gap-2 rounded-lg"
              onClick={handleMicrosoftLogin}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 21 21" fill="none" aria-hidden>
                <path d="M10 0H0v10h10V0zm11 0H10.5v10H21V0zM10 10.5H0V21h10V10.5zm11 0H10.5V21H21V10.5z" fill="currentColor" />
              </svg>
              Sign in with Microsoft
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-bg-secondary text-text-muted uppercase tracking-wider">or</span>
            </div>
          </div>

          {!showEmailForm ? (
            <Button variant="secondary" className="w-full rounded-lg text-sm" onClick={() => setShowEmailForm(true)}>
              Continue with email
            </Button>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="p-3 rounded-lg bg-bg-primary border border-border-subtle text-text-secondary text-xs leading-relaxed">
                Demo: test@aegis.com / TestPassword123!
              </div>
              <Input
                type="email"
                label="Email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="secondary" className="flex-1 rounded-lg" onClick={() => setShowEmailForm(false)}>
                  Back
                </Button>
                <Button type="submit" variant="primary" className="flex-1 rounded-lg" disabled={isLoading}>
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-border-subtle text-center text-sm">
            <span className="text-text-secondary">Need access? </span>
            <Link href="/register" className="text-primary font-medium hover:underline">
              Request account
            </Link>
          </div>

          <div className="mt-6 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-[11px] text-text-secondary leading-snug">
              <span className="text-amber-500/90 font-semibold uppercase tracking-wide">Notice · </span>
              Classified system. Unauthorized access prohibited; activity is logged.
            </p>
          </div>
        </Card>

        <p className="mt-8 text-[11px] text-text-muted z-10">National Security Operations Platform</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-base flex items-center justify-center"><span className="text-neon-cyan font-mono text-sm animate-pulse">Loading...</span></div>}>
      <LoginInner />
    </Suspense>
  );
}
