'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { NetworkGraph } from './NetworkGraph';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Cluster {
  cluster_id: string;
  nodes: string[];
  size: number;
  type: string;
  method?: string;
}

export const CampaignView: React.FC = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedRootId, setSelectedRootId] = useState<string | null>(null);
  const [graphKey, setGraphKey] = useState(0);
  const [loadingClusters, setLoadingClusters] = useState(true);
  const [clustersError, setClustersError] = useState<string | null>(null);
  const [graphNodes, setGraphNodes] = useState<import('./NetworkGraph').GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<import('./NetworkGraph').GraphEdge[]>([]);
  const [graphLoading, setGraphLoading] = useState(false);

  useEffect(() => {
    const loadClusters = async () => {
      setLoadingClusters(true);
      setClustersError(null);
      try {
        const res = await fetch(`/api/network/clusters`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(res.statusText || 'Failed to load clusters');
        const data = await res.json();
        setClusters(data.clusters || []);
        if (data.clusters?.length > 0 && !selectedRootId) {
          const first = data.clusters[0];
          const root = first.nodes?.[0] ?? first.cluster_id?.replace('GDS_Community_', 'user_') ?? 'user_1';
          setSelectedRootId(root);
        }
      } catch (e) {
        setClustersError(e instanceof Error ? e.message : 'Failed to load clusters');
        setClusters([]);
      } finally {
        setLoadingClusters(false);
      }
    };
    loadClusters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCampaignGraph = async (rootId: string) => {
    setGraphLoading(true);
    try {
      const res = await fetch(`/api/network/campaign/${rootId}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const nodes = (data.nodes || []).map((n: import('./NetworkGraph').GraphNode) =>
          n.id === rootId ? { ...n, type: 'PATIENT_ZERO' } : n
        );
        setGraphNodes(nodes);
        setGraphEdges(data.edges || []);
      }
    } catch {
      setGraphNodes([]);
      setGraphEdges([]);
    } finally {
      setGraphLoading(false);
    }
  };

  const handleSelectRoot = (rootId: string) => {
    setSelectedRootId(rootId);
    setGraphKey((k) => k + 1);
    loadCampaignGraph(rootId);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
              Propagation flow
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Source (Patient Zero) → Botnet → Targets. Select a campaign origin to view the tree.
            </p>
            {loadingClusters && (
              <p className="text-sm text-text-muted">Loading clusters...</p>
            )}
            {clustersError && (
              <p className="text-sm text-warning">{clustersError}</p>
            )}
            {!loadingClusters && clusters.length === 0 && !clustersError && (
              <p className="text-sm text-text-muted">No botnet clusters detected. Run scans to populate the graph.</p>
            )}
            {clusters.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-secondary">Botnet clusters (pick source)</p>
                {clusters.map((c) => (
                  <div key={c.cluster_id} className="border border-border-subtle rounded p-2 bg-bg-primary">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-mono text-primary">{c.cluster_id}</span>
                      <span className="text-[10px] text-text-muted">size {c.size}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(c.nodes || []).slice(0, 5).map((nodeId: string) => (
                        <button
                          key={nodeId}
                          type="button"
                          onClick={() => handleSelectRoot(nodeId)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                            selectedRootId === nodeId
                              ? 'bg-primary text-white border-primary'
                              : 'bg-bg-tertiary border-border-medium text-text-secondary hover:border-primary'
                          }`}
                        >
                          {nodeId}
                        </button>
                      ))}
                      {(c.nodes?.length ?? 0) > 5 && (
                        <span className="text-[10px] text-text-muted">+{c.nodes!.length - 5}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-border-subtle">
              <label className="text-xs text-text-muted block mb-1">Or enter Patient Zero ID</label>
              <input
                type="text"
                placeholder="e.g. user_123"
                className="w-full px-2 py-1.5 text-sm bg-bg-primary border border-border-medium rounded text-text-primary placeholder-text-muted"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = (e.target as HTMLInputElement).value?.trim();
                    if (v) {
                      setSelectedRootId(v);
                      setGraphKey((k) => k + 1);
                    }
                  }
                }}
              />
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary">
                Source → Botnet → Targets
              </h3>
              <Button variant="secondary" onClick={() => setGraphKey((k) => k + 1)}>
                Refresh
              </Button>
            </div>
            <NetworkGraph
              key={graphKey}
              nodes={graphNodes}
              edges={graphEdges}
              isLoading={graphLoading}
            />
            {selectedRootId && (
              <p className="text-[10px] text-text-muted mt-2 font-mono">
                Root: {selectedRootId}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
