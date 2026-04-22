'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnalysisCard } from '@/components/reports/AnalysisCard';

function authHdr(): HeadersInit {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function ForensicsDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [threat, setThreat] = useState<{ id: number; content: string; risk_score: number; source_platform: string; timestamp: string } | null>(null);
  const [summary, setSummary] = useState<{ threat_id: number; summary: string; status: string } | null>(null);
  const [analysis, setAnalysis] = useState<{
    threat_id: number;
    analysis?: unknown;
    entities?: unknown;
    attribution?: unknown;
    recommendations?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const threatId = parseInt(id, 10);
    if (Number.isNaN(threatId)) {
      setError('Invalid threat ID');
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [threatRes, summaryRes] = await Promise.all([
          fetch(`/api/threats/${threatId}`, { headers: authHdr() }),
          fetch(`/api/forensics/${threatId}/summary`, { headers: authHdr() }),
        ]);
        if (threatRes.ok) setThreat(await threatRes.json());
        else setError('Threat not found');
        if (summaryRes.ok) setSummary(await summaryRes.json());
      } catch (e) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const runAnalysis = async () => {
    if (!id) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/forensics/${id}`, {
        method: 'POST',
        headers: authHdr(),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis({
          threat_id: data.threat_id,
          analysis: data.analysis,
          entities: data.entities,
          attribution: data.attribution,
          recommendations: data.recommendations || [],
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || 'Analysis failed');
      }
    } catch (e) {
      setError('Analysis request failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (error && !threat) {
    return (
      <div className="p-6 min-h-screen max-w-3xl mx-auto">
        <Card className="p-6">
          <p className="text-danger mb-4">{error}</p>
          <Button variant="secondary" onClick={() => router.push('/threats')}>Back to Threats</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/threats" className="text-sm text-primary hover:underline mb-2 inline-block">← Back to Threats</Link>
            <h1 className="text-2xl font-bold text-text-primary">Forensic Analysis #{id}</h1>
            <p className="text-text-muted text-sm">Threat detail and deep-dive analysis</p>
          </div>
          <Button variant="primary" onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? 'Analyzing...' : 'Run forensic analysis'}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        <div className="space-y-6">
          {threat && (
            <Card className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-3">Threat content</h2>
              <p className="text-text-secondary text-sm whitespace-pre-wrap font-mono bg-bg-primary p-4 rounded">{threat.content}</p>
              <div className="mt-4 flex gap-4 text-xs text-text-muted">
                <span>Risk: {threat.risk_score?.toFixed(2)}</span>
                <span>Source: {threat.source_platform}</span>
                <span>Time: {threat.timestamp}</span>
              </div>
            </Card>
          )}

          {summary && (
            <Card className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-2">Summary</h2>
              <p className="text-text-secondary">{summary.summary}</p>
              <span className="inline-block mt-2 text-xs text-text-muted">Status: {summary.status}</span>
            </Card>
          )}

          {analysis && (
            <div className="rounded-lg overflow-hidden border border-border-subtle bg-bg-secondary">
              <AnalysisCard analysis={analysis} />
            </div>
          )}
        </div>
    </div>
  );
}
