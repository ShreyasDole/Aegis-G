'use client';
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NetworkGraph } from '@/components/visual/NetworkGraph';

export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const stats = [
    { label: 'Total Nodes', value: '0', icon: '⚪' },
    { label: 'Threat Actors', value: '0', icon: '🔴' },
    { label: 'IP Addresses', value: '0', icon: '🟠' },
    { label: 'Systems', value: '0', icon: '🔵' },
  ];

  return (
    <div className="min-h-screen p-6">
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
              <Button variant="secondary" icon="📸" onClick={() => console.log('Snapshot clicked')}>Snapshot</Button>
              <Button variant="primary" icon="🔄" onClick={() => console.log('Refresh clicked')}>Refresh</Button>
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
            <NetworkGraph />
          </div>
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
  );
}
