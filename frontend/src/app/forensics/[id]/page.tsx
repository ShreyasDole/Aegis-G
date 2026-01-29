/**
 * Deep Analysis View
 * Forensic analysis of specific threat
 */
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnalysisCard } from '@/components/reports/AnalysisCard';

export default function ForensicsPage() {
  const params = useParams();
  const threatId = params.id;
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (threatId) {
      fetch(`/api/analyze/${threatId}`)
        .then(res => res.json())
        .then(data => {
          setAnalysis(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch analysis:', err);
          setLoading(false);
        });
    }
  }, [threatId]);

  if (loading) {
    return <div className="container mx-auto p-6">Loading forensic analysis...</div>;
  }

  if (!analysis) {
    return <div className="container mx-auto p-6">Analysis not found</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🕵️ Forensic Analysis - Threat #{threatId}</h1>
      
      <AnalysisCard analysis={analysis} />
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Entities</h2>
        <div className="bg-gray-100 p-4 rounded">
          <pre>{JSON.stringify(analysis.entities, null, 2)}</pre>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Attribution</h2>
        <div className="bg-gray-100 p-4 rounded">
          <pre>{JSON.stringify(analysis.attribution, null, 2)}</pre>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
        <ul className="list-disc list-inside">
          {analysis.recommendations?.map((rec: string, idx: number) => (
            <li key={idx}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

