'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    agency: '',
    role: 'analyst',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate registration
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-4">Registration Successful!</h2>
          <p className="text-text-secondary mb-6">
            Your account request has been submitted for admin approval. You will receive an email once your account is activated.
          </p>
          <div className="p-4 bg-info/10 border border-info/30 rounded-lg mb-6">
            <div className="text-sm text-text-secondary">
              <div className="font-semibold text-info mb-2">What happens next?</div>
              <ul className="text-left space-y-1">
                <li>• Admin will review your credentials</li>
                <li>• Verification may take 1-2 business days</li>
                <li>• Check your email for approval status</li>
              </ul>
            </div>
          </div>
          <Link href="/login">
            <Button variant="primary" className="w-full">
              Back to Login
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-2xl font-bold font-display mb-2">
            Request Access
          </h1>
          <p className="text-text-secondary text-sm">
            Register for Aegis-G Command Center
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            type="text"
            name="fullName"
            label="Full Name"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={handleChange}
            icon={<span>👤</span>}
            required
          />

          <Input
            type="email"
            name="email"
            label="Government Email"
            placeholder="john.doe@agency.gov"
            value={formData.email}
            onChange={handleChange}
            icon={<span>📧</span>}
            required
          />

          <Input
            type="text"
            name="agency"
            label="Agency/Organization"
            placeholder="National Security Agency"
            value={formData.agency}
            onChange={handleChange}
            icon={<span>🏛️</span>}
            required
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Requested Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input w-full"
              required
            >
              <option value="viewer">Viewer (Read-only)</option>
              <option value="analyst">Analyst (Standard)</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <Input
            type="password"
            name="password"
            label="Password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            icon={<span>🔒</span>}
            required
          />

          <Input
            type="password"
            name="confirmPassword"
            label="Confirm Password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            icon={<span>🔒</span>}
            required
          />

          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-start gap-2 text-xs text-text-secondary">
              <span>⚠️</span>
              <div>
                All accounts require admin approval. Ensure your email domain is authorized.
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⚙️</span>
                Submitting...
              </span>
            ) : (
              'Request Access'
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-text-secondary">Already have an account? </span>
          <Link href="/login" className="text-primary hover:text-blue-400 font-semibold">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}

