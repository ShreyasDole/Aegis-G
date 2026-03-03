'use client';
import React, { useState, useEffect } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThreatCard } from '@/components/threats/ThreatCard';
import { ThreatMapGlobe } from '@/components/visual/ThreatMapGlobe';
import { Sidebar } from '@/components/layout/Sidebar';
import { IntelligenceBrief } from '@/components/intel/IntelligenceBrief';
import { fuseIntelligence } from '@/lib/fusion';
import { exportToSTIX } from '@/lib/export';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeThreats: 0,
    criticalAlerts: 0,
    highRisk: 0,
    totalEvents: 0,
    uptime: 0,
    blockedThreats: 0, // Agent 4 blocked count
  });

  // Fetch blocked threats count
  useEffect(() => {
    const fetchBlockedCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/ai/blocked-content/stats', {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(prev => ({ ...prev, blockedThreats: data.today_count || 0 }));
        }
      } catch (error) {
        console.error('Error fetching blocked count:', error);
      }
    };

    fetchBlockedCount();
    const interval = setInterval(fetchBlockedCount, 30000); // Update every 30 seconds
    
    // WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:8000/ws/blocked-content');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'blocked_content') {
        setStats(prev => ({ ...prev, blockedThreats: prev.blockedThreats + 1 }));
      }
    };

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, []);

  const [topThreats, setTopThreats] = useState<any[]>([]);

  const [threatActors] = useState<any[]>([]);

  // Agent 3 Intelligence Brief state
  const [activeReport, setActiveReport] = useState<any>(null);
  const [reasoningLog, setReasoningLog] = useState<string>('');

  // Fetch top threats for dashboard
  useEffect(() => {
    const loadThreats = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/api/threats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const formatted = data.slice(0, 6).map((t: any) => ({
            id: t.id,
            title: `Threat #${t.id} - ${t.source_platform}`,
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
        }
      } catch (error) {
        console.error('Failed to load dashboard threats', error);
      }
    };
    loadThreats();
  }, []);

  const handleAnalyzeThreat = async (threatId: number, content: string) => {
    setActiveReport(null);
    setReasoningLog('Initializing Agent 3 Fusion protocol...\nConnecting to Gemini 3...');

    try {
      const result = await fuseIntelligence({
        threat_id: threatId,
        content: content,
        forensic_data: { risk_score: 0.85, is_ai_generated: true },
        graph_data: { cluster_size: 45 },
      });

      setActiveReport(result.report);
      setReasoningLog(result.thought_process);
    } catch (error) {
      console.error('Fusion failed:', error);
      setReasoningLog('ERROR: Connection to Agent 3 failed.');
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-80 p-6 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-wider uppercase mb-2">
              AEGIS-G Command Dashboard
            </h1>
            <p className="text-text-secondary text-sm">
              Real-time threat intelligence and system monitoring
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Agent 4 Blocked Counter */}
            <div className="text-right bg-bg-primary border border-red-500/30 rounded px-4 py-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                Agent 4 Blocked
              </div>
              <div className="text-2xl font-bold text-red-500">{stats.blockedThreats}</div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => console.log('Filter clicked')}>Filter</Button>
              <Button variant="secondary" onClick={() => console.log('Export clicked')}>Export</Button>
              <Button variant="primary" onClick={() => console.log('Refresh clicked')}>Refresh</Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            value={stats.activeThreats}
            label="Active Threats"
            variant="warning"
            trend={{ value: 12, isPositive: false }}
          />
          <StatCard
            value={stats.criticalAlerts}
            label="Critical Alerts"
            variant="critical"
            trend={{ value: 8, isPositive: false }}
          />
          <StatCard
            value={stats.highRisk}
            label="High Risk"
            variant="warning"
          />
          <StatCard
            value={stats.totalEvents}
            label="Total Events"
            variant="default"
            trend={{ value: 15, isPositive: true }}
          />
          <StatCard
            value={`${stats.uptime}%`}
            label="System Uptime"
            variant="safe"
          />
        </div>

        {/* Status Indicators */}
        <Card className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Status Indicators
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-danger rounded"></span>
              <span className="text-text-secondary">Critical</span>
              <span className="font-semibold text-text-primary">(12)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-warning rounded"></span>
              <span className="text-text-secondary">High</span>
              <span className="font-semibold text-text-primary">(47)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded"></span>
              <span className="text-text-secondary">Medium</span>
              <span className="font-semibold text-text-primary">(89)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-success rounded"></span>
              <span className="text-text-secondary">Low</span>
              <span className="font-semibold text-text-primary">(42)</span>
            </div>
          </div>
        </Card>

        {/* Phase 2.3: 3-Agent War Room Grid */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Column 1: Agent 1 - Forensic Feed */}
          <Card className="col-span-12 lg:col-span-4 p-4 border-l-2 border-emerald-500">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">A1 // Forensic Stream</h2>
              <span className="text-[9px] font-mono text-text-muted">CPU_LOAD: 12%</span>
            </div>
            <div className="space-y-3 h-[400px] overflow-y-auto scrollbar-thin pr-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-3 bg-bg-primary border border-border-subtle rounded text-[11px] hover:border-emerald-500/50 transition-all cursor-pointer">
                  <div className="flex justify-between mb-1">
                    <span className="text-emerald-400 font-bold">● AI_DETECTION</span>
                    <span className="text-text-muted">14:2{i}:02</span>
                  </div>
                  <p className="text-text-secondary italic line-clamp-2">&quot;Coordinated narrative regarding energy prices detected in Cluster 0{i}...&quot;</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 rounded">PROB: 0.9{i}</span>
                    <span className="text-text-muted">Model: DistilRoBERTa</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Column 2: Agent 2 - Campaign Graph (Mini) */}
          <Card className="col-span-12 lg:col-span-4 p-4 border-l-2 border-amber-500">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-500">A2 // Cluster Oracle</h2>
              <button className="text-[9px] text-amber-500 hover:underline">FULL_MAP</button>
            </div>
            <div className="h-[400px] bg-bg-primary rounded flex items-center justify-center relative overflow-hidden">
              {/* Placeholder for Yash&apos;s Mini-Graph */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#f59e0b 0.5px, transparent 0.5px)', backgroundSize: '15px 15px' }}></div>
              <div className="z-10 text-center">
                <div className="text-2xl mb-2">🕸️</div>
                <div className="text-[10px] font-mono text-amber-500">COMMUNITY_ID: LOUVAIN_04</div>
                <div className="text-[10px] text-text-muted mt-1">45 Nodes Linked</div>
              </div>
            </div>
          </Card>

          {/* Column 3: Agent 3 - Intel Brief */}
          <div className="col-span-12 lg:col-span-4">
            <IntelligenceBrief report={activeReport} thoughts={reasoningLog} />
          </div>
        </div>

        {/* Phase 2.3: Campaign Intensity Heatmap */}
        <Card className="mb-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Campaign Intensity Map (24H Timeline)</h2>
          <div className="flex gap-1 h-12">
            {Array.from({ length: 48 }).map((_, i) => {
              const opacity = 0.2 + (i / 48) * 0.6 + (i % 7) * 0.05;
              const clamped = Math.min(1, Math.max(0.1, opacity));
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all hover:scale-110 cursor-help"
                  style={{
                    backgroundColor: `rgba(239, 68, 68, ${clamped})`,
                    border: clamped > 0.7 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                  }}
                  title={`Intensity: ${(clamped * 100).toFixed(0)}% at T-${48 - i}h`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[9px] text-text-muted font-mono">
            <span>24 HOURS AGO</span>
            <span>CURRENT_WINDOW</span>
          </div>
        </Card>

        {/* Threat Map & Top Actors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Global Threat Map */}
          <Card className="lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Global Threat Distribution</h2>
            <ThreatMapGlobe />
          </Card>

          {/* Top Threat Actors */}
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Top Threat Actors</h2>
            <div className="space-y-3">
              {threatActors.length === 0 ? (
                <div className="text-center py-8 text-text-secondary text-sm">
                  No threat actors data available
                </div>
              ) : (
                threatActors.map((actor, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-bg-primary rounded hover:bg-bg-tertiary transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-text-muted">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {actor.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {actor.incidents} incidents
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-lg ${
                      actor.trend === 'up'
                        ? 'text-danger'
                        : actor.trend === 'down'
                        ? 'text-success'
                        : 'text-text-muted'
                    }`}
                  >
                    {actor.trend === 'up' ? '↑' : actor.trend === 'down' ? '↓' : '→'}
                  </span>
                </div>
                ))
              )}
            </div>
            <Button variant="secondary" className="w-full mt-4 text-sm" onClick={() => console.log('View All Actors clicked')}>
              View All Actors
            </Button>
          </Card>
        </div>

        {/* Recent Critical Threats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider">Recent Critical Threats</h2>
            <Button variant="secondary" className="text-sm" onClick={() => console.log('View All clicked')}>View All</Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {topThreats.length === 0 ? (
              <Card className="col-span-full text-center py-12">
                <div className="text-6xl mb-4 text-text-muted">⚠</div>
                <h3 className="text-xl font-semibold mb-2">No threats available</h3>
                <p className="text-text-secondary">
                  No critical threats detected at this time
                </p>
              </Card>
            ) : (
              topThreats.map((threat) => (
                <ThreatCard key={threat.id} {...threat} onAnalyze={handleAnalyzeThreat} onExportSTIX={exportToSTIX} />
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="primary" className="flex-col h-20 justify-center" onClick={() => console.log('Scan Network clicked')}>
              <span className="text-sm">Scan Network</span>
            </Button>
            <Button variant="primary" className="flex-col h-20 justify-center" onClick={() => console.log('Generate Report clicked')}>
              <span className="text-sm">Generate Report</span>
            </Button>
            <Button variant="ai" className="flex-col h-20 justify-center" onClick={() => console.log('AI Insights clicked')}>
              <span className="text-sm">AI Insights</span>
            </Button>
            <Button variant="secondary" className="flex-col h-20 justify-center" onClick={() => console.log('Share Intel clicked')}>
              <span className="text-sm">Share Intel</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
