'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Microsoft sign-in was cancelled or denied.',
  oauth_failed: 'Microsoft sign-in failed. Please try again.',
  no_email: 'Could not get email from Microsoft account.',
  account_disabled: 'Your account is not active. Contact your administrator.',
};

export default function LoginPage() {
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    window.location.href = `${API_URL}/api/auth/outlook`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    setError(null);
    e.preventDefault();
    setIsLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
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
      const userResponse = await fetch(`${API_URL}/api/auth/me`, {
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />
      <Card className="w-full max-w-md z-10 relative">
        <div className="text-center mb-8">
          <div className="font-display text-4xl font-bold tracking-wider text-primary mb-2">AEGIS-G</div>
          <div className="h-px w-16 bg-primary mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Secure Access Portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            type="button"
            variant="primary"
            className="w-full py-3 text-base flex items-center justify-center gap-2"
            onClick={handleMicrosoftLogin}
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none"><path d="M10 0H0v10h10V0zm11 0H10.5v10H21V0zM10 10.5H0V21h10V10.5zm11 0H10.5V21H21V10.5z" fill="currentColor"/></svg>
            Sign in with Microsoft
          </Button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle" /></div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-bg-secondary text-text-muted">OR</span>
          </div>
        </div>

        {!showEmailForm ? (
          <Button variant="secondary" className="w-full" onClick={() => setShowEmailForm(true)}>
            Sign in with email (demo)
          </Button>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="p-3 rounded bg-primary/5 border border-primary/20 text-text-secondary text-xs">
              Demo: test@aegis.com / TestPassword123!
            </div>
            <Input type="email" label="Email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" label="Password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowEmailForm(false)}>Back</Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <span className="text-text-secondary">Need access? </span>
          <Link href="/register" className="text-primary hover:text-blue-400 font-semibold">Request Account</Link>
        </div>

        <div className="mt-6 p-3 bg-warning/10 border border-warning/30 rounded">
          <div className="flex items-start gap-2 text-xs">
            <svg className="w-5 h-5 text-warning flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-semibold text-warning mb-1">CLASSIFIED SYSTEM</div>
              <div className="text-text-secondary">Unauthorized access is prohibited. All activities are monitored and logged.</div>
            </div>
          </div>
        </div>
      </Card>
      <div className="absolute bottom-4 left-0 right-0 text-center text-text-muted text-xs z-10">
        <p>National Security Operations Platform</p>
      </div>
    </div>
  );
}
