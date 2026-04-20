'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { AuthBrandingPanel } from '@/components/layout/AuthBrandingPanel';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const API_URL = '';
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Registration failed');
      }
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex bg-bg-primary">
        <AuthBrandingPanel />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-[420px] text-center border-border-medium/80 shadow-modal">
            <div className="w-14 h-14 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-7 h-7 text-success" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Registration received</h2>
            <p className="text-text-secondary text-sm mb-6">Your account was created. You can sign in now.</p>
            <Link href="/login">
              <Button variant="primary" className="w-full rounded-lg">
                Back to sign in
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-bg-primary">
      <AuthBrandingPanel />
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10">
        <Card className="w-full max-w-[420px] border-border-medium/80 shadow-modal">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-bg-primary border border-border-subtle flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary tracking-tight">Request access</h1>
              <p className="text-xs text-text-muted">New analyst account</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{error}</div>
            )}
            <Input
              type="text"
              name="fullName"
              label="Full name"
              placeholder="Jane Analyst"
              value={formData.fullName}
              onChange={handleChange}
            />
            <Input
              type="email"
              name="email"
              label="Email"
              placeholder="you@agency.gov"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Input
              type="password"
              name="confirmPassword"
              label="Confirm password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <Button type="submit" variant="primary" className="w-full py-3 rounded-lg mt-2" disabled={isLoading}>
              {isLoading ? 'Submitting…' : 'Submit request'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-subtle text-center text-sm">
            <span className="text-text-secondary">Already have an account? </span>
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
