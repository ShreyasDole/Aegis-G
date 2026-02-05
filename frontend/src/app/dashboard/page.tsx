'use client';
import React, { useState, useEffect } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThreatCard } from '@/components/threats/ThreatCard';
import { ThreatMapGlobe } from '@/components/visual/ThreatMapGlobe';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardPage() {
  const [stats] = useState({
    activeThreats: 85,
    criticalAlerts: 12,
    highRisk: 47,
    totalEvents: 326,
    uptime: 98.2,
  });

  const [topThreats] = useState([
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
  ]);

  const [threatActors] = useState([
    { name: 'APT29 (Cozy Bear)', incidents: 42, trend: 'up' },
    { name: 'Lazarus Group', incidents: 38, trend: 'up' },
    { name: 'APT41', incidents: 31, trend: 'stable' },
    { name: 'FIN7', incidents: 27, trend: 'down' },
    { name: 'APT28 (Fancy Bear)', incidents: 24, trend: 'up' },
  ]);

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-80 p-6 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-glow-blue mb-2">
              🛡️ Command Dashboard
            </h1>
            <p className="text-text-secondary">
              Real-time threat intelligence and system monitoring
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" icon="🔍">Filter</Button>
            <Button variant="secondary" icon="📥">Export</Button>
            <Button variant="primary" icon="🔄">Refresh</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            value={stats.activeThreats}
            label="Active Threats"
            icon="🚨"
            variant="warning"
            trend={{ value: 12, isPositive: false }}
          />
          <StatCard
            value={stats.criticalAlerts}
            label="Critical Alerts"
            icon="🔴"
            variant="critical"
            trend={{ value: 8, isPositive: false }}
          />
          <StatCard
            value={stats.highRisk}
            label="High Risk"
            icon="🟠"
            variant="warning"
          />
          <StatCard
            value={stats.totalEvents}
            label="Total Events"
            icon="📊"
            variant="default"
            trend={{ value: 15, isPositive: true }}
          />
          <StatCard
            value={`${stats.uptime}%`}
            label="System Uptime"
            icon="✅"
            variant="safe"
          />
        </div>

        {/* Threat Map & Top Actors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Global Threat Map */}
          <Card className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">🌍 Global Threat Map</h2>
            <ThreatMapGlobe />
          </Card>

          {/* Top Threat Actors */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">👤 Top Threat Actors</h2>
            <div className="space-y-3">
              {threatActors.map((actor, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-bg-primary rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-text-muted">
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
              ))}
            </div>
            <Button variant="secondary" className="w-full mt-4 text-sm">
              View All Actors →
            </Button>
          </Card>
        </div>

        {/* Recent Critical Threats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">🔴 Recent Critical Threats</h2>
            <Button variant="secondary" className="text-sm">View All →</Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {topThreats.map((threat) => (
              <ThreatCard key={threat.id} {...threat} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="primary" className="flex-col h-20">
              <span className="text-2xl mb-1">🔍</span>
              <span className="text-sm">Scan Network</span>
            </Button>
            <Button variant="primary" className="flex-col h-20">
              <span className="text-2xl mb-1">📊</span>
              <span className="text-sm">Generate Report</span>
            </Button>
            <Button variant="ai" className="flex-col h-20">
              <span className="text-2xl mb-1">🤖</span>
              <span className="text-sm">AI Insights</span>
            </Button>
            <Button variant="secondary" className="flex-col h-20">
              <span className="text-2xl mb-1">🔗</span>
              <span className="text-sm">Share Intel</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}


