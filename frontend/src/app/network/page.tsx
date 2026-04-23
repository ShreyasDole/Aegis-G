'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
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

type ClusterApi = {
  cluster_id: string;
  nodes?: string[];
  members?: { id: string; label: string }[];
  avg_risk?: number;
};

export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'actors' | 'systems'>('all');
  const [clusterMode, setClusterMode] = useState(false);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientZeroId, setPatientZeroId] = useState<string | null>(null);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [patientZeroInfo, setPatientZeroInfo] = useState<{
    username: string;
    origin_time: string;
  } | null>(null);

  const loadNetwork = useCallback(async () => {
    setIsLoading(true);
    setClusterMode(false);
    setPatientZeroId(null);
    try {
      const data = await apiFetch('/api/network/');
      const rawEdges = (data.edges || []) as GraphEdge[];
      setNodes(data.nodes || []);
      setEdges(
        rawEdges.map((e: GraphEdge & { relationship?: string }) => ({
          source: e.source,
          target: e.target,
          relationship: e.relationship,
        }))
      );
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
    setIsLoading(true);
    setPatientZeroInfo(null);
    setClusterMode(false);

    try {
      let originId = 'c2_master';
      let pzData: { status?: string; user_id?: string; username?: string; origin_time?: string } = {};
      try {
        pzData = await apiFetch('/api/network/patient-zero/demo_astroturf_election_2024_h1');
        if (pzData.status === 'found' && pzData.user_id) originId = pzData.user_id;
      } catch {
        originId = 'c2_master';
      }

      if (pzData.status === 'found') {
        setPatientZeroInfo({
          username: pzData.username || originId,
          origin_time: pzData.origin_time || '',
        });
      }

      const treeData = await apiFetch(`/api/network/campaign/${originId}`);
      const rawNodes: GraphNode[] = treeData.nodes || [];
      const treeNodes: GraphNode[] = rawNodes.map((n: GraphNode) =>
        n.id === originId
          ? { ...n, type: 'PATIENT_ZERO', label: `PATIENT ZERO · ${n.label}` }
          : n
      );
      const te = (treeData.edges || []) as (GraphEdge & { relationship?: string })[];
      if (treeNodes.length > 0) {
        setNodes(treeNodes);
        setEdges(
          te.map(e => ({
            source: e.source,
            target: e.target,
            relationship: e.relationship,
          }))
        );
      } else {
        setNodes(prev =>
          prev.map(n =>
            n.id === originId
              ? { ...n, type: 'PATIENT_ZERO', label: `PATIENT ZERO · ${n.label}` }
              : n
          )
        );
      }
      setPatientZeroId(originId);
    } catch (e) {
      console.error('Patient zero trace failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDemoData = async () => {
    setSeedStatus('Seeding...');
    try {
      const res = await fetch('/api/network/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setSeedStatus('Demo loaded — refreshing');
        setTimeout(() => setSeedStatus(null), 4000);
        await loadNetwork();
      } else {
        setSeedStatus('Seed failed');
        setTimeout(() => setSeedStatus(null), 3000);
      }
    } catch {
      setSeedStatus('Network error');
      setTimeout(() => setSeedStatus(null), 3000);
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

      (data.clusters || []).forEach((cluster: ClusterApi) => {
        const members =
          cluster.members ||
          (cluster.nodes || []).map((id: string) => ({ id, label: id }));
        const commId = `COMM_${cluster.cluster_id}`;
        clusterNodes.push({
          id: commId,
          label: cluster.cluster_id,
          type: 'COMMUNITY',
          severity: (cluster.avg_risk ?? 0) > 0.7 ? 'critical' : 'medium',
          caption: `Louvain / structural cluster · avg model risk ${(cluster.avg_risk ?? 0).toFixed(2)}`,
        });
        members.forEach(m => {
          clusterNodes.push({
            id: m.id,
            label: m.label,
            type: 'User',
            severity: 'medium',
          });
          clusterEdges.push({ source: m.id, target: commId, relationship: 'RELATED' });
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

  const filteredByTab = useMemo(() => {
    if (selectedFilter === 'actors') return nodes.filter(n => n.type !== 'COMMUNITY');
    if (selectedFilter === 'systems') return nodes.filter(n => n.type === 'COMMUNITY');
    return nodes;
  }, [nodes, selectedFilter]);

  const visibleNodes = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;
    const q = searchQuery.toLowerCase();
    return filteredByTab.filter(
      n =>
        n.label.toLowerCase().includes(q) ||
        (n.caption && n.caption.toLowerCase().includes(q)) ||
        (n.platform && n.platform.toLowerCase().includes(q))
    );
  }, [filteredByTab, searchQuery]);

  const visibleIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(
    () => edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target)),
    [edges, visibleIds]
  );

  const elevatedActors = useMemo(
    () => nodes.filter(n => n.severity === 'critical' || n.severity === 'medium').length,
    [nodes]
  );

  const stats = useMemo(
    () => [
      { label: 'Total nodes', value: nodes.length, variant: 'default' as const },
      {
        label: 'Elevated tier (crit + med)',
        value: elevatedActors,
        variant: 'warning' as const,
      },
      {
        label: 'Louvain super-nodes',
        value: nodes.filter(n => n.type === 'COMMUNITY').length,
        variant: 'critical' as const,
      },
      { label: 'Coordinated edges', value: edges.length, variant: 'safe' as const },
    ],
    [nodes, edges, elevatedActors]
  );

  return (
    <div className="w-full flex-1 flex flex-col relative bg-transparent space-y-6">
      <div className="w-full mx-auto">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-3xl font-bold font-display text-glow-blue mb-2">Network intelligence</h1>
          <p className="text-text-secondary max-w-3xl text-sm leading-relaxed">
            Force-directed projection of coordinated actors. Orange/cyan edges are propagation types from Neo4j (
            REPOSTED / SHARED / INTERACTED_WITH). Patient-zero mode re-types the origin; community mode collapses
            members into purple super-nodes (Louvain modularity on User+Post projection when GDS is available).
          </p>
        </motion.div>

        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search label, caption, platform…"
                icon={<span>🔍</span>}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'actors', 'systems'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedFilter(f)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedFilter === f
                      ? 'bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.35)]'
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary border border-border-subtle'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'actors' ? 'Accounts' : 'Super-nodes'}
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
              type="button"
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
              type="button"
              onClick={handleTraceOrigin}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all border ${
                patientZeroId
                  ? 'bg-danger/20 border-danger text-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                  : 'bg-bg-tertiary border-border-medium text-text-muted hover:border-danger hover:text-danger'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              PATIENT_ZERO_TRACE
            </button>
            <button
              type="button"
              onClick={handleSeedDemoData}
              className="px-3 py-1.5 rounded text-[10px] font-bold border bg-warning/10 border-warning/40 text-warning hover:bg-warning/20 transition-all"
            >
              INJECT_DEMO_DATA
            </button>
            {seedStatus && (
              <span className="text-[10px] font-mono text-warning self-center">{seedStatus}</span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[9px] text-text-muted font-mono uppercase">GDS</span>
              <Badge variant="info">Neo4j</Badge>
            </div>
          </div>
          {patientZeroInfo && (
            <div className="mt-3 p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-center gap-3">
              <span className="text-xl">🚨</span>
              <div>
                <p className="text-xs font-bold text-danger uppercase tracking-wider">Origin resolved</p>
                <p className="text-sm text-text-primary font-mono">
                  <span className="text-danger font-bold">{patientZeroInfo.username}</span>
                  {patientZeroInfo.origin_time && (
                    <span className="text-text-muted ml-2 text-xs">@ {patientZeroInfo.origin_time}</span>
                  )}
                </p>
                <p className="text-[10px] text-text-secondary">
                  Min incoming REPOSTED/SHARED from cohort; ties broken by post timestamp.
                </p>
              </div>
            </div>
          )}
        </Card>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <StatCard value={stat.value} label={stat.label} variant={stat.variant} />
            </motion.div>
          ))}
        </motion.div>

        <Card className="p-0 overflow-hidden border-border-subtle">
          <NetworkGraph nodes={visibleNodes} edges={visibleEdges} isLoading={isLoading} />
        </Card>

        {selectedFilter === 'systems' && !clusterMode && visibleNodes.length === 0 && (
          <p className="text-center text-xs text-amber-400/90 mt-2">
            Super-nodes only exist after COMMUNITY_VIEW. Switch filter to All or run Louvain.
          </p>
        )}

        <Card className="mt-6">
          <h3 className="text-lg font-semibold mb-3">What you are looking at</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-text-secondary">
            <div>
              <p className="font-medium text-text-primary mb-1">Default graph</p>
              <p>
                Users as vertices; edges are observed coordination (shared/reposted/interacted). Node color encodes
                model risk tier from stored risk_score. Demo seed simulates EU-policy + election CIB: one Telegram C2
                operator and cross-platform amplifiers posting the same content hashes (hash overlap feeds Louvain).
              </p>
            </div>
            <div>
              <p className="font-medium text-text-primary mb-1">Patient-zero trace</p>
              <p>
                Loads campaign subgraph from resolved origin user_id. Edge direction follows propagation; red node is
                the operator with no incoming command edges from the cohort (structural patient-zero test).
              </p>
            </div>
            <div>
              <p className="font-medium text-text-primary mb-1">Community view</p>
              <p>
                Backend runs Louvain on a User+Post projection when GDS is installed; otherwise C2-chain or content-hash
                overlap clustering. UI draws one COMMUNITY node per cluster and spokes to member account ids.
              </p>
            </div>
            <div>
              <p className="font-medium text-text-primary mb-1">Interaction</p>
              <p>
                Canvas is a live force layout (not a screenshot). Click a node for platform, risk, and analyst caption.
                Search filters the visible set; edges are clipped to endpoints still on screen.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
