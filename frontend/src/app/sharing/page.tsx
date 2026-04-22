'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SharingPage() {
  const [ledgerHash, setLedgerHash] = useState('');
  const [ledgerResult, setLedgerResult] = useState<{ verified: boolean; timestamp?: string } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const verifyLedger = async () => {
    if (!ledgerHash.trim()) return;
    setLedgerResult(null);
    try {
      const res = await fetch(`/api/sharing/ledger/${encodeURIComponent(ledgerHash.trim())}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setLedgerResult({ verified: data.verified === true, timestamp: data.timestamp });
      }
    } catch {
      setLedgerResult({ verified: false });
    }
  };

  return (
    <div className="p-6 min-h-screen max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Intelligence Sharing</h1>
      <p className="text-text-muted text-sm mb-6">
        Export STIX 2.1 bundles and verify ledger entries.
      </p>

      <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Export STIX</h2>
            <p className="text-text-secondary text-sm mb-4">
              Use the <strong>Export STIX</strong> button on any threat card on the Dashboard or Threats page to download a STIX 2.1 JSON bundle for that threat.
            </p>
            <Link href="/threats">
              <Button variant="primary">Go to Threats</Button>
            </Link>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Verify ledger entry</h2>
            <p className="text-text-secondary text-sm mb-4">
              Enter a ledger hash to verify a shared intelligence record.
            </p>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Ledger hash"
                value={ledgerHash}
                onChange={(e) => setLedgerHash(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
              <Button variant="secondary" onClick={verifyLedger}>Verify</Button>
            </div>
            {ledgerResult !== null && (
              <div className={`p-3 rounded text-sm ${ledgerResult.verified ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {ledgerResult.verified ? `Verified${ledgerResult.timestamp ? ` — ${ledgerResult.timestamp}` : ''}` : 'Not verified'}
              </div>
            )}
          </Card>
      </div>
    </div>
  );
}
