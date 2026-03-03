'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';

export const Sidebar: React.FC = () => {
  const [health, setHealth] = useState({ postgres: 100, neo4j: 100, redis: 100 });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/system/health`);
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

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-80 bg-bg-secondary border-r border-border-subtle overflow-y-auto scrollbar-thin p-5">
      <Card className="p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-5">
          System Status
        </h3>
        <div className="space-y-4">
          {systemHealth.map((system, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      system.status === 'online' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-danger'
                    }`}
                    aria-hidden
                  />
                  <span className="text-sm font-medium text-text-primary">{system.label}</span>
                </div>
                <span className="text-sm font-mono text-text-secondary tabular-nums">{system.value}%</span>
              </div>
              <div className="w-full bg-bg-primary rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    system.value >= 95 ? 'bg-success' : 'bg-warning'
                  }`}
                  style={{ width: `${system.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </aside>
  );
}
