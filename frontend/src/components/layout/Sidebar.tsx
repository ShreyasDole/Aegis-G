'use client';
import React from 'react';
import { Card } from '../ui/Card';

export const Sidebar: React.FC = () => {
  const activities = [
    { text: 'New threat detected from Russia', time: '2m ago', type: 'critical', label: 'CRITICAL' },
    { text: 'User login from China', time: '5m ago', type: 'warning', label: 'WARNING' },
    { text: 'AI insight ready', time: '10m ago', type: 'info', label: 'INFO' },
    { text: 'System backup completed', time: '15m ago', type: 'success', label: 'SUCCESS' },
    { text: 'Failed login attempt', time: '20m ago', type: 'critical', label: 'CRITICAL' },
  ];

  const systemHealth = [
    { label: 'Backend', status: 'online', value: 99.9 },
    { label: 'Database', status: 'online', value: 100 },
    { label: 'Redis Cache', status: 'online', value: 100 },
    { label: 'Neo4j Graph', status: 'warning', value: 85 },
  ];

  const getActivityColor = (type: string) => {
    switch(type) {
      case 'critical': return 'border-l-danger';
      case 'warning': return 'border-l-warning';
      case 'success': return 'border-l-success';
      default: return 'border-l-info';
    }
  };

  const getLabelColor = (type: string) => {
    switch(type) {
      case 'critical': return 'text-danger';
      case 'warning': return 'text-warning';
      case 'success': return 'text-success';
      default: return 'text-info';
    }
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-80 bg-bg-secondary border-r border-border-subtle overflow-y-auto scrollbar-thin p-4">
      {/* Live Activity Feed */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">Activity Feed</h3>
          <span className="flex items-center gap-2 text-xs text-success font-medium">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
            LIVE
          </span>
        </div>
        <div className="space-y-2">
          {activities.map((activity, idx) => (
            <div 
              key={idx}
              className={`flex items-start gap-3 p-2 rounded hover:bg-bg-tertiary transition-colors cursor-pointer border-l-2 ${getActivityColor(activity.type)}`}
            >
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${getLabelColor(activity.type)}`}>
                  {activity.label}
                </div>
                <p className="text-sm text-text-primary truncate">{activity.text}</p>
                <p className="text-xs text-text-muted mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* System Health */}
      <Card>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary mb-4">System Status</h3>
        <div className="space-y-3">
          {systemHealth.map((system, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    system.status === 'online' ? 'bg-success' : 'bg-warning'
                  }`}></span>
                  <span className="text-sm text-text-secondary">{system.label}</span>
                </div>
                <span className="text-sm font-mono text-text-primary">{system.value}%</span>
              </div>
              <div className="w-full bg-bg-primary rounded-full h-1.5">
                <div
                  className={`h-full rounded-full ${
                    system.value >= 95 ? 'bg-success' : 'bg-warning'
                  }`}
                  style={{ width: `${system.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick AI Insights */}
      <Card className="mt-4 bg-primary/5 border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">AI Insights</h3>
          <span className="ml-auto badge-info text-xs px-2 py-0.5">3 NEW</span>
        </div>
        <div className="space-y-2">
          <div className="p-2 bg-bg-primary/50 rounded text-xs text-text-secondary border-l-2 border-warning">
            <span className="text-warning font-semibold">WARNING:</span> Pattern detected - Increased login attempts from Asia
          </div>
          <div className="p-2 bg-bg-primary/50 rounded text-xs text-text-secondary border-l-2 border-warning">
            <span className="text-warning font-semibold">ANOMALY:</span> Unusual traffic spike at 3 AM
          </div>
          <div className="p-2 bg-bg-primary/50 rounded text-xs text-text-secondary border-l-2 border-info">
            <span className="text-info font-semibold">RECOMMEND:</span> Update firewall rules
          </div>
        </div>
        <button className="mt-3 w-full btn-primary text-sm py-1.5">
          View All Insights
        </button>
      </Card>
    </aside>
  );
};

