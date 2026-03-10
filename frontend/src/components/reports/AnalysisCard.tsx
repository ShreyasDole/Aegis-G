/**
 * Analysis Card Component
 * Displays forensic analysis results
 */
'use client';

interface AnalysisCardProps {
  analysis: {
    threat_id: number;
    analysis?: any;
    entities?: any;
    attribution?: any;
    recommendations?: string[];
  };
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  return (
    <div className="bg-bg-secondary rounded-lg border border-border-subtle p-6">
      <h2 className="text-2xl font-bold mb-4 text-text-primary">Forensic Analysis Report</h2>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-text-primary">Threat ID</h3>
        <p className="text-text-secondary">#{analysis.threat_id}</p>
      </div>

      {analysis.analysis && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-text-primary">Analysis Details</h3>
          <div className="bg-bg-primary p-4 rounded border border-border-subtle">
            <pre className="text-sm overflow-auto text-text-secondary">
              {typeof analysis.analysis === 'object'
                ? JSON.stringify(analysis.analysis, null, 2)
                : String(analysis.analysis)}
            </pre>
          </div>
        </div>
      )}

      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-text-primary">Recommendations</h3>
          <ul className="list-disc list-inside space-y-1 text-text-secondary">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

