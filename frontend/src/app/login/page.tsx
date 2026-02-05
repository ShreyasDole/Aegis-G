'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = '/dashboard';
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md z-10 relative">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="font-display text-4xl font-bold tracking-wider text-primary mb-2">
            AEGIS-G
          </div>
          <div className="h-px w-16 bg-primary mx-auto mb-4"></div>
          <p className="text-text-secondary text-sm">
            Secure Access Portal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            label="Email Address"
            placeholder="analyst@agency.gov"
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

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border-medium bg-bg-primary checked:bg-primary"
              />
              <span className="text-text-secondary">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-primary hover:text-blue-400">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 text-base"
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-subtle"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-bg-secondary text-text-muted">OR</span>
          </div>
        </div>

        {/* SSO Options */}
        <div className="space-y-2">
          <Button variant="secondary" className="w-full">
            Sign in with CAC/PIV
          </Button>
          <Button variant="secondary" className="w-full">
            Sign in with Agency SSO
          </Button>
        </div>

        {/* Register Link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-text-secondary">Need access? </span>
          <Link href="/register" className="text-primary hover:text-blue-400 font-semibold">
            Request Account
          </Link>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-warning/10 border border-warning/30 rounded">
          <div className="flex items-start gap-2 text-xs">
            <svg className="w-5 h-5 text-warning flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-semibold text-warning mb-1">CLASSIFIED SYSTEM</div>
              <div className="text-text-secondary">
                Unauthorized access is prohibited. All activities are monitored and logged.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-text-muted text-xs z-10">
        <p>National Security Operations Platform</p>
        <p className="mt-1">Contact: security@agency.gov</p>
      </div>
    </div>
  );
}
