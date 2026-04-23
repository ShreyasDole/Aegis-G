'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function LedgerExplorerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [integrityStatus, setIntegrityStatus] = useState<{ is_valid: boolean; status: string } | null>(null);
  const [chainAudit, setChainAudit] = useState<{
    valid?: boolean;
    blocks_checked?: number;
    message?: string;
  } | null>(null);
  const [authHint, setAuthHint] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const loadLedger = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthHint('Login required — ledger is authenticated.');
      setEntries([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }
    setAuthHint(null);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sharing/ledger?limit=${limit}&offset=${offset}`, {
        headers: authHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
        setTotal(data.total || 0);
      } else {
        setEntries([]);
        if (response.status === 401 || response.status === 403) {
          setAuthHint('Session expired or forbidden — login again.');
        }
      }
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [offset]);

  const checkIntegrity = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIntegrityStatus(null);
      setChainAudit(null);
      return;
    }
    try {
      const [intRes, chainRes] = await Promise.all([
        fetch(`/api/sharing/ledger/integrity`, { headers: authHeaders() }),
        fetch(`/api/sharing/ledger/verify/chain`, { headers: authHeaders() }),
      ]);
      if (intRes.ok) setIntegrityStatus(await intRes.json());
      if (chainRes.ok) setChainAudit(await chainRes.json());
    } catch {
      setIntegrityStatus(null);
      setChainAudit(null);
    }
  }, []);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  useEffect(() => {
    checkIntegrity();
  }, [checkIntegrity]);

  const formatHash = (hash: string) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const verifiedCount = entries.filter(
    e => (e.verified || '').toLowerCase() === 'verified'
  ).length;

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-y-auto">
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-space font-bold uppercase tracking-widest text-neon-cyan drop-shadow-[0_0_10px_rgba(0,183,255,0.5)]">
              Distributed Ledger
            </h1>
            <p className="text-text-muted mt-2 font-space text-sm tracking-wider uppercase">
              Trust layer — blocks from `/api/sharing/ledger` (immutable chain in DB)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => loadLedger()} disabled={isLoading} className="font-space text-[10px] uppercase">
              Refresh
            </Button>
            <Button variant="primary" onClick={checkIntegrity} className="font-space tracking-widest border border-neon-cyan/50 text-[10px] uppercase">
              Verify integrity
            </Button>
          </div>
        </div>

        {authHint && (
          <p className="text-sm text-warning border border-warning/30 rounded-lg px-4 py-2 font-mono">{authHint}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total blocks" value={total.toString()} />
          <StatCard
            label="Chain status"
            value={integrityStatus?.status || '—'}
            variant={integrityStatus?.is_valid ? 'safe' : 'warning'}
          />
          <StatCard label="Verified (page)" value={verifiedCount.toString()} />
          <StatCard label="Agencies (page)" value={new Set(entries.map(e => e.recipient_agency)).size.toString()} />
        </div>

        {chainAudit && (
          <div className="p-4 rounded-lg border border-white/10 bg-bg-primary/80 text-xs font-mono text-text-secondary">
            Full-chain audit: {chainAudit.valid ? 'OK' : 'FAIL'} — blocks checked: {chainAudit.blocks_checked ?? '—'} —{' '}
            {chainAudit.message}
          </div>
        )}

        {integrityStatus && (
          <div
            className={`p-6 border rounded-lg ${
              integrityStatus.is_valid
                ? 'bg-success/5 border-success/50'
                : 'bg-red-500/10 border-red-500'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{integrityStatus.is_valid ? '✅' : '🚨'}</span>
              <div>
                <h3
                  className={`font-space uppercase tracking-widest font-bold ${
                    integrityStatus.is_valid ? 'text-success' : 'text-red-500'
                  }`}
                >
                  Link check: {integrityStatus.status}
                </h3>
                <p className="text-xs text-text-muted font-space uppercase tracking-wider mt-1">
                  {integrityStatus.is_valid
                    ? 'Previous-hash links match stored chain (structural).'
                    : 'Structural integrity failed — investigate DB or genesis.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-bg-primary/60 border border-white/5 rounded-lg p-6">
          <h2 className="text-sm font-space font-bold uppercase tracking-widest text-neon-cyan mb-4">
            Blockchain history
          </h2>

          {isLoading ? (
            <div className="text-center py-12 text-neon-cyan animate-pulse font-space uppercase text-sm">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-text-secondary font-space text-sm">
              No ledger rows. Chain mints on high-risk scans, policy blocks, forensics, and analyst fusion.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-space text-left">
                  <thead>
                    <tr className="border-b border-white/10 uppercase tracking-wider text-text-muted">
                      <th className="p-3">Block</th>
                      <th className="p-3">Time</th>
                      <th className="p-3">Threat PK</th>
                      <th className="p-3">Agency</th>
                      <th className="p-3">Prev hash</th>
                      <th className="p-3">Hash</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {entries.map(entry => (
                      <tr key={entry.id} className="hover:bg-black/40">
                        <td className="p-3 text-neon-cyan">#{entry.id}</td>
                        <td className="p-3 text-text-secondary">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'}
                        </td>
                        <td className="p-3 text-text-primary font-mono">
                          {entry.report_id > 0 ? `T-${entry.report_id}` : '—'}
                        </td>
                        <td className="p-3 text-text-secondary">{entry.recipient_agency || 'Internal'}</td>
                        <td className="p-3 text-text-muted font-mono opacity-70">{formatHash(entry.previous_hash)}</td>
                        <td className="p-3 text-neon-magenta font-mono">{formatHash(entry.current_hash)}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 border rounded uppercase text-[9px] ${
                              (entry.verified || '').toLowerCase() === 'verified'
                                ? 'bg-success/10 text-success border-success/30'
                                : 'bg-warning/10 text-warning border-warning/30'
                            }`}
                          >
                            {entry.verified}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle">
                <div className="text-sm text-text-secondary">
                  {offset + 1}–{Math.min(offset + limit, total)} of {total}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}>
                    Previous
                  </Button>
                  <Button variant="secondary" onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total}>
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
