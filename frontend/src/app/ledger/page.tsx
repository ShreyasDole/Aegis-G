'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
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
  }, [offset]);

  const loadLedger = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_URL}/api/sharing/ledger?limit=${limit}&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

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
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_URL}/api/sharing/ledger/integrity`, {
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
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">🔗 Ledger Explorer</h1>
            <p className="text-text-secondary mt-2">Blockchain audit trail for threat intelligence sharing</p>
          </div>
          <Button variant="primary" onClick={checkIntegrity}>
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
          <Card className={`p-4 ${integrityStatus.is_valid ? 'bg-success/10 border-success' : 'bg-danger/10 border-danger'}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{integrityStatus.is_valid ? '✅' : '🚨'}</span>
              <div>
                <h3 className="font-semibold text-text-primary">
                  Chain Integrity: {integrityStatus.status}
                </h3>
                <p className="text-sm text-text-secondary">
                  {integrityStatus.is_valid 
                    ? 'All blocks are cryptographically linked. No tampering detected.'
                    : 'WARNING: Chain integrity compromised. Tampering detected.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Ledger Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Blockchain History</h2>
            
            {isLoading ? (
              <div className="text-center py-12 text-text-secondary">Loading ledger...</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <p className="text-lg mb-2">No ledger entries found</p>
                <p className="text-sm">Threat intelligence will appear here once shared.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        <th className="text-left p-3 text-text-secondary font-semibold">Block #</th>
                        <th className="text-left p-3 text-text-secondary font-semibold">Timestamp</th>
                        <th className="text-left p-3 text-text-secondary font-semibold">Report ID</th>
                        <th className="text-left p-3 text-text-secondary font-semibold">Agency</th>
                        <th className="text-left p-3 text-text-secondary font-semibold">Previous Hash</th>
                        <th className="text-left p-3 text-text-secondary font-semibold">Current Hash</th>
                        <th className="text-left p-3 text-text-secondary font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, idx) => (
                        <tr key={entry.id} className="border-b border-border-subtle hover:bg-bg-secondary/50">
                          <td className="p-3 font-mono text-text-primary">{entry.id}</td>
                          <td className="p-3 text-text-secondary">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                          </td>
                          <td className="p-3 text-text-primary">#{entry.report_id}</td>
                          <td className="p-3 text-text-secondary">{entry.recipient_agency || 'Internal'}</td>
                          <td className="p-3 font-mono text-xs text-text-muted">
                            {formatHash(entry.previous_hash)}
                          </td>
                          <td className="p-3 font-mono text-xs text-primary">
                            {formatHash(entry.current_hash)}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              entry.verified === 'verified' 
                                ? 'bg-success/20 text-success' 
                                : 'bg-warning/20 text-warning'
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
        </Card>
      </div>
    </div>
  );
}





