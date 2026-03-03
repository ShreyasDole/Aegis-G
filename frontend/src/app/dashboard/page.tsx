'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThreatCard } from '@/components/threats/ThreatCard';
import { Sidebar } from '@/components/layout/Sidebar';
import { IntelligenceBrief } from '@/components/intel/IntelligenceBrief';
import { fuseIntelligence } from '@/lib/fusion';
import { exportToSTIX } from '@/lib/export';
import Link from 'next/link';

export default function DashboardPage() {
  const [topThreats, setTopThreats] = useState<any[]>([]);
  const [activeReport, setActiveReport] = useState<any>(null);
  const [reasoningLog, setReasoningLog] = useState<string>('');

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

  useEffect(() => {
    loadThreats();
  }, []);

  const handleAnalyzeThreat = async (threatId: number, content: string) => {
    setActiveReport(null);
    setReasoningLog('Initializing Agent 3 Fusion protocol...');

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
      <Sidebar />

      <div className="flex-1 ml-80 p-6 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-wider uppercase mb-2">
              AEGIS-G Command Dashboard
            </h1>
            <p className="text-text-secondary text-sm">
              Threat intelligence and Agent 3 fusion
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" onClick={loadThreats}>Refresh</Button>
            <Link href="/threats">
              <Button variant="secondary">View All Threats</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 mb-6">
          <div className="col-span-12 lg:col-span-4">
            <IntelligenceBrief report={activeReport} thoughts={reasoningLog} />
          </div>

          <div className="col-span-12 lg:col-span-8">
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider">Recent Threats</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {topThreats.length === 0 ? (
                <Card className="col-span-full text-center py-12">
                  <div className="text-6xl mb-4 text-text-muted">⚠</div>
                  <h3 className="text-xl font-semibold mb-2">No threats available</h3>
                  <p className="text-text-secondary">
                    No threats detected. Run a scan or check back later.
                  </p>
                </Card>
              ) : (
                topThreats.map((threat) => (
                  <ThreatCard
                    key={threat.id}
                    {...threat}
                    onAnalyze={handleAnalyzeThreat}
                    onExportSTIX={exportToSTIX}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
