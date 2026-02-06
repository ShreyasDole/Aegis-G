'use client';
import React, { useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThreatCard } from '@/components/threats/ThreatCard';
import { ThreatMapGlobe } from '@/components/visual/ThreatMapGlobe';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardPage() {
  const [stats] = useState({
    activeThreats: 0,
    criticalAlerts: 0,
    highRisk: 0,
    totalEvents: 0,
    uptime: 0,
  });

  const [topThreats] = useState<any[]>([]);

  const [threatActors] = useState<any[]>([]);

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-80 p-6 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-wider uppercase mb-2">
              AEGIS-G Command Dashboard
            </h1>
            <p className="text-text-secondary text-sm">
              Real-time threat intelligence and system monitoring
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => console.log('Filter clicked')}>Filter</Button>
            <Button variant="secondary" onClick={() => console.log('Export clicked')}>Export</Button>
            <Button variant="primary" onClick={() => console.log('Refresh clicked')}>Refresh</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            value={stats.activeThreats}
            label="Active Threats"
            variant="warning"
            trend={{ value: 12, isPositive: false }}
          />
          <StatCard
            value={stats.criticalAlerts}
            label="Critical Alerts"
            variant="critical"
            trend={{ value: 8, isPositive: false }}
          />
          <StatCard
            value={stats.highRisk}
            label="High Risk"
            variant="warning"
          />
          <StatCard
            value={stats.totalEvents}
            label="Total Events"
            variant="default"
            trend={{ value: 15, isPositive: true }}
          />
          <StatCard
            value={`${stats.uptime}%`}
            label="System Uptime"
            variant="safe"
          />
        </div>

        {/* Status Indicators */}
        <Card className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Status Indicators
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-danger rounded"></span>
              <span className="text-text-secondary">Critical</span>
              <span className="font-semibold text-text-primary">(12)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-warning rounded"></span>
              <span className="text-text-secondary">High</span>
              <span className="font-semibold text-text-primary">(47)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded"></span>
              <span className="text-text-secondary">Medium</span>
              <span className="font-semibold text-text-primary">(89)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-success rounded"></span>
              <span className="text-text-secondary">Low</span>
              <span className="font-semibold text-text-primary">(42)</span>
            </div>
          </div>
        </Card>

        {/* Threat Map & Top Actors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Global Threat Map */}
          <Card className="lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Global Threat Distribution</h2>
            <ThreatMapGlobe />
          </Card>

          {/* Top Threat Actors */}
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Top Threat Actors</h2>
            <div className="space-y-3">
              {threatActors.length === 0 ? (
                <div className="text-center py-8 text-text-secondary text-sm">
                  No threat actors data available
                </div>
              ) : (
                threatActors.map((actor, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-bg-primary rounded hover:bg-bg-tertiary transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-text-muted">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {actor.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {actor.incidents} incidents
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-lg ${
                      actor.trend === 'up'
                        ? 'text-danger'
                        : actor.trend === 'down'
                        ? 'text-success'
                        : 'text-text-muted'
                    }`}
                  >
                    {actor.trend === 'up' ? '↑' : actor.trend === 'down' ? '↓' : '→'}
                  </span>
                </div>
                ))
              )}
            </div>
            <Button variant="secondary" className="w-full mt-4 text-sm" onClick={() => console.log('View All Actors clicked')}>
              View All Actors
            </Button>
          </Card>
        </div>

        {/* Recent Critical Threats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider">Recent Critical Threats</h2>
            <Button variant="secondary" className="text-sm" onClick={() => console.log('View All clicked')}>View All</Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {topThreats.length === 0 ? (
              <Card className="col-span-full text-center py-12">
                <div className="text-6xl mb-4 text-text-muted">⚠</div>
                <h3 className="text-xl font-semibold mb-2">No threats available</h3>
                <p className="text-text-secondary">
                  No critical threats detected at this time
                </p>
              </Card>
            ) : (
              topThreats.map((threat) => (
                <ThreatCard key={threat.id} {...threat} />
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="primary" className="flex-col h-20 justify-center" onClick={() => console.log('Scan Network clicked')}>
              <span className="text-sm">Scan Network</span>
            </Button>
            <Button variant="primary" className="flex-col h-20 justify-center" onClick={() => console.log('Generate Report clicked')}>
              <span className="text-sm">Generate Report</span>
            </Button>
            <Button variant="ai" className="flex-col h-20 justify-center" onClick={() => console.log('AI Insights clicked')}>
              <span className="text-sm">AI Insights</span>
            </Button>
            <Button variant="secondary" className="flex-col h-20 justify-center" onClick={() => console.log('Share Intel clicked')}>
              <span className="text-sm">Share Intel</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
