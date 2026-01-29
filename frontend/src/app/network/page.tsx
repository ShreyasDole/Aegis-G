/**
 * Graph Visualization Page
 * Interactive network exploration
 */
'use client';

import { GraphViz } from '@/components/visual/GraphViz';
import { useEffect, useState } from 'react';

export default function NetworkPage() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/network')
      .then(res => res.json())
      .then(data => {
        setGraphData({
          nodes: data.nodes || [],
          edges: data.edges || []
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch graph data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="container mx-auto p-6">Loading network graph...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🕸️ Network Graph Explorer</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-4">
        <GraphViz nodes={graphData.nodes} edges={graphData.edges} />
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Bot Clusters</h2>
        <button
          onClick={() => {
            fetch('/api/network/clusters')
              .then(res => res.json())
              .then(data => {
                console.log('Clusters:', data);
                alert(`Found ${data.clusters?.length || 0} clusters`);
              });
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Detect Clusters
        </button>
      </div>
    </div>
  );
}

