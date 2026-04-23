/**
 * Forensic analysis — stylometry (local) + optional Gemini block
 */
'use client';

type StylometryBlock = {
  is_ai?: boolean;
  risk_score?: number;
  burstiness?: number;
  perplexity?: number;
  artifacts?: string[];
  adversarial_detected?: boolean;
  adversarial_patterns?: string[];
};

interface AnalysisCardProps {
  analysis: {
    threat_id: number;
    stylometry?: StylometryBlock;
    ai_analysis?: Record<string, unknown>;
    analysis?: unknown;
    entities?: unknown;
    attribution?: unknown;
    recommendations?: string[];
  };
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const s = analysis.stylometry;
  const ai = analysis.ai_analysis;

  return (
    <div className="bg-bg-secondary rounded-lg border border-border-subtle p-6 space-y-6">
      <h2 className="text-xl font-bold text-text-primary">Full forensic run</h2>
      <p className="text-xs text-text-muted">
        Agent 1 = local stylometry (always). Cloud block = Gemini when API key present; otherwise shows
        unavailable.
      </p>

      {s && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Agent 1 — why this score</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
            <div className="rounded border border-border-subtle bg-bg-primary p-3">
              <div className="text-[10px] text-text-muted uppercase">Model risk</div>
              <div className="font-mono text-text-primary">{s.risk_score ?? '—'}</div>
            </div>
            <div className="rounded border border-border-subtle bg-bg-primary p-3">
              <div className="text-[10px] text-text-muted uppercase">AI-like (tier)</div>
              <div className="font-mono text-text-primary">{s.is_ai ? 'yes' : 'no'}</div>
            </div>
            <div className="rounded border border-border-subtle bg-bg-primary p-3">
              <div className="text-[10px] text-text-muted uppercase">Burstiness</div>
              <div className="font-mono text-text-primary">{s.burstiness ?? '—'}</div>
            </div>
            <div className="rounded border border-border-subtle bg-bg-primary p-3">
              <div className="text-[10px] text-text-muted uppercase">Perplexity proxy</div>
              <div className="font-mono text-text-primary">{s.perplexity ?? '—'}</div>
            </div>
          </div>
          {s.adversarial_detected && (
            <p className="text-xs text-warning mb-2">
              Adversarial patterns: {(s.adversarial_patterns || []).join(', ') || 'detected'}
            </p>
          )}
          {s.artifacts && s.artifacts.length > 0 && (
            <ul className="list-disc list-inside text-xs text-text-secondary space-y-1">
              {s.artifacts.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {ai && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary mb-2">Cloud / multimodal</h3>
          <div className="bg-bg-primary p-4 rounded border border-border-subtle text-xs text-text-secondary overflow-auto max-h-80">
            <pre className="whitespace-pre-wrap font-mono">{fmt(ai)}</pre>
          </div>
        </section>
      )}

      {analysis.analysis != null && !s && (
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Raw analysis</h3>
          <pre className="text-xs overflow-auto text-text-secondary bg-bg-primary p-4 rounded border border-border-subtle">
            {typeof analysis.analysis === 'object'
              ? JSON.stringify(analysis.analysis, null, 2)
              : String(analysis.analysis)}
          </pre>
        </section>
      )}

      {(analysis.entities != null || analysis.attribution != null) && (
        <section className="grid md:grid-cols-2 gap-4">
          {analysis.entities != null && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Entities</h3>
              <pre className="text-xs bg-bg-primary p-3 rounded border border-border-subtle overflow-auto max-h-48">
                {fmt(analysis.entities)}
              </pre>
            </div>
          )}
          {analysis.attribution != null && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Attribution</h3>
              <pre className="text-xs bg-bg-primary p-3 rounded border border-border-subtle overflow-auto max-h-48">
                {fmt(analysis.attribution)}
              </pre>
            </div>
          )}
        </section>
      )}

      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Recommendations</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
