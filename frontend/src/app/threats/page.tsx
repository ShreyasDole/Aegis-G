'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ThreatCard } from '@/components/threats/ThreatCard';
import { ThreatMap } from '@/components/visual/ThreatMap';
import { exportToSTIX } from '@/lib/export';

export default function ThreatsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [threats, setThreats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadThreats = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const response = await fetch(`${API_URL}/api/threats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();

          const formattedThreats = data.map((t: any) => ({
            id: t.id,
            title: `Threat #${t.id} - ${t.source_platform}`,
            description: (t.content || '').substring(0, 100) + '...',
            content: t.content || '',
            severity:
              t.risk_score > 8
                ? 'critical'
                : t.risk_score > 6
                  ? 'high'
                  : t.risk_score > 4
                    ? 'medium'
                    : 'low',
            source: t.source_platform,
            firstSeen: new Date(t.timestamp || 0).toLocaleString(),
            affectedSystems: Math.floor(Math.random() * 10) + 1,
            riskScore: t.risk_score <= 1 ? t.risk_score * 10 : t.risk_score,
          }));

          setThreats(formattedThreats);
        }
      } catch (error) {
        console.error('Failed to load threats', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThreats();
  }, []);

  const filteredThreats = threats.filter(threat => {
    const matchesSeverity = filterSeverity === 'all' || threat.severity === filterSeverity;
    const matchesSearch = threat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         threat.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const threatsForMap = threats.map((t) => ({
    id: t.id,
    risk_score: t.riskScore,
    source_platform: t.source,
    timestamp: t.firstSeen,
  }));

  return (
    <div className="p-6 min-h-screen max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
            Threat Analysis
          </h1>
          <p className="text-text-secondary text-sm">
            Live feed from /api/threats — filter, map, and export
          </p>
        </div>

        {/* Filters & Actions */}
        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search threats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Severity Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  filterSeverity === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterSeverity('critical')}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  filterSeverity === 'critical'
                    ? 'bg-danger text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setFilterSeverity('high')}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  filterSeverity === 'high'
                    ? 'bg-warning text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setFilterSeverity('medium')}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  filterSeverity === 'medium'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setFilterSeverity('low')}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
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
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => window.open('/sharing', '_self')}>Sharing</Button>
              <Button variant="primary" onClick={() => window.location.reload()}>Refresh</Button>
            </div>
          </div>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center border-l-4 border-l-danger">
            <div className="text-3xl font-bold text-danger mb-1">
              {threats.filter(t => t.severity === 'critical').length}
            </div>
            <div className="text-sm text-text-secondary uppercase tracking-wider">Critical</div>
          </Card>
          <Card className="text-center border-l-4 border-l-warning">
            <div className="text-3xl font-bold text-warning mb-1">
              {threats.filter(t => t.severity === 'high').length}
            </div>
            <div className="text-sm text-text-secondary uppercase tracking-wider">High</div>
          </Card>
          <Card className="text-center border-l-4 border-l-yellow-500">
            <div className="text-3xl font-bold text-yellow-500 mb-1">
              {threats.filter(t => t.severity === 'medium').length}
            </div>
            <div className="text-sm text-text-secondary uppercase tracking-wider">Medium</div>
          </Card>
          <Card className="text-center border-l-4 border-l-success">
            <div className="text-3xl font-bold text-success mb-1">
              {threats.filter(t => t.severity === 'low').length}
            </div>
            <div className="text-sm text-text-secondary uppercase tracking-wider">Low</div>
          </Card>
        </div>

        {/* Threats Grid/List */}
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'
            : 'space-y-4'
        }>
          {isLoading ? (
            <Card className="col-span-full text-center py-12">
              <div className="text-text-secondary">Loading threats...</div>
            </Card>
          ) : filteredThreats.length > 0 ? (
            filteredThreats.map((threat) => (
              <ThreatCard
                key={threat.id}
                {...threat}
                onExportSTIX={exportToSTIX}
                onDismiss={(dismissId) => setThreats((prev) => prev.filter((t) => t.id !== dismissId))}
              />
            ))
          ) : (
            <Card className="col-span-full text-center py-12">
              <div className="text-6xl mb-4 text-text-muted">⚠</div>
              <h3 className="text-xl font-semibold mb-2">No threats found</h3>
              <p className="text-text-secondary">
                Try adjusting your filters or search query
              </p>
            </Card>
          )}
        </div>

        <ThreatMap threats={threatsForMap} />
    </div>
  );
}
