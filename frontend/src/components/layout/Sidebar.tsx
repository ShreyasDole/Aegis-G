'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';

export const Sidebar: React.FC = () => {
  const [activities] = useState<any[]>([]);
  const [health, setHealth] = useState({ postgres: 100, neo4j: 100, redis: 100 });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`/api/system/health`);
        if (res.ok) {
          const data = await res.json();
          setHealth({
            postgres: data.database ? 100 : 0,
            neo4j: data.database ? 100 : 0,
            redis: (data.database || data.ai_engine) ? 100 : 0
          });
        }
      } catch (e) {
        setHealth({ postgres: 0, neo4j: 0, redis: 0 });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const systemHealth = [
    { label: 'Postgres', value: health.postgres, status: health.postgres > 0 ? 'online' : 'offline' },
    { label: 'Neo4j', value: health.neo4j, status: health.neo4j > 0 ? 'online' : 'offline' },
    { label: 'Redis', value: health.redis, status: health.redis > 0 ? 'online' : 'offline' }
  ];
  const [aiInsights] = useState<any[]>([]);

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
          {activities.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">
              No recent activity
            </div>
          ) : (
            activities.map((activity, idx) => (
              <div 
                key={idx}
                className={`flex items-start gap-3 p-2 rounded hover:bg-bg-tertiary transition-colors cursor-pointer border-l-2 ${getActivityColor(activity.type)}`}
                onClick={() => console.log('Activity clicked', activity)}
              >
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${getLabelColor(activity.type)}`}>
                    {activity.label}
                  </div>
                  <p className="text-sm text-text-primary truncate">{activity.text}</p>
                  <p className="text-xs text-text-muted mt-1">{activity.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* System Health */}
      <Card>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary mb-4">System Status</h3>
        <div className="space-y-3">
          {systemHealth.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">
              No system health data available
            </div>
          ) : (
            systemHealth.map((system, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    system.status === 'online' ? 'bg-success' : 'bg-danger'
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
            ))
          )}
        </div>
      </Card>


      {/* Quick AI Insights */}
      <Card className="mt-4 bg-primary/5 border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">AI Insights</h3>
          {aiInsights.length > 0 && (
            <span className="ml-auto badge-info text-xs px-2 py-0.5">{aiInsights.length} NEW</span>
          )}
        </div>
        <div className="space-y-2">
          {aiInsights.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">
              No AI insights available
            </div>
          ) : (
            aiInsights.map((insight, idx) => (
              <div 
                key={idx}
                className="p-2 bg-bg-primary/50 rounded text-xs text-text-secondary border-l-2 border-warning"
                onClick={() => console.log('AI insight clicked', insight)}
              >
                <span className="text-warning font-semibold">{insight.type}:</span> {insight.message}
              </div>
            ))
          )}
        </div>
        <button 
          className="mt-3 w-full btn-primary text-sm py-1.5"
          onClick={() => console.log('View All Insights clicked')}
        >
          View All Insights
        </button>
      </Card>
    </aside>
  );
};

