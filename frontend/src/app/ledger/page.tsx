'use client';
import React, { useState, useEffect } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Link2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface LedgerEntry {
  id: number;
  previous_hash: string;
  current_hash: string;
  report_id: number;
  recipient_agency: string;
  timestamp: string;
  verified: string;
}

const trim = (h: string) => h ? `${h.slice(0, 8)}…${h.slice(-8)}` : 'N/A';

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [integrity, setIntegrity] = useState<{ is_valid: boolean; status: string } | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API   = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const h     = { Authorization: `Bearer ${token}` };
      const [ledRes, intRes] = await Promise.all([
        fetch(`${API}/api/sharing/ledger?limit=${limit}&offset=${offset}`, { headers: h }),
        fetch(`${API}/api/sharing/ledger/integrity`, { headers: h }),
      ]);
      if (ledRes.ok) { const d = await ledRes.json(); setEntries(d.entries || []); setTotal(d.total || 0); }
      if (intRes.ok) setIntegrity(await intRes.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [offset]);

  const agencies = new Set(entries.map(e => e.recipient_agency)).size;
  const verified = entries.filter(e => e.verified === 'verified').length;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 32px)' }}>

      {/* Stats */}
      <div className="grid grid-cols-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {[
          { label: 'Total Blocks',    value: total.toString() },
          { label: 'Chain Status',    value: integrity?.status || 'Checking…', variant: integrity?.is_valid ? 'safe' as const : 'warning' as const },
          { label: 'Verified Blocks', value: verified.toString() },
          { label: 'Agencies',        value: agencies.toString() },
        ].map((s, i) => (
          <div key={i} className="px-5 py-4"
            style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
            <div className="text-2xs uppercase tracking-wider text-[#6b7280] font-medium mb-1.5">{s.label}</div>
            <div className={`text-2xl font-semibold ${s.variant === 'safe' ? 'text-[#10b981]' : s.variant === 'warning' ? 'text-[#f97316]' : 'text-[#f3f4f6]'}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Integrity banner */}
      {integrity && (
        <div
          className="flex items-center gap-3 px-5 py-3 border-b text-sm"
          style={{
            borderColor: 'rgba(255,255,255,0.05)',
            background: integrity.is_valid ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
          }}
        >
          <span className={`w-2 h-2 rounded-full ${integrity.is_valid ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
          <span style={{ color: integrity.is_valid ? '#10b981' : '#ef4444' }}>
            {integrity.is_valid ? 'Chain integrity verified — no tampering detected' : 'WARNING: Chain integrity compromised'}
          </span>
          <button onClick={load} className="btn btn-ghost btn-sm ml-auto"><RefreshCw className="w-3 h-3" /></button>
        </div>
      )}

      {/* Table header */}
      <div
        className="grid text-2xs uppercase tracking-wider text-[#4b5563] px-4 py-2 border-b"
        style={{ gridTemplateColumns: '60px 140px 80px 140px 120px 120px 80px', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <span>Block</span><span>Timestamp</span><span>Report</span><span>Agency</span>
        <span>Prev Hash</span><span>Curr Hash</span><span>Status</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-14 text-sm text-[#6b7280]">Loading ledger…</div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <Link2 className="w-6 h-6 text-[#4b5563]" />
            <p className="text-sm text-[#6b7280]">No ledger entries found</p>
          </div>
        ) : entries.map(e => (
          <div
            key={e.id}
            className="row-item"
            style={{ gridTemplateColumns: '60px 140px 80px 140px 120px 120px 80px', display: 'grid', paddingLeft: '16px', paddingRight: '16px' }}
          >
            <span className="mono-12 text-[#9ca3af]">{e.id}</span>
            <span className="text-xs text-[#6b7280]">{e.timestamp ? new Date(e.timestamp).toLocaleString() : 'N/A'}</span>
            <span className="mono-10 text-[#5e6ad2]">#{e.report_id}</span>
            <span className="text-xs text-[#9ca3af] truncate">{e.recipient_agency || 'Internal'}</span>
            <span className="mono-10 text-[#4b5563]">{trim(e.previous_hash)}</span>
            <span className="mono-10 text-[#5e6ad2]">{trim(e.current_hash)}</span>
            <span className={`mono-10 font-semibold ${e.verified === 'verified' ? 'text-[#10b981]' : 'text-[#f97316]'}`}>
              {e.verified}
            </span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-[#6b7280]"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <span>Showing {Math.min(offset + 1, total)}–{Math.min(offset + limit, total)} of {total}</span>
        <div className="flex gap-2">
          <button onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}
            className="btn btn-ghost btn-sm"><ChevronLeft className="w-3.5 h-3.5" /></button>
          <button onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total}
            className="btn btn-ghost btn-sm"><ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
}
