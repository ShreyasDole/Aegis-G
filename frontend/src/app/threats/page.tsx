'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ThreatCard } from '@/components/threats/ThreatCard';
import { Badge } from '@/components/ui/Badge';

export default function ThreatsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const threats = [
    {
      id: 1,
      title: 'APT29 - Phishing Campaign Detected',
      description: 'Targeting government emails with malware attachments',
      severity: 'critical' as const,
      source: '193.201.45.22 (Russia)',
      firstSeen: '2 hours ago',
      affectedSystems: 12,
      riskScore: 8.7,
    },
    {
      id: 2,
      title: 'Lazarus Group - Cryptocurrency Theft',
      description: 'Attempting to compromise exchange wallets',
      severity: 'critical' as const,
      source: '210.52.109.88 (North Korea)',
      firstSeen: '4 hours ago',
      affectedSystems: 8,
      riskScore: 9.1,
    },
    {
      id: 3,
      title: 'APT41 - Supply Chain Attack',
      description: 'Compromised software update mechanism detected',
      severity: 'high' as const,
      source: '118.26.34.12 (China)',
      firstSeen: '6 hours ago',
      affectedSystems: 23,
      riskScore: 7.9,
    },
    {
      id: 4,
      title: 'FIN7 - Point of Sale Malware',
      description: 'Retail payment systems targeted',
      severity: 'high' as const,
      source: '45.142.212.61 (Unknown)',
      firstSeen: '8 hours ago',
      affectedSystems: 15,
      riskScore: 7.2,
    },
    {
      id: 5,
      title: 'Suspicious Login Activity',
      description: 'Multiple failed authentication attempts',
      severity: 'medium' as const,
      source: '172.58.34.90 (USA)',
      firstSeen: '12 hours ago',
      affectedSystems: 3,
      riskScore: 5.4,
    },
    {
      id: 6,
      title: 'Port Scan Detected',
      description: 'Automated reconnaissance activity observed',
      severity: 'low' as const,
      source: '89.23.145.67 (Germany)',
      firstSeen: '1 day ago',
      affectedSystems: 1,
      riskScore: 3.2,
    },
  ];

  const filteredThreats = threats.filter(threat => {
    const matchesSeverity = filterSeverity === 'all' || threat.severity === filterSeverity;
    const matchesSearch = threat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         threat.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display text-glow-blue mb-2">
            🚨 Threat Intelligence
          </h1>
          <p className="text-text-secondary">
            Monitor and manage security threats in real-time
          </p>
        </div>

        {/* Filters & Actions */}
        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search threats..."
                icon={<span>🔍</span>}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Severity Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filterSeverity === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterSeverity('critical')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filterSeverity === 'critical'
                    ? 'bg-danger text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setFilterSeverity('high')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filterSeverity === 'high'
                    ? 'bg-warning text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setFilterSeverity('medium')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filterSeverity === 'medium'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setFilterSeverity('low')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filterSeverity === 'low'
                    ? 'bg-success text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
              >
                Low
              </button>
            </div>

            {/* View Mode */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
                title="Grid View"
              >
                <span className="text-lg">▦</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
                title="List View"
              >
                <span className="text-lg">☰</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="secondary" icon="📥">Export</Button>
              <Button variant="primary" icon="🔄">Refresh</Button>
            </div>
          </div>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-3xl font-bold text-danger mb-1">
              {threats.filter(t => t.severity === 'critical').length}
            </div>
            <div className="text-sm text-text-secondary">Critical</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-warning mb-1">
              {threats.filter(t => t.severity === 'high').length}
            </div>
            <div className="text-sm text-text-secondary">High</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-1">
              {threats.filter(t => t.severity === 'medium').length}
            </div>
            <div className="text-sm text-text-secondary">Medium</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-success mb-1">
              {threats.filter(t => t.severity === 'low').length}
            </div>
            <div className="text-sm text-text-secondary">Low</div>
          </Card>
        </div>

        {/* Threats Grid/List */}
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'
            : 'space-y-4'
        }>
          {filteredThreats.length > 0 ? (
            filteredThreats.map((threat) => (
              <ThreatCard key={threat.id} {...threat} />
            ))
          ) : (
            <Card className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No threats found</h3>
              <p className="text-text-secondary">
                Try adjusting your filters or search query
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

