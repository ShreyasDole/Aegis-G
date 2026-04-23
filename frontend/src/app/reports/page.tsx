'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { FileText, Shield, AlertTriangle, Link2, RefreshCw } from 'lucide-react';

interface Insight { id: number; title: string; description: string; severity: string; created_at?: string; confidence_score?: number; }
interface LedgerRow { id: number; report_id: number; recipient_agency: string; timestamp: string; verified: string; }

function insightVariant(sev: string): any {
  const s = sev.toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'warning' || s === 'high') return 'high';
  if (s === 'recommendation' || s === 'low') return 'low';
  if (s === 'medium') return 'medium';
  return 'info';
}

export default function ReportsPage() {
  const [insights, setInsights]   = useState<Insight[]>([]);
  const [ledger, setLedger]       = useState<LedgerRow[]>([]);
  const [threatCount, setThreatCount] = useState<number | null>(null);
  const [integrity, setIntegrity] = useState<{ is_valid?: boolean; status?: string } | null>(null);
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    const token   = localStorage.getItem('token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    setLoading(true);
    try {
      const [insRes, ledRes, thrRes, intRes] = await Promise.all([
        fetch('/api/ai/insights',                { headers }),
        fetch('/api/sharing/ledger?limit=20',    { headers }),
        fetch('/api/threats',                    { headers }),
        fetch('/api/sharing/ledger/integrity',   { headers }),
      ]);
      if (insRes.ok) setInsights((await insRes.json()).slice(0, 15));
      if (ledRes.ok) { const d = await ledRes.json(); setLedger(Array.isArray(d?.entries) ? d.entries : Array.isArray(d) ? d : []); }
      if (thrRes.ok) { const d = await thrRes.json(); setThreatCount(Array.isArray(d) ? d.length : 0); }
      if (intRes.ok) setIntegrity(await intRes.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 32px)' }}>

      {/* Stat band */}
      <div className="grid grid-cols-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {[
          { label: 'Active Threats', value: threatCount === null ? '—' : threatCount, icon: <AlertTriangle className="w-4 h-4" />, color: '#ef4444' },
          { label: 'AI Insights',    value: insights.length, icon: <FileText className="w-4 h-4" />, color: '#10b981' },
          { label: 'Ledger Chain',   value: integrity?.status || '—', icon: <Shield className="w-4 h-4" />, color: integrity?.is_valid ? '#10b981' : '#f97316' },
        ].map((s, i) => (
          <div key={i} className="px-5 py-4 flex items-start gap-3"
            style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
            <span style={{ color: s.color }} className="mt-1">{s.icon}</span>
            <div>
              <div className="text-2xs uppercase tracking-wider text-[#6b7280] font-medium mb-1.5">{s.label}</div>
              <div className="text-2xl font-semibold text-[#f3f4f6]">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.05)', minHeight: '44px' }}>
        <span className="text-2xs uppercase tracking-wider text-[#6b7280] font-medium">Intelligence Overview</span>
        <button onClick={load} disabled={loading} className="btn btn-ghost btn-sm gap-1">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin-slow' : ''}`} /> Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* AI Insights */}
        <div className="flex-1 flex flex-col border-r overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <span className="text-xs font-medium text-[#9ca3af]">AI Insights</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {insights.length === 0 && !loading ? (
              <div className="px-4 py-8 text-sm text-[#6b7280] text-center">No insights yet.</div>
            ) : (
              insights.map(ins => (
                <div key={ins.id} className="row-item">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#5e6ad2]" />
                  <span className="flex-1 text-sm text-[#f3f4f6] truncate">{ins.title}</span>
                  <Badge variant={insightVariant(ins.severity)}>{ins.severity}</Badge>
                  {ins.confidence_score !== undefined && (
                    <span className="mono-10 text-[#4b5563]">{(ins.confidence_score * 100).toFixed(0)}%</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ledger Activity */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <span className="text-xs font-medium text-[#9ca3af]">Ledger Activity</span>
            <Link href="/ledger" className="text-2xs text-[#5e6ad2] hover:underline">Explorer →</Link>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {ledger.length === 0 && !loading ? (
              <div className="px-4 py-8 text-sm text-[#6b7280] text-center">No ledger entries yet.</div>
            ) : (
              ledger.map(row => (
                <div key={row.id} className="row-item">
                  <Link2 className="w-3 h-3 text-[#5e6ad2] shrink-0" />
                  <span className="mono-10 text-[#6b7280] shrink-0">#{row.report_id}</span>
                  <span className="flex-1 text-sm text-[#f3f4f6] truncate">{row.recipient_agency || 'Internal'}</span>
                  <Badge variant={row.verified === 'verified' ? 'success' : 'warning'}>{row.verified}</Badge>
                  <span className="mono-10 text-[#4b5563] shrink-0">{new Date(row.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
