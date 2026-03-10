'use client';
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Sidebar } from '@/components/layout/Sidebar';
import { NetworkGraph } from '@/components/visual/NetworkGraph';
import { GraphViz } from '@/components/visual/GraphViz';

export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [clusterMode, setClusterMode] = useState(false);
  const [graphKey, setGraphKey] = useState(0);
  const [highlightPatientZero, setHighlightPatientZero] = useState(false);

  const handleRefresh = () => setGraphKey((k) => k + 1);
  const handleSnapshot = () => setGraphKey((k) => k + 1);
  const handleTraceOrigin = () => setHighlightPatientZero((v) => !v);

  const stats = [
    { label: 'Total Nodes', value: '0', icon: '⚪' },
    { label: 'Threat Actors', value: '0', icon: '🔴' },
    { label: 'IP Addresses', value: '0', icon: '🟠' },
    { label: 'Systems', value: '0', icon: '🔵' },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-80 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display text-glow-blue mb-2">
            🕸️ Network Analysis
          </h1>
          <p className="text-text-secondary">
            Visualize relationships between threats, actors, and systems
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search nodes..."
                icon={<span>🔍</span>}
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
              <Button variant="secondary" icon={<span>📸</span>} onClick={handleSnapshot}>Snapshot</Button>
              <Button variant="primary" icon={<span>🔄</span>} onClick={handleRefresh}>Refresh</Button>
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
          {stats.map((stat, idx) => (
            <Card key={idx} hover className="text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Network Graph */}
        <Card className="p-0 overflow-hidden">
          <div className="h-[600px] relative">
            <NetworkGraph refreshKey={graphKey} highlightPatientZero={highlightPatientZero} />
          </div>
        </Card>

        {/* Graph summary (alternative view) */}
        <Card className="mt-6 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-3">Graph summary</h3>
          <GraphViz nodes={[]} edges={[]} />
        </Card>

        {/* Graph Controls Info */}
        <Card className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Graph Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🖱️</span>
              <div>
                <div className="font-medium text-text-primary">Click</div>
                <div className="text-text-secondary">Select and view node details</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">👆</span>
              <div>
                <div className="font-medium text-text-primary">Hover</div>
                <div className="text-text-secondary">Highlight node and connections</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔍</span>
              <div>
                <div className="font-medium text-text-primary">Search</div>
                <div className="text-text-secondary">Find specific nodes by name</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
