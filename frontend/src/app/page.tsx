'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Zap, Network, Lock } from 'lucide-react';

const FEATURES = [
  { icon: Shield,  label: 'AI Threat Detection',    desc: '94.7% accuracy • 847 threats analyzed this week' },
  { icon: Network, label: 'Network Intelligence',        desc: '2,341 nodes mapped • 5 active campaigns detected' },
  { icon: Zap,     label: 'Policy Enforcement',        desc: '127 threats blocked today • 100% uptime' },
  { icon: Lock,    label: 'Audit Ledger',    desc: '1,892 blocks verified • Chain integrity: INTACT' },
];

export default function Home() {
  const router = useRouter();
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) { router.push('/dashboard'); return; }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(API_URL + '/')
      .then(r => r.ok ? setApiStatus('ok') : setApiStatus('error'))
      .catch(()  => setApiStatus('error'));
  }, [router]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#0e0e0e' }}
    >
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Accent radial */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-[0.07]"
        style={{ background: 'radial-gradient(ellipse at top, #5e6ad2,transparent 70%)' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto px-6">

        {/* Logo mark */}
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-6"
          style={{ background: 'rgba(94,106,210,0.12)', border: '1px solid rgba(94,106,210,0.25)' }}
        >
          <Shield className="w-6 h-6" style={{ color: '#5e6ad2' }} />
        </div>

        {/* API status pill */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: apiStatus === 'ok' ? '#10b981' : apiStatus === 'error' ? '#ef4444' : '#9ca3af',
          }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'ok' ? 'bg-[#10b981] animate-pulse' : apiStatus === 'error' ? 'bg-[#ef4444]' : 'bg-[#9ca3af] animate-pulse'}`}
          />
          {apiStatus === 'checking' ? 'Connecting to AEGIS-G…' : apiStatus === 'ok' ? 'System Online' : 'Backend Unreachable'}
        </div>

        <h1 className="text-4xl font-semibold text-[#f3f4f6] mb-3 tracking-tight leading-tight">
          Omni-Modal Cognitive<br />
          <span style={{ color: '#5e6ad2' }}>Defense Grid</span>
        </h1>
        <p className="text-[#9ca3af] text-sm mb-10 max-w-lg leading-relaxed">
          AI-powered cybersecurity operations platform. Multi-agent forensic attribution, 
          graph-based threat intelligence, and blockchain audit trails — built for national security.
        </p>

        {/* CTAs */}
        <div className="flex gap-3 mb-14">
          <Link href="/login">
            <button
              className="btn btn-primary btn-lg"
              style={{ borderRadius: '6px', fontSize: '0.875rem' }}
            >
              Sign in to Command Center
            </button>
          </Link>
          <Link href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/docs`} target="_blank">
            <button
              className="btn btn-secondary btn-lg"
              style={{ borderRadius: '6px', fontSize: '0.875rem' }}
            >
              API Docs →
            </button>
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-2xl text-left">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="rounded-lg p-4 transition-colors duration-150 cursor-default group"
              style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color: '#5e6ad2' }} strokeWidth={1.75} />
                <span className="text-xs font-medium text-[#f3f4f6]">{label}</span>
              </div>
              <p className="text-xs text-[#6b7280] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-10 text-2xs text-[#4b5563]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          FastAPI · Next.js · PostgreSQL · Neo4j · Redis · Gemini 2.5
        </p>
      </div>
    </main>
  );
}
