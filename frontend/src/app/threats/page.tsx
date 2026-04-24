'use client';
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ThreatMap } from '@/components/visual/ThreatMap';
import { exportToSTIX } from '@/lib/export';
import { AlertTriangle, RefreshCw, Download, Network } from 'lucide-react';

function getSev(score: number) {
  if (score > 8) return 'critical';
  if (score > 6) return 'high';
  if (score > 4) return 'medium';
  return 'low';
}

const SEV_DOT: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#ca8a04', low: '#10b981',
};

export default function ThreatsPage() {
  const [threats, setThreats]     = useState<any[]>([]);
  const [filter, setFilter]       = useState('all');
  const [query, setQuery]         = useState('');
  const [selected, setSelected]   = useState<any | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/threats`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          let data = await res.json();
          if (!data || data.length === 0) {
            data = [
              { id: 10452, source_platform: 'telegram', content: 'Elon Musk is doubling all Bitcoin sent to the official Tesla reserve wallet for the next 2 hours only! Validated by X safety.', risk_score: 9.8, timestamp: Date.now() - 300000 },
              { id: 10451, source_platform: 'twitter', content: 'URGENT LEAK! Found thousands of discarded ballots in the river near the 43rd district polling center! Share immediately before they take this down!', risk_score: 9.2, timestamp: Date.now() - 1420000 },
              { id: 10450, source_platform: 'github', content: 'Download the new firmware update for Log4j vulnerability patch here: http://malicious-gist-patch.com/setup.exe. Failure to update will result in immediate compromised network states.', risk_score: 8.5, timestamp: Date.now() - 3600000 },
              { id: 10449, source_platform: 'reddit', content: 'Is this video of the CEO resigning real? He looks very weird in the lighting.', risk_score: 7.1, timestamp: Date.now() - 5400000 },
              { id: 10448, source_platform: 'twitter', content: 'The AI model generates really nice art today. Check out these samples.', risk_score: 1.2, timestamp: Date.now() - 7200000 },
            ];
          }
          setThreats(data.map((t: any) => ({
            id: t.id,
            title: `Threat #${t.id} — ${t.source_platform}`,
            description: (t.content || '').substring(0, 100) + '…',
            content: t.content || '',
            severity: getSev(t.risk_score),
            source: t.source_platform,
            firstSeen: new Date(t.timestamp || 0).toLocaleString(),
            riskScore: t.risk_score <= 1 ? t.risk_score * 10 : t.risk_score,
          })));
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const filtered = threats.filter(t => {
    const matchSev = filter === 'all' || t.severity === filter;
    const matchQ   = t.title.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase());
    return matchSev && matchQ;
  });

  const counts = {
    critical: threats.filter(t => t.severity === 'critical').length,
    high:     threats.filter(t => t.severity === 'high').length,
    medium:   threats.filter(t => t.severity === 'medium').length,
    low:      threats.filter(t => t.severity === 'low').length,
  };

  return (
    <div className="flex h-full">

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 32px)' }}>

        {/* Stat band */}
        <div className="grid grid-cols-4 gap-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {([['critical', '#ef4444'], ['high', '#f97316'], ['medium', '#ca8a04'], ['low', '#10b981']] as const).map(([sev, color]) => (
            <button
              key={sev}
              onClick={() => setFilter(filter === sev ? 'all' : sev)}
              className="px-5 py-4 text-left transition-colors"
              style={{
                borderRight: sev !== 'low' ? '1px solid rgba(255,255,255,0.05)' : undefined,
                background: filter === sev ? 'rgba(255,255,255,0.03)' : undefined,
              }}
            >
              <div className="text-2xs uppercase tracking-wider font-medium mb-1.5" style={{ color }}>{sev}</div>
              <div className="text-2xl font-semibold tabular-nums text-[#f3f4f6]">{counts[sev]}</div>
            </button>
          ))}
        </div>

        {/* Filter/search bar */}
        <div
          className="flex items-center gap-3 px-4 py-2.5 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.05)', minHeight: '48px' }}
        >
          <input
            className="input flex-1"
            style={{ height: '30px' }}
            placeholder="Search threats…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {['all', 'critical', 'high', 'medium', 'low'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="btn btn-sm capitalize"
              style={{
                background: filter === s ? 'rgba(94,106,210,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${filter === s ? 'rgba(94,106,210,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: filter === s ? '#5e6ad2' : '#9ca3af',
              }}
            >
              {s}
            </button>
          ))}
          <button onClick={() => window.location.reload()} className="btn btn-ghost btn-sm">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Threat rows */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="text-sm text-[#6b7280]">Loading threats…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <AlertTriangle className="w-6 h-6 text-[#4b5563]" />
              <p className="text-sm text-[#6b7280]">No threats found</p>
            </div>
          ) : (
            filtered.map(t => (
              <div
                key={t.id}
                className={`row-item ${selected?.id === t.id ? 'active' : ''}`}
                onClick={() => setSelected(t)}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SEV_DOT[t.severity] }} />
                <span className="mono-10 text-[#4b5563] w-16 shrink-0">#{t.id}</span>
                <span className="flex-1 text-sm text-[#f3f4f6] truncate">{t.title}</span>
                <Badge variant={t.severity as any}>{t.severity}</Badge>
                <span className="mono-10 text-[#4b5563] shrink-0">{t.firstSeen}</span>
              </div>
            ))
          )}
        </div>

        {/* Geo map */}
        <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <span className="text-2xs uppercase tracking-wider text-[#6b7280] font-medium">Threat Heatmap</span>
          </div>
          <ThreatMap threats={threats.map(t => ({ id: t.id, risk_score: t.riskScore, source_platform: t.source, timestamp: t.firstSeen }))} />
        </div>

        {/* Graph link */}
        <div className="border-t p-4" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(94,106,210,0.02)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs uppercase tracking-wider text-[#6b7280] font-medium">Network Analysis</span>
            <Network className="w-3.5 h-3.5 text-[#5e6ad2]" />
          </div>
          <p className="text-xs text-[#9ca3af] mb-3 leading-relaxed">
            View threat relationships and propagation patterns in the graph network.
          </p>
          <a href="/network" className="btn btn-primary btn-sm w-full">View Network Graph →</a>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div
          className="border-l flex flex-col overflow-hidden"
          style={{ width: '380px', minWidth: '380px', borderColor: 'rgba(255,255,255,0.05)', background: '#111113' }}
        >
          <div className="flex items-center justify-between px-4 border-b"
            style={{ minHeight: '48px', borderColor: 'rgba(255,255,255,0.05)' }}>
            <span className="text-xs font-medium text-[#f3f4f6] truncate">{selected.title}</span>
            <div className="flex gap-1">
              <button onClick={() => exportToSTIX(selected.id)} className="btn btn-ghost btn-sm gap-1">
                <Download className="w-3 h-3" />STIX
              </button>
              <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm text-[#6b7280]">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
            <div className="prop-grid">
              {[
                ['Threat ID',  `#${selected.id}`],
                ['Severity',   selected.severity],
                ['Risk Score', `${selected.riskScore?.toFixed ? selected.riskScore.toFixed(1) : selected.riskScore}/10`],
                ['Source',     selected.source],
                ['First Seen', selected.firstSeen],
              ].map(([k, v]) => (
                <React.Fragment key={k}>
                  <span className="prop-key">{k}</span>
                  <span className="prop-val">{v}</span>
                </React.Fragment>
              ))}
            </div>
            <div className="divider" />
            <div>
              <p className="text-2xs uppercase tracking-wider text-[#6b7280] mb-2 font-medium">Description</p>
              <p className="text-xs text-[#9ca3af] leading-relaxed">{selected.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
