'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { NetworkGraph } from '@/components/visual/NetworkGraph';
import { Circle, Skull, Globe, Server, Camera, RefreshCw, MousePointer2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [clusterMode, setClusterMode] = useState(false);
  const [graphKey, setGraphKey] = useState(0);
  const [highlightPatientZero, setHighlightPatientZero] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});

  const handleRefresh = () => setGraphKey((k) => k + 1);
  const handleSnapshot = () => setGraphKey((k) => k + 1);
  const handleTraceOrigin = () => setHighlightPatientZero((v) => !v);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const res = await fetch(`${API_URL}/api/network/?limit=500`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const nodes = data.nodes || [];
        setNodeCount(nodes.length);
        const byType: Record<string, number> = {};
        for (const n of nodes) {
          const t = (n.type || n.label || 'unknown').toString();
          byType[t] = (byType[t] || 0) + 1;
        }
        setTypeCounts(byType);
      } catch {
        setNodeCount(0);
        setTypeCounts({});
      }
    };
    loadMeta();
  }, [graphKey]);

  const stats = useMemo(() => {
    const actorish =
      (typeCounts.Actor || 0) +
      (typeCounts.actor || 0) +
      (typeCounts.ThreatActor || 0) +
      (typeCounts['Threat Actor'] || 0);
    const ips = (typeCounts.IP || 0) + (typeCounts.Ip || 0) + (typeCounts.ip || 0);
    const systems = (typeCounts.System || 0) + (typeCounts.Bot || 0) + (typeCounts.Target || 0);
    return [
      { label: 'Total nodes', value: String(nodeCount), icon: Circle },
      { label: 'Actors / threats', value: String(actorish), icon: Skull },
      { label: 'IPs', value: String(ips), icon: Globe },
      { label: 'Systems / bots', value: String(systems), icon: Server },
    ];
  }, [nodeCount, typeCounts]);

  return (
    <div className="p-6 min-h-screen max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-1">
            Graph Intelligence
          </h1>
          <p className="text-text-secondary text-sm">
            Neo4j-backed relationships — threats, actors, infrastructure
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search nodes (client filter)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
              >
                All Nodes
              </button>
              <button
                onClick={() => setSelectedFilter('actors')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedFilter === 'actors'
                    ? 'bg-danger text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
              >
                Actors
              </button>
              <button
                onClick={() => setSelectedFilter('systems')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedFilter === 'systems'
                    ? 'bg-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
              >
                Systems
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="secondary" icon={<Camera className="w-4 h-4" />} onClick={handleSnapshot}>Snapshot</Button>
              <Button variant="primary" icon={<RefreshCw className="w-4 h-4" />} onClick={handleRefresh}>Refresh</Button>
            </div>
          </div>

          {/* Phase 2.4: Advanced Network Logic */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border-subtle">
            <button
              onClick={() => setClusterMode(!clusterMode)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all border ${clusterMode ? 'bg-secondary/20 border-secondary text-secondary shadow-glow-purple' : 'bg-bg-tertiary border-border-medium text-text-muted'}`}
            >
              COMMUNITY_VIEW (LOUVAIN)
            </button>
            <button
              className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all ${highlightPatientZero ? 'bg-warning/20 border-warning text-warning' : 'bg-bg-tertiary border-border-medium text-text-muted hover:border-danger hover:text-danger'}`}
              onClick={handleTraceOrigin}
            >
              HIGHLIGHT_PATIENT_ZERO
            </button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[9px] text-text-muted font-mono uppercase">GDS Engine:</span>
              <Badge variant="info">ACTIVE</Badge>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, idx) => {
            const Ico = stat.icon;
            return (
              <Card key={idx} hover className="text-center">
                <div className="flex justify-center mb-2 text-primary">
                  <Ico className="w-8 h-8 opacity-90" strokeWidth={1.5} />
                </div>
                <div className="text-2xl font-bold text-text-primary mb-1 tabular-nums">{stat.value}</div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
              </Card>
            );
          })}
        </div>

        {/* Network Graph */}
        <Card className="p-0 overflow-hidden">
          <div className="h-[600px] relative">
            <NetworkGraph refreshKey={graphKey} highlightPatientZero={highlightPatientZero} dataSource="api" />
          </div>
        </Card>

        <Card className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-3">Canvas</h3>
          <p className="text-sm text-text-secondary mb-4">
            Data from GET /api/network. Refresh updates counts and reloads the force layout.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <MousePointer2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-text-primary">Click / drag</div>
                <div className="text-text-secondary">Select nodes and pan the view</div>
              </div>
            </div>
          </div>
        </Card>
    </div>
  );
}
