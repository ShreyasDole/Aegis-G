'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Download, Shield } from 'lucide-react';

export default function SharingPage() {
  const [hash, setHash] = useState('');
  const [result, setResult] = useState<{ verified: boolean; timestamp?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const token   = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const verify = async () => {
    if (!hash.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/sharing/ledger/${encodeURIComponent(hash.trim())}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const d = await res.json();
        setResult({ verified: d.verified === true, timestamp: d.timestamp });
      } else { setResult({ verified: false }); }
    } catch { setResult({ verified: false }); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-2xl space-y-4">

      {/* Export STIX */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-4 h-4 text-[#5e6ad2]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Export STIX 2.1</h2>
        </div>
        <p className="text-sm text-[#6b7280] mb-4 leading-relaxed">
          Use the <strong className="text-[#f3f4f6]">Export STIX</strong> button on any threat card in the Dashboard or Threats page to download a STIX 2.1 JSON bundle.
        </p>
        <Link href="/threats">
          <button className="btn btn-primary btn-md">Go to Threat Analysis</button>
        </Link>
      </div>

      {/* Verify Ledger */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#5e6ad2]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Verify Ledger Entry</h2>
        </div>
        <p className="text-sm text-[#6b7280] mb-4">Enter a ledger hash to verify a shared intelligence record.</p>
        <div className="flex gap-2 mb-3">
          <input
            className="input flex-1 font-mono text-xs"
            placeholder="Enter ledger hash…"
            value={hash}
            onChange={e => setHash(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verify()}
          />
          <button onClick={verify} disabled={loading || !hash.trim()} className="btn btn-secondary btn-md">
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </div>
        {result !== null && (
          <div
            className="px-4 py-3 rounded-md text-sm"
            style={{
              background: result.verified ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${result.verified ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              color: result.verified ? '#10b981' : '#ef4444',
            }}
          >
            {result.verified
              ? `✓ Verified${result.timestamp ? ` — ${new Date(result.timestamp).toLocaleString()}` : ''}`
              : '✕ Not verified — hash not found in ledger'}
          </div>
        )}
      </div>
    </div>
  );
}
