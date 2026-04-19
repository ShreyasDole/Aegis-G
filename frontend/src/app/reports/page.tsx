'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileText, Shield, AlertTriangle, Link2 } from 'lucide-react';

interface Insight {
  id: number;
  title: string;
  description: string;
  severity: string;
  category?: string;
  created_at?: string;
  confidence_score?: number;
}

function insightBadgeVariant(sev: string): 'critical' | 'high' | 'medium' | 'low' | 'info' | 'secondary' {
  const s = (sev || '').toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'warning') return 'high';
  if (s === 'recommendation') return 'info';
  if (s === 'high') return 'high';
  if (s === 'medium') return 'medium';
  if (s === 'low') return 'low';
  return 'secondary';
}

interface LedgerRow {
  id: number;
  report_id: number;
  recipient_agency: string;
  timestamp: string;
  verified: string;
  content_preview?: string;
}

export default function ReportsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [threatCount, setThreatCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [integrity, setIntegrity] = useState<{ is_valid?: boolean; status?: string } | null>(null);

  const load = async () => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    setLoading(true);
    try {
      const [insRes, ledRes, thrRes, intRes] = await Promise.all([
        fetch('/api/ai/insights', { headers }),
        fetch('/api/sharing/ledger?limit=15&offset=0', { headers }),
        fetch('/api/threats', { headers }),
        fetch('/api/sharing/ledger/integrity', { headers }),
      ]);

      if (insRes.ok) {
        const data = await insRes.json();
        setInsights(Array.isArray(data) ? data.slice(0, 12) : []);
      } else setInsights([]);

      if (ledRes.ok) {
        const data = await ledRes.json();
        setLedger(Array.isArray(data?.entries) ? data.entries : Array.isArray(data) ? data : []);
      } else setLedger([]);

      if (thrRes.ok) {
        const data = await thrRes.json();
        setThreatCount(Array.isArray(data) ? data.length : 0);
      } else setThreatCount(null);

      if (intRes.ok) setIntegrity(await intRes.json());
      else setIntegrity(null);
    } catch {
      setInsights([]);
      setLedger([]);
      setThreatCount(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Reports Overview</h1>
          <p className="text-text-muted text-sm mt-1">AI insights, ledger integrity, and threat volume</p>
        </div>
        <Button variant="primary" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4" />
            Active threats
          </div>
          <div className="text-3xl font-bold text-text-primary tabular-nums">
            {threatCount === null ? '—' : threatCount}
          </div>
          <Link href="/threats" className="text-xs text-primary mt-2 inline-block hover:underline">
            Open threat analysis →
          </Link>
        </Card>
        <Card className="p-4 border-l-4 border-l-success">
          <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wider mb-2">
            <FileText className="w-4 h-4" />
            AI insights
          </div>
          <div className="text-3xl font-bold text-text-primary tabular-nums">{insights.length}</div>
          <p className="text-xs text-text-muted mt-2">Latest generated intelligence</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-secondary">
          <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wider mb-2">
            <Shield className="w-4 h-4" />
            Ledger chain
          </div>
          <div className="text-sm font-medium text-text-primary">
            {integrity?.status || (integrity?.is_valid === false ? 'Check failed' : integrity?.is_valid ? 'Verified' : 'Unknown')}
          </div>
          <Link href="/ledger" className="text-xs text-primary mt-2 inline-block hover:underline">
            Ledger explorer →
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">Recent AI insights</h2>
          {insights.length === 0 && !loading ? (
            <p className="text-sm text-text-muted">No insights yet. An admin can generate them from the API.</p>
          ) : (
            <ul className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin">
              {insights.map((i) => (
                <li key={i.id} className="p-3 rounded-lg bg-bg-primary border border-border-subtle">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-text-primary">{i.title}</span>
                    <Badge variant={insightBadgeVariant(String(i.severity))}>
                      {String(i.severity)}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2">{i.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">Ledger activity</h2>
          {ledger.length === 0 && !loading ? (
            <p className="text-sm text-text-muted">No ledger entries returned.</p>
          ) : (
            <ul className="space-y-2 max-h-[480px] overflow-y-auto scrollbar-thin">
              {ledger.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-bg-primary border border-border-subtle text-xs"
                >
                  <Link2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-mono text-text-primary truncate">#{row.report_id}</div>
                    <div className="text-text-muted truncate">{row.recipient_agency}</div>
                    <div className="text-text-muted">{row.timestamp}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
