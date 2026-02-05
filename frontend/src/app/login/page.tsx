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
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'slide 20s linear infinite',
        }}></div>
      </div>

      {/* Particle Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md z-10 relative">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-pulse-slow">🛡️</div>
          <h1 className="text-4xl font-bold font-display mb-2 text-glow-blue">
            AEGIS-G
          </h1>
          <p className="text-text-secondary">
            Secure Access to Command Center
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
            icon={<span>📧</span>}
            required
          />

          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<span>🔒</span>}
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
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⚙️</span>
                Authenticating...
              </span>
            ) : (
              'Sign In'
            )}
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
            <span className="mr-2">🔐</span>
            Sign in with CAC/PIV
          </Button>
          <Button variant="secondary" className="w-full">
            <span className="mr-2">🏛️</span>
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
        <div className="mt-6 p-3 bg-warning/10 border border-warning/30 rounded-lg">
          <div className="flex items-start gap-2 text-xs text-warning">
            <span className="text-lg">⚠️</span>
            <div>
              <div className="font-semibold mb-1">CLASSIFIED SYSTEM</div>
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
        <p className="mt-1">Contact: security@agency.gov | Support: +1 (800) 555-0123</p>
      </div>

      <style jsx>{`
        @keyframes slide {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
      `}</style>
    </div>
  );
}

