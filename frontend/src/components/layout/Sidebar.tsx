'use client';
import React from 'react';
import { Card } from '../ui/Card';

export const Sidebar: React.FC = () => {
  const activities = [
    { icon: '🔴', text: 'New threat detected from Russia', time: '2m ago', type: 'critical' },
    { icon: '🔵', text: 'User login from China', time: '5m ago', type: 'warning' },
    { icon: '🟣', text: 'AI insight ready', time: '10m ago', type: 'info' },
    { icon: '⚪', text: 'System backup completed', time: '15m ago', type: 'success' },
    { icon: '🔴', text: 'Failed login attempt', time: '20m ago', type: 'critical' },
  ];

  const systemHealth = [
    { label: 'Backend', status: 'online', value: '99.9%' },
    { label: 'Database', status: 'online', value: '100%' },
    { label: 'Redis', status: 'online', value: '100%' },
    { label: 'Neo4j', status: 'warning', value: '85%' },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-80 bg-bg-secondary border-r border-border-subtle overflow-y-auto scrollbar-thin p-4">
      {/* Live Activity Feed */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Live Activity</h3>
          <span className="flex items-center gap-2 text-xs text-success">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
            Live
          </span>
        </div>
        <div className="space-y-3">
          {activities.map((activity, idx) => (
            <div 
              key={idx}
              className="flex items-start gap-3 p-2 rounded hover:bg-bg-tertiary transition-colors cursor-pointer animate-slide-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <span className="text-lg">{activity.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{activity.text}</p>
                <p className="text-xs text-text-muted">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* System Health */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">System Health</h3>
        <div className="space-y-3">
          {systemHealth.map((system, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  system.status === 'online' ? 'bg-success' : 'bg-warning'
                }`}></span>
                <span className="text-sm text-text-secondary">{system.label}</span>
              </div>
              <span className="text-sm font-mono text-text-primary">{system.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick AI Insights */}
      <Card className="mt-4 bg-gradient-to-br from-bg-secondary to-purple-950/10 border-secondary/30">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🤖</span>
          <h3 className="text-lg font-semibold">AI Insights</h3>
          <span className="ml-auto badge-info text-xs">3 New</span>
        </div>
        <div className="space-y-2">
          <div className="p-2 bg-bg-primary/50 rounded text-xs text-text-secondary">
            ⚠️ Pattern detected: Increased login attempts from Asia
          </div>
          <div className="p-2 bg-bg-primary/50 rounded text-xs text-text-secondary">
            ⚠️ Anomaly: Unusual traffic spike at 3 AM
          </div>
          <div className="p-2 bg-bg-primary/50 rounded text-xs text-text-secondary">
            💡 Recommendation: Update firewall rules
          </div>
        </div>
        <button className="mt-3 w-full btn-ai text-sm py-1.5">
          View All Insights
        </button>
      </Card>
    </aside>
  );
};

