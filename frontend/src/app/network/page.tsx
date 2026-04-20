'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { NetworkGraph, GraphNode, GraphEdge } from '@/components/visual/NetworkGraph';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function apiFetch(endpoint: string) {
  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [clusterMode, setClusterMode] = useState(false);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientZeroId, setPatientZeroId] = useState<string | null>(null);

  const loadNetwork = useCallback(async () => {
    setIsLoading(true);
    setClusterMode(false);
    setPatientZeroId(null);
    try {
      const data = await apiFetch('/api/network/');
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (e) {
      console.error('Network fetch failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNetwork();
  }, [loadNetwork]);

  const handleTraceOrigin = async () => {
    if (nodes.length === 0) return;
    // Use highest-risk node as the trace target, or first node
    const target = [...nodes].sort((a, b) =>
      (a.severity === 'critical' ? 0 : 1) - (b.severity === 'critical' ? 0 : 1)
    )[0];

    setIsLoading(true);
    try {
      const data = await apiFetch(`/api/network/campaign/${target.id}`);
      const newNodes: GraphNode[] = (data.nodes || []).map((n: GraphNode) =>
        n.id === target.id
          ? { ...n, type: 'PATIENT_ZERO', label: `PATIENT ZERO: ${n.label}` }
          : n
      );
      setNodes(newNodes);
      setEdges(data.edges || []);
      setPatientZeroId(target.id);
      setClusterMode(false);
    } catch (e) {
      console.error('Campaign trace failed:', e);
      // Mark locally if API fails
      setNodes(prev =>
        prev.map(n =>
          n.id === target.id
            ? { ...n, type: 'PATIENT_ZERO', label: `PATIENT ZERO: ${n.label}` }
            : n
        )
      );
      setPatientZeroId(target.id);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleClusterMode = async () => {
    if (clusterMode) {
      setClusterMode(false);
      await loadNetwork();
      return;
    }

    setIsLoading(true);
    setClusterMode(true);
    setPatientZeroId(null);
    try {
      const data = await apiFetch('/api/network/clusters');
      const clusterNodes: GraphNode[] = [];
      const clusterEdges: GraphEdge[] = [];

      (data.clusters || []).forEach((cluster: {
        cluster_id: string;
        nodes: string[];
        avg_risk?: number;
      }) => {
        const commId = `COMM_${cluster.cluster_id}`;
        clusterNodes.push({
          id: commId,
          label: cluster.cluster_id,
          type: 'COMMUNITY',
          severity: (cluster.avg_risk ?? 0) > 0.7 ? 'critical' : 'medium',
        });
        cluster.nodes.forEach((username: string) => {
          const uid = `user_${username}`;
          clusterNodes.push({ id: uid, label: username, type: 'User' });
          clusterEdges.push({ source: uid, target: commId });
        });
      });

      setNodes(clusterNodes);
      setEdges(clusterEdges);
    } catch (e) {
      console.error('Cluster fetch failed:', e);
      setClusterMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  const visibleNodes = searchQuery
    ? nodes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : nodes;

  const stats = [
    { label: 'Total Nodes', value: nodes.length.toString(), icon: '⚪' },
    { label: 'Threat Actors', value: nodes.filter(n => n.severity === 'critical').length.toString(), icon: '🔴' },
    { label: 'Communities', value: nodes.filter(n => n.type === 'COMMUNITY').length.toString(), icon: '🟠' },
    { label: 'Edges', value: edges.length.toString(), icon: '🔵' },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display text-glow-blue mb-2">
            🕸️ Network Analysis
          </h1>
          <p className="text-text-secondary">
            Topological Graph Intelligence — Louvain Community Detection & Patient Zero Tracing
          </p>
        </div>

        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search nodes..."
                icon={<span>🔍</span>}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'actors', 'systems'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedFilter === f
                      ? 'bg-primary text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" icon={<span>🔄</span>} onClick={loadNetwork}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border-subtle">
            <button
              onClick={toggleClusterMode}
              className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all border ${
                clusterMode
                  ? 'bg-secondary/20 border-secondary text-secondary shadow-glow-purple'
                  : 'bg-bg-tertiary border-border-medium text-text-muted hover:border-secondary hover:text-secondary'
              }`}
            >
              COMMUNITY_VIEW (LOUVAIN)
            </button>
            <button
              onClick={handleTraceOrigin}
              disabled={nodes.length === 0 || isLoading}
              className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all border ${
                patientZeroId
                  ? 'bg-danger/20 border-danger text-danger'
                  : 'bg-bg-tertiary border-border-medium text-text-muted hover:border-danger hover:text-danger'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              HIGHLIGHT_PATIENT_ZERO
            </button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[9px] text-text-muted font-mono uppercase">GDS Engine:</span>
              <Badge variant="info">ACTIVE</Badge>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, idx) => (
            <Card key={idx} hover className="text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </Card>
          ))}
        </div>

        <Card className="p-0 overflow-hidden">
          <NetworkGraph nodes={visibleNodes} edges={edges} isLoading={isLoading} />
        </Card>

        <Card className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Graph Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🧩</span>
              <div>
                <div className="font-medium text-text-primary">Community View</div>
                <div className="text-text-secondary">Runs Louvain Modularity via Neo4j GDS — clusters coordinated actors</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="font-medium text-text-primary">Patient Zero</div>
                <div className="text-text-secondary">Traverses SHARED/REPOSTED chains backwards to find C2 origin</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔍</span>
              <div>
                <div className="font-medium text-text-primary">Search</div>
                <div className="text-text-secondary">Filter visible nodes by label in real-time</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
