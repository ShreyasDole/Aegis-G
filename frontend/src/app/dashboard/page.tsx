'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThreatCard } from '@/components/threats/ThreatCard';
import { IntelligenceBrief } from '@/components/intel/IntelligenceBrief';
import { fuseIntelligence } from '@/lib/fusion';
import { exportToSTIX } from '@/lib/export';
import Link from 'next/link';
import { ShieldCheck, Shield, AlertTriangle, Activity, Zap } from 'lucide-react';
import { ThreatMapGlobe } from '@/components/visual/ThreatMapGlobe';

export default function DashboardPage() {
  const [topThreats, setTopThreats] = useState<any[]>([]);
  const [activeReport, setActiveReport] = useState<any>(null);
  const [reasoningLog, setReasoningLog] = useState<string>('');
  const [blockedToday, setBlockedToday] = useState(0);
  const [stats, setStats] = useState({ activeThreats: 0, criticalAlerts: 0, highRisk: 0 });

  const loadThreats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/threats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const formatted = data.slice(0, 6).map((t: any) => ({
          id: t.id,
          title: `Threat #${t.id} — ${t.source_platform}`,
          description: (t.content || '').substring(0, 100) + '...',
          content: t.content || '',
          severity:
            t.risk_score > 8 ? 'critical' : t.risk_score > 6 ? 'high' : t.risk_score > 4 ? 'medium' : 'low',
          source: t.source_platform,
          firstSeen: new Date(t.timestamp || 0).toLocaleString(),
          affectedSystems: Math.floor(Math.random() * 10) + 1,
          riskScore: t.risk_score <= 1 ? t.risk_score * 10 : t.risk_score,
        }));
        setTopThreats(formatted);
        setStats({
          activeThreats: formatted.length,
          criticalAlerts: formatted.filter((t: any) => t.severity === 'critical').length,
          highRisk: formatted.filter((t: any) => t.severity === 'high' || t.severity === 'critical').length,
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard threats', error);
    }
  };

  // Fetch blocked count + WebSocket for Agent 4 real-time counter
  useEffect(() => {
    const fetchBlocked = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/ai/blocked-content/stats', {
          headers: { Authorization: `Bearer ${token || ''}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBlockedToday(data.today_count || 0);
        }
      } catch {
        // silently fail
      }
    };
    fetchBlocked();
    const interval = setInterval(fetchBlocked, 30000);

    let ws: WebSocket | null = null;
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const wsPort = process.env.NEXT_PUBLIC_WS_PORT || '8000';
      ws = new WebSocket(`ws://${host}:${wsPort}/ws/blocked-content`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'blocked_content') setBlockedToday((p) => p + 1);
        } catch { /* ignore */ }
      };
      ws.onerror = () => { /* suppress */ };
    }

    return () => {
      clearInterval(interval);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    loadThreats();
  }, []);

  const handleAnalyzeThreat = async (threatId: number, content: string) => {
    setActiveReport(null);
    setReasoningLog('Initializing Agent 3 Fusion protocol...');
    try {
      const result = await fuseIntelligence({
        threat_id: threatId,
        content,
        forensic_data: { risk_score: 0.85, is_ai_generated: true },
        graph_data: { cluster_size: 45 },
      });
      setActiveReport(result.report);
      setReasoningLog(result.thought_process);
    } catch {
      setReasoningLog('ERROR: Connection to Agent 3 failed.');
    }
  };

  return (
    <div className="p-6 min-h-screen max-w-[1600px] mx-auto">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-1">
            Main Dashboard
          </h1>
          <p className="text-text-muted text-sm">Threat intelligence and fusion analysis</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Agent 4 live blocked counter */}
          <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 rounded-xl px-4 py-2">
            <Shield className="w-4 h-4 text-danger" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Agent 4 Blocked</div>
              <div className="text-xl font-bold text-danger leading-none">{blockedToday}</div>
            </div>
          </div>
          <Button variant="primary" onClick={loadThreats}>Refresh</Button>
          <Link href="/threats">
            <Button variant="secondary">View All</Button>
          </Link>
        </div>
      </header>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <div>
            <div className="text-2xl font-bold text-text-primary">{stats.activeThreats}</div>
            <div className="text-[11px] text-text-muted uppercase tracking-widest">Active Threats</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Zap className="w-5 h-5 text-danger shrink-0" />
          <div>
            <div className="text-2xl font-bold text-text-primary">{stats.criticalAlerts}</div>
            <div className="text-[11px] text-text-muted uppercase tracking-widest">Critical Alerts</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary shrink-0" />
          <div>
            <div className="text-2xl font-bold text-text-primary">{stats.highRisk}</div>
            <div className="text-[11px] text-text-muted uppercase tracking-widest">High Risk</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Threats list — 8 col */}
        <section className="col-span-12 lg:col-span-8 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Recent Threats
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {topThreats.length === 0 ? (
              <Card className="col-span-full flex flex-col items-center justify-center py-16 px-6 min-h-[240px]">
                <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-8 h-8 text-success" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">No threats detected</h3>
                <p className="text-sm text-text-muted text-center max-w-sm">
                  Run a scan or ingest data to see threats here.
                </p>
              </Card>
            ) : (
              topThreats.map((threat) => (
                <ThreatCard
                  key={threat.id}
                  {...threat}
                  onAnalyze={handleAnalyzeThreat}
                  onExportSTIX={exportToSTIX}
                  onDismiss={(id) => setTopThreats((prev) => prev.filter((t) => t.id !== id))}
                />
              ))
            )}
          </div>
        </section>

        {/* Right sidebar — 4 col */}
        <aside className="col-span-12 lg:col-span-4 order-1 lg:order-2">
          <div className="lg:sticky lg:top-6 space-y-6">
            <IntelligenceBrief report={activeReport} thoughts={reasoningLog} />
            <div className="rounded-xl overflow-hidden border border-border-subtle">
              <ThreatMapGlobe />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
