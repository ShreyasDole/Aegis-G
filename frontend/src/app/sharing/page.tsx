'use client';
import React, { useState } from 'react';
import Link from 'next/link';
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
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-y-auto">
      <div className="w-full space-y-6">
        <header className="mb-6">
          <h1 className="text-3xl font-space font-bold tracking-wider uppercase text-neon-cyan drop-shadow-[0_0_10px_rgba(0,183,255,0.5)]">
            Intelligence Sharing
          </h1>
          <p className="text-text-muted mt-2 font-space text-sm tracking-wider uppercase">
            CROSS_AGENCY // Export STIX 2.1 bundles and cryptographically verify ledger entries.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-bg-primary/60 border border-white/5 shadow-[0_0_15px_rgba(0,183,255,0.05)] rounded-lg p-6">
              <h2 className="text-sm font-space font-bold uppercase tracking-widest text-[#00ff9d] mb-4">Export STIX 2.1 Bundle</h2>
              <p className="text-text-secondary text-xs font-mono mb-6 leading-relaxed">
                Use the <strong className="text-[#00ff9d]">Export STIX</strong> button on any isolated threat node within the Analysis Matrix to download a standardized STIX 2.1 JSON bundle for cross-agency intelligence sharing.
              </p>
              <Link href="/threats">
                <Button variant="primary" className="font-space tracking-widest text-[10px] uppercase border-[#00ff9d]/30 hover:border-[#00ff9d] text-[#00ff9d]">Open Analysis Matrix</Button>
              </Link>
            </div>

            <div className="bg-bg-primary/60 border border-white/5 shadow-[0_0_15px_rgba(0,183,255,0.05)] rounded-lg p-6">
              <h2 className="text-sm font-space font-bold uppercase tracking-widest text-neon-cyan mb-4">Verify Blockchain Integrity</h2>
              <p className="text-text-secondary text-xs font-mono mb-6">
                Enter a cryptographic ledger hash to trace and verify a shared intelligence record from the federation.
              </p>
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Enter Ledger Hash (e.g. 0x...)"
                  value={ledgerHash}
                  onChange={(e) => setLedgerHash(e.target.value)}
                  className="flex-1 font-mono text-sm bg-black/50 border-neon-cyan/20 focus:border-neon-cyan/80 transition-colors"
                />
                <Button variant="secondary" onClick={verifyLedger} className="font-space tracking-widest text-[10px] uppercase border-neon-cyan/30 hover:border-neon-cyan/80">Execute Trace</Button>
              </div>
              {ledgerResult !== null && (
                <div className={`p-4 rounded-lg font-space uppercase tracking-widest text-xs border ${ledgerResult.verified ? 'bg-success/5 border-success/30 text-success shadow-[0_0_10px_rgba(0,255,100,0.1)]' : 'bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_10px_rgba(255,0,0,0.2)]'}`}>
                  {ledgerResult.verified ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                      Verified Secure {ledgerResult.timestamp ? `// ${ledgerResult.timestamp}` : ''}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                       Hash verification failed
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
