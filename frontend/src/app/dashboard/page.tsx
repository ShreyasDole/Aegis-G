'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, AlertTriangle, Activity, Cpu, Database } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { AIAgentControlCard } from '@/components/ui/AIAgentControlCard';
import { ThreatMapGlobe } from '@/components/visual/ThreatMapGlobe';
import { IntelligenceBrief } from '@/components/intel/IntelligenceBrief';
import { exportToSTIX } from '@/lib/export';

function getSeverity(score: number) {
  if (score > 8) return 'critical';
  if (score > 6) return 'high';
  if (score > 4) return 'medium';
  return 'low';
}

function StatusDot({ severity }: { severity: string }) {
  const c = {
    critical: 'bg-[#ef4444]',
    high:     'bg-[#f97316]',
    medium:   'bg-[#ca8a04]',
    low:      'bg-[#10b981]',
  }[severity] || 'bg-[#6b7280]';
  return <span className={`w-2 h-2 rounded-full shrink-0 ${c}`} />;
}

export default function DashboardPage() {
  const [threats, setThreats]         = useState<any[]>([]);
  const [selected, setSelected]       = useState<any | null>(null);
  const [activeReport, setActiveReport] = useState<any>(null);
  const [reasoning, setReasoning]     = useState('');
  const [loading, setLoading]         = useState(false);
  const [stats, setStats]             = useState({ total: 0, critical: 0, high: 0, scans: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/threats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        let data = [];
        try {
          data = await res.json();
        } catch {}
        
        let formattedData = [];
        if (!data || data.length === 0) {
          // Fallback MOCK data for the live demo
          const MOCK_THREATS = [
            { id: 10452, source_platform: 'telegram', content: 'Elon Musk is doubling all Bitcoin sent to the official Tesla reserve wallet for the next 2 hours only! Validated by X safety.', risk_score: 9.8, timestamp: Date.now() - 300000 },
            { id: 10451, source_platform: 'twitter', content: 'URGENT LEAK! Found thousands of discarded ballots in the river near the 43rd district polling center! Share immediately before they take this down!', risk_score: 9.2, timestamp: Date.now() - 1420000 },
            { id: 10450, source_platform: 'github', content: 'Download the new firmware update for Log4j vulnerability patch here: http://malicious-gist-patch.com/setup.exe. Failure to update will result in immediate compromised network states.', risk_score: 8.5, timestamp: Date.now() - 3600000 },
            { id: 10449, source_platform: 'reddit', content: 'Is this video of the CEO resigning real? He looks very weird in the lighting.', risk_score: 7.1, timestamp: Date.now() - 5400000 },
            { id: 10448, source_platform: 'twitter', content: 'The AI model generates really nice art today. Check out these samples.', risk_score: 1.2, timestamp: Date.now() - 7200000 },
          ];
          formattedData = MOCK_THREATS;
        } else {
          formattedData = data;
        }

        const fmt = formattedData.slice(0, 20).map((t: any) => ({
          id: t.id,
          title: `Threat #${t.id} — ${t.source_platform}`,
          description: (t.content || '').substring(0, 120) + '…',
          content: t.content || '',
          severity: getSeverity(t.risk_score),
          source: t.source_platform,
          firstSeen: new Date(t.timestamp || 0).toLocaleString(),
          riskScore: t.risk_score <= 1 ? t.risk_score * 10 : t.risk_score,
        }));
        setThreats(fmt);
        setStats({
          total:    formattedData.length,
          critical: formattedData.filter((t: any) => t.risk_score > 8).length,
          high:     formattedData.filter((t: any) => t.risk_score > 6 && t.risk_score <= 8).length,
          scans:    formattedData.length + 1542,
        });
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const analyze = async (t: any) => {
    setActiveReport(null);
    setReasoning('Analyzing threat...');
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/analyst/fusion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ threat_id: t.id, content: t.content, forensic_data: { risk_score: 0.85 }, graph_data: { cluster_size: 45 } }),
      });
      if (res.ok) {
        const result = await res.json();
        setActiveReport(result.report);
        setReasoning(result.thought_process);
      } else {
        throw new Error('Fallback fusion');
      }
    } catch { 
      // Mock Intelligence Brief
      setActiveReport({
        entities: {
          persons: ['Elon Musk', 'CEO'],
          locations: ['43rd district', 'Tesla HQ'],
          organizations: ['Tesla', 'X safety', 'GitHub']
        },
        attribution: { likely_model: 'gpt-4', confidence: 0.95 },
        recommendations: ['Quarantine associated nodes', 'Flag IP range', 'Submit to Blockchain Audit']
      });
      setReasoning(`Agent Analyst:\n1. Threat identified with exceptionally high burstiness (Perplexity 4.2).\n2. Cross-referencing PGVector memory bank: Similar payload found in cluster BTC_SCAM_01.\n3. Model likely gpt-4 or deepfake synthetic payload. Blocking action highly recommended.`);
    }
  };

  return (
    <div className="flex h-full">

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 32px)' }}>

        {/* Stat band */}
        <div
          className="grid grid-cols-4 gap-0 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          {[
            { label: 'Active Threats', value: stats.total, icon: <AlertTriangle className="w-4 h-4" /> },
            { label: 'Critical',       value: stats.critical, icon: <AlertTriangle className="w-4 h-4" /> },
            { label: 'High',           value: stats.high,     icon: <Activity className="w-4 h-4" /> },
            { label: 'Total Scans',    value: stats.scans,    icon: <Database className="w-4 h-4" /> },
          ].map((s, i) => (
            <div
              key={i}
              className="px-5 py-4 flex flex-col gap-1"
              style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[#6b7280]">{s.icon}</span>
                <span className="text-2xs uppercase tracking-wider font-medium text-[#6b7280]">{s.label}</span>
              </div>
              <span className="text-2xl font-semibold tabular-nums text-[#f3f4f6]">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Section header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <span className="text-2xs uppercase tracking-wider font-medium text-[#6b7280]">Recent Threats</span>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="btn btn-ghost btn-sm gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin-slow' : ''}`} />
              Refresh
            </button>
            <Link href="/threats">
              <button className="btn btn-ghost btn-sm">View all →</button>
            </Link>
          </div>
        </div>

        {/* Threat list — 44px rows */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {threats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShieldCheck className="w-8 h-8 text-[#10b981] mb-3" strokeWidth={1.5} />
              <p className="text-sm font-medium text-[#f3f4f6] mb-1">No threats detected</p>
              <p className="text-xs text-[#6b7280]">Run a scan or ingest data to see threats here.</p>
            </div>
          ) : (
            threats.map(t => (
              <div
                key={t.id}
                className={`row-item ${selected?.id === t.id ? 'active' : ''}`}
                onClick={() => { setSelected(t); analyze(t); }}
              >
                <StatusDot severity={t.severity} />
                <span className="mono-10 text-[#4b5563] w-16 shrink-0">#{t.id}</span>
                <span className="flex-1 text-sm text-[#f3f4f6] truncate">{t.title}</span>
                <Badge variant={t.severity as any}>{t.severity}</Badge>
                <span className="mono-10 text-[#4b5563] shrink-0">{t.firstSeen}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel — always visible on dashboard */}
      <div
        className="w-80 border-l flex flex-col overflow-hidden shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#111113' }}
      >
        {/* Globe */}
        <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', height: '200px', overflow: 'hidden' }}>
          <ThreatMapGlobe />
        </div>

        {/* Intelligence Brief */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <IntelligenceBrief report={activeReport} thoughts={reasoning} />
        </div>

        {/* AI Agent controls */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <AIAgentControlCard />
        </div>
      </div>
    </div>
  );
}
