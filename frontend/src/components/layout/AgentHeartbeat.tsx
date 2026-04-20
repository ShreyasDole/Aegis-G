'use client';
import React, { useEffect, useState } from 'react';

const AGENTS = [
  { id: 1, name: 'Agent 1 · Sentinel', color: '#3b82f6' },
  { id: 2, name: 'Agent 2 · Graph', color: '#8b5cf6' },
  { id: 3, name: 'Agent 3 · Analyst', color: '#10b981' },
  { id: 4, name: 'Agent 4 · Guardian', color: '#ef4444' },
];

export function AgentHeartbeat() {
  const [pulses, setPulses] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setPulses(prev => {
        const next = { ...prev };
        const agentId = AGENTS[Math.floor(Math.random() * AGENTS.length)].id;
        next[agentId] = (next[agentId] + 1) % 100;
        return next;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 p-3 rounded-lg border border-border-subtle bg-bg-secondary">
      <p className="text-[9px] font-mono uppercase tracking-widest text-text-muted mb-2">
        Neural Heartbeat
      </p>
      <div className="space-y-1.5">
        {AGENTS.map(agent => (
          <div key={agent.id} className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
              style={{ backgroundColor: agent.color }}
            />
            <span className="text-[10px] font-mono text-text-secondary flex-1 truncate">
              {agent.name}
            </span>
            <span className="text-[9px] font-mono text-text-muted">
              {String(pulses[agent.id]).padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
