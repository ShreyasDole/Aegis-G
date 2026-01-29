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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Forensic Analysis Report</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Threat ID</h3>
        <p className="text-gray-700">#{analysis.threat_id}</p>
      </div>

      {analysis.analysis && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Analysis Details</h3>
          <div className="bg-gray-50 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(analysis.analysis, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
          <ul className="list-disc list-inside space-y-1">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="text-gray-700">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

