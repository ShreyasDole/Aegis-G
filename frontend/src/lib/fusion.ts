/**
 * Intelligence fusion (Agent 3) - calls backend /api/analyst/fusion
 */

const getApiUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface FusionParams {
  threat_id: number;
  content: string;
  forensic_data?: Record<string, unknown>;
  graph_data?: Record<string, unknown>;
}

export interface FusionReport {
  threat_title: string;
  executive_summary: string;
  threat_type: string;
  risk_level: string;
  confidence: number;
  evidence: Array<{ source: string; finding: string; weight: number }>;
  recommendations: Array<{ action: string; priority: string }>;
}

export interface FusionResult {
  report: FusionReport;
  thought_process: string;
  ledger_hash?: string;
  status?: string;
}

export async function fuseIntelligence(params: FusionParams): Promise<FusionResult> {
  const base = getApiUrl();
  const url = `${base}/api/analyst/fusion`;
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      threat_id: params.threat_id,
      content: params.content,
      forensic_data: params.forensic_data ?? {},
      graph_data: params.graph_data ?? {},
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Fusion failed: ${res.status}`);
  }

  return res.json() as Promise<FusionResult>;
}
