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

async function readErr(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (j && typeof j.detail === 'string') return j.detail;
    if (j && Array.isArray(j.detail)) return j.detail.map((x: { msg?: string }) => x.msg || JSON.stringify(x)).join('; ');
  } catch {
    /* ignore */
  }
  return res.statusText || `HTTP ${res.status}`;
}

type ThreatRow = {
  id: number;
  content: string;
  risk_score: number;
  source_platform: string;
  timestamp: string;
  detected_by?: string;
};

type SummaryPayload = {
  threat_id: number;
  summary: string;
  status: string;
  stored_risk_score?: number;
  detected_by?: string;
  stylometry?: Record<string, unknown>;
  why_signals?: string[];
};

export default function ForensicsDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [threat, setThreat] = useState<ThreatRow | null>(null);
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [analysis, setAnalysis] = useState<{
    threat_id: number;
    stylometry?: Record<string, unknown>;
    ai_analysis?: Record<string, unknown>;
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
        if (threatRes.ok) {
          setThreat(await threatRes.json());
        } else if (threatRes.status === 401) {
          setError('Not logged in or bad token — refresh login.');
        } else if (threatRes.status === 403) {
          setError(`Forbidden: ${await readErr(threatRes)}`);
        } else if (threatRes.status === 404) {
          setError('Threat not found');
        } else {
          setError(await readErr(threatRes));
        }
        if (summaryRes.ok) setSummary(await summaryRes.json());
        else if (threatRes.ok) {
          /* non-fatal */
          console.warn('Forensics summary:', summaryRes.status, await readErr(summaryRes));
        }
      } catch {
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
        headers: { 'Content-Type': 'application/json', ...authHdr() },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis({
          threat_id: data.threat_id,
          stylometry: data.stylometry,
          ai_analysis: data.ai_analysis,
          entities: data.entities,
          attribution: data.attribution,
          recommendations: data.recommendations || [],
        });
      } else {
        setError(await readErr(res));
      }
    } catch {
      setError('Analysis request failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const risk10 = (r: number | undefined) => {
    if (r === undefined || Number.isNaN(r)) return null;
    return r <= 1 ? r * 10 : r;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Loading…</p>
      </div>
    );
  }

  if (error && !threat) {
    return (
      <div className="p-6 min-h-screen max-w-3xl mx-auto">
        <Card className="p-6">
          <p className="text-danger mb-2 font-semibold">{error}</p>
          <p className="text-text-muted text-sm mb-4">Use a valid JWT (login). Restart API after authz updates.</p>
          <Button variant="secondary" onClick={() => router.push('/threats')}>
            Back to Threats
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <Link href="/threats" className="text-sm text-primary hover:underline mb-2 inline-block">
            ← Back to Threats
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Forensics #{id}</h1>
          <p className="text-text-muted text-sm">Why it scored — stylometry on load; full run optional</p>
        </div>
        <Button variant="primary" onClick={runAnalysis} disabled={analyzing}>
          {analyzing ? 'Running…' : 'Run full forensic (Gemini + ledger)'}
        </Button>
      </div>

      {error && threat && (
        <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      <div className="space-y-6">
        {threat && (
          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-3">Content</h2>
            <p className="text-text-secondary text-sm whitespace-pre-wrap font-mono bg-bg-primary p-4 rounded">
              {threat.content}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-muted">
              <span>
                Stored risk:{' '}
                <strong className="text-text-primary">{risk10(threat.risk_score)?.toFixed(1) ?? threat.risk_score}/10</strong>{' '}
                (raw {threat.risk_score})
              </span>
              <span>Detector: {threat.detected_by || '—'}</span>
              <span>{threat.timestamp}</span>
              <span>{threat.source_platform}</span>
            </div>
          </Card>
        )}

        {summary && (
          <Card className="p-6 border-primary/20">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">Why this prediction</h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">{summary.summary}</p>
            {summary.why_signals && summary.why_signals.length > 0 && (
              <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary mb-4">
                {summary.why_signals.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
            {summary.stylometry && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {Object.entries(summary.stylometry).map(([k, v]) => (
                  <div key={k} className="bg-bg-primary p-2 rounded border border-border-subtle">
                    <div className="text-text-muted">{k}</div>
                    <div className="text-text-primary truncate">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
                  </div>
                ))}
              </div>
            )}
            <span className="inline-block mt-3 text-[10px] text-text-muted">
              Status: {summary.status} · pipeline: {summary.detected_by}
            </span>
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
