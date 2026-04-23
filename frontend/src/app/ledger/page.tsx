'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';

interface LedgerEntry {
  id: number;
  previous_hash: string;
  current_hash: string;
  report_id: number;
  recipient_agency: string;
  timestamp: string;
  verified: string;
  content_preview?: string;
}

export default function LedgerExplorerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [integrityStatus, setIntegrityStatus] = useState<{is_valid: boolean, status: string} | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    loadLedger();
    checkIntegrity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const getValidToken = async (): Promise<string> => {
    let token = localStorage.getItem('token') || '';
    if (!token) {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@aegis.com', password: 'AdminPassword123!' }),
      });
      if (r.ok) {
        const d = await r.json();
        token = d.access_token || '';
        if (token) localStorage.setItem('token', token);
      }
    }
    return token;
  };

  const loadLedger = async () => {
    try {
      let token = await getValidToken();
      let response = await fetch(`/api/sharing/ledger?limit=${limit}&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Stale token — refresh and retry once
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        token = await getValidToken();
        response = await fetch(`/api/sharing/ledger?limit=${limit}&offset=${offset}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }

      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to load ledger:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIntegrity = async () => {
    try {
      const token = await getValidToken();
      const response = await fetch(`/api/sharing/ledger/integrity`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setIntegrityStatus(data);
      }
    } catch (error) {
      console.error('Failed to check integrity:', error);
    }
  };

  const formatHash = (hash: string) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-y-auto">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-space font-bold uppercase tracking-widest text-neon-cyan drop-shadow-[0_0_10px_rgba(0,183,255,0.5)]">🔗 Distributed Ledger</h1>
            <p className="text-text-muted mt-2 font-space text-sm tracking-wider uppercase">TRUST_LAYER // Immutable Blockchain audit trail for threat intelligence sharing</p>
          </div>
          <Button variant="primary" onClick={checkIntegrity} className="font-space tracking-widest border border-neon-cyan/50 hover:border-neon-cyan shadow-[0_0_15px_rgba(0,183,255,0.2)]">
            Verify Chain Integrity
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Blocks"
            value={total.toString()}
          />
          <StatCard
            label="Chain Status"
            value={integrityStatus?.status || "CHECKING"}
            variant={integrityStatus?.is_valid ? "safe" : "warning"}
          />
          <StatCard
            label="Verified Blocks"
            value={entries.filter(e => e.verified === 'verified').length.toString()}
          />
          <StatCard
            label="Agencies"
            value={new Set(entries.map(e => e.recipient_agency)).size.toString()}
          />
        </div>

        {/* Integrity Status */}
        {integrityStatus && (
          <div className={`p-6 border rounded-lg ${integrityStatus.is_valid ? 'bg-success/5 border-success/50 shadow-[0_0_15px_rgba(0,255,100,0.1)]' : 'bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.3)]'}`}>
            <div className="flex items-center gap-4">
              <span className={`text-3xl ${integrityStatus.is_valid ? 'animate-pulse' : 'animate-ping'}`}>{integrityStatus.is_valid ? '✅' : '🚨'}</span>
              <div>
                <h3 className={`font-space uppercase tracking-widest font-bold ${integrityStatus.is_valid ? 'text-success' : 'text-red-500'}`}>
                  Chain Integrity: {integrityStatus.status}
                </h3>
                <p className="text-xs text-text-muted font-space uppercase tracking-wider mt-1">
                  {integrityStatus.is_valid 
                    ? 'All blocks are cryptographically linked. No tampering detected in federation.'
                    : 'CRITICAL WARNING: Chain integrity compromised. Tampering detected.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ledger Table */}
        <div className="bg-bg-primary/60 border border-white/5 shadow-[0_0_15px_rgba(0,183,255,0.05)] rounded-lg p-6">
            <h2 className="text-sm font-space font-bold uppercase tracking-widest text-neon-cyan mb-6">Blockchain History Feed</h2>
            
            {isLoading ? (
              <div className="text-center py-12 text-neon-cyan animate-pulse font-space uppercase tracking-widest text-sm">Synchronizing ledger...</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 text-text-secondary font-space">
                <p className="text-sm uppercase tracking-widest mb-2 opacity-50">Empty Genesis Block</p>
                <p className="text-[10px] uppercase">Threat intelligence events will be cryptographically signed here.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-[11px] font-space text-left">
                    <thead>
                      <tr className="border-b border-white/10 uppercase tracking-wider text-text-muted">
                        <th className="p-3">Block #</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Report ID</th>
                        <th className="p-3">Agency</th>
                        <th className="p-3">Previous Hash</th>
                        <th className="p-3">Current Hash</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-black/40 transition-colors group">
                          <td className="p-3 text-neon-cyan">#{entry.id}</td>
                          <td className="p-3 text-text-secondary">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                          </td>
                          <td className="p-3 text-text-primary">R-{entry.report_id}</td>
                          <td className="p-3 text-text-secondary">{entry.recipient_agency || 'Internal'}</td>
                          <td className="p-3 text-text-muted opacity-50 font-mono">
                            {formatHash(entry.previous_hash)}
                          </td>
                          <td className="p-3 text-neon-magenta font-mono drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]">
                            {formatHash(entry.current_hash)}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 border rounded uppercase tracking-widest text-[9px] ${
                              entry.verified === 'verified' 
                                ? 'bg-success/10 text-success border-success/30' 
                                : 'bg-warning/10 text-warning border-warning/30'
                            }`}>
                              {entry.verified}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle">
                  <div className="text-sm text-text-secondary">
                    Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} blocks
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setOffset(offset + limit)}
                      disabled={offset + limit >= total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  );
}





