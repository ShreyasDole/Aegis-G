'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  const [genBusy, setGenBusy] = useState(false);
  const [genNote, setGenNote] = useState<string | null>(null);

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

  const persistInsights = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setGenNote('Login required');
      return;
    }
    setGenBusy(true);
    setGenNote(null);
    try {
      const res = await fetch('/api/ai/insights/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setGenNote(typeof data.message === 'string' ? data.message : 'Generated');
        await load();
      } else {
        setGenNote(typeof data.detail === 'string' ? data.detail : `HTTP ${res.status}`);
      }
    } catch {
      setGenNote('Request failed');
    } finally {
      setGenBusy(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-y-auto">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-space font-bold tracking-wider uppercase text-neon-cyan drop-shadow-[0_0_10px_rgba(0,183,255,0.5)]">
            Risk & Threat Intelligence
          </h1>
          <p className="text-text-muted mt-2 font-space text-sm tracking-wider uppercase">
            COMMAND_CENTER // Real-time insights, ledger integrity, and aggregated threats
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={load} disabled={loading} className="font-space tracking-widest text-[10px] uppercase border-neon-cyan/30 hover:border-neon-cyan/80">
            Sync Intelligence
          </Button>
          <Button
            variant="secondary"
            onClick={persistInsights}
            disabled={genBusy}
            className="font-space tracking-widest text-[10px] uppercase"
          >
            {genBusy ? 'Generating…' : 'Persist LLM insights'}
          </Button>
        </div>
      </header>
      {genNote && <p className="text-xs text-text-muted font-mono -mt-2 mb-2">{genNote}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        <div className="bg-black/40 border border-neon-magenta/30 hover:border-neon-magenta shadow-[0_0_10px_rgba(255,0,255,0.1)] rounded p-6 relative overflow-hidden transition-all duration-300">
          <div className="flex items-center gap-2 text-neon-magenta font-space text-xs uppercase tracking-widest mb-4">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            Active Threats
          </div>
          <div className="text-4xl font-space font-bold text-text-primary tabular-nums">
            {threatCount === null ? '—' : threatCount}
          </div>
          <Link href="/threats" className="text-[10px] font-space tracking-widest uppercase text-text-muted mt-4 inline-block hover:text-neon-cyan transition-colors">
            Access Analysis Matrix →
          </Link>
        </div>
        
        <div className="bg-black/40 border border-neon-cyan/30 hover:border-neon-cyan shadow-[0_0_10px_rgba(0,183,255,0.1)] rounded p-6 relative overflow-hidden transition-all duration-300">
          <div className="flex items-center gap-2 text-neon-cyan font-space text-xs uppercase tracking-widest mb-4">
            <FileText className="w-4 h-4" />
            AI Intelligence Insights
          </div>
          <div className="text-4xl font-space font-bold text-text-primary tabular-nums">{insights.length}</div>
          <p className="text-[10px] font-space uppercase tracking-widest text-text-muted mt-4">Automated narrative summaries</p>
        </div>
        
        <div className="bg-black/40 border border-[#00ff9d]/30 hover:border-[#00ff9d] shadow-[0_0_10px_rgba(0,255,157,0.1)] rounded p-6 relative overflow-hidden transition-all duration-300">
          <div className="flex items-center gap-2 text-[#00ff9d] font-space text-xs uppercase tracking-widest mb-4">
            <Shield className="w-4 h-4" />
            Ledger Validation
          </div>
          <div className="text-lg font-space font-bold uppercase tracking-widest text-text-primary mt-1 mb-2">
            {integrity?.status || (integrity?.is_valid === false ? 'Integrity Failed' : integrity?.is_valid ? 'Verified Secure' : 'Scanning...')}
          </div>
          <Link href="/ledger" className="text-[10px] font-space tracking-widest uppercase text-text-muted mt-3 inline-block hover:text-neon-cyan transition-colors">
            Open Blockchain Explorer →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="bg-bg-primary/60 border border-white/5 shadow-[0_0_15px_rgba(0,183,255,0.05)] rounded-lg p-6 flex flex-col h-full">
          <h2 className="text-sm font-space font-bold uppercase tracking-widest text-neon-cyan mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></span>
            Recent AI Insights
          </h2>
          {insights.length === 0 && !loading ? (
            <p className="text-[10px] font-space uppercase text-text-muted mt-4 border border-dashed border-white/10 p-4 text-center">No intelligence summaries generated yet. Run a network scan.</p>
          ) : (
            <ul className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
              {insights.map((i) => (
                <li key={`${i.id}-${i.title?.slice(0, 8)}`} className="p-4 rounded bg-black/40 border border-white/5 hover:border-white/20 transition-colors group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-space font-bold uppercase text-text-primary group-hover:text-neon-cyan transition-colors">{i.title}</span>
                    <Badge variant={insightBadgeVariant(String(i.severity))} className="text-[9px] font-space px-2">
                      {String(i.severity)}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed font-mono mt-2">{i.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-bg-primary/60 border border-white/5 shadow-[0_0_15px_rgba(0,183,255,0.05)] rounded-lg p-6 flex flex-col h-full">
          <h2 className="text-sm font-space font-bold uppercase tracking-widest text-[#00ff9d] mb-6 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Blockchain Ledger Activity
          </h2>
          {ledger.length === 0 && !loading ? (
            <p className="text-[10px] font-space uppercase text-text-muted mt-4 border border-dashed border-white/10 p-4 text-center">No blocks mined yet in the federation.</p>
          ) : (
            <ul className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
              {ledger.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-4 p-3 rounded bg-black/40 border border-white/10 hover:border-[#00ff9d]/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded bg-[#00ff9d]/10 flex items-center justify-center shrink-0 border border-[#00ff9d]/20">
                    <span className="text-[#00ff9d] text-xs font-space font-bold">#{row.id}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-space text-xs uppercase tracking-widest text-text-primary mb-1">Report ID: R-{row.report_id}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-space text-text-muted uppercase">To: {row.recipient_agency || 'Internal'}</span>
                      <span className="text-[10px] font-space text-text-secondary opacity-50">{row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : ''}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
