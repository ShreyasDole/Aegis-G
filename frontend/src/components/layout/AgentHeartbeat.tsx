'use client';
import React from 'react';
import { Activity, ShieldCheck, Zap, Brain } from "lucide-react";

export const AgentHeartbeat = () => {
  const agents = [
    { name: "Forensic Investigator (A1)", status: "Active", icon: <Zap className="w-3 h-3" />, color: "text-emerald-500" },
    { name: "Graph Oracle (A2)", status: "Scanning", icon: <Activity className="w-3 h-3" />, color: "text-amber-500" },
    { name: "Intelligence Analyst (A3)", status: "Reasoning", icon: <Brain className="w-3 h-3" />, color: "text-blue-500" },
    { name: "Policy Guardian (A4)", status: "Armed", icon: <ShieldCheck className="w-3 h-3" />, color: "text-red-500" },
  ];

  return (
    <div className="mt-8 pt-4 border-t border-border-subtle">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-4">
        Agent Neural Heartbeat
      </h3>
      <div className="space-y-3">
        {agents.map((agent) => (
          <div key={agent.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`${agent.color} animate-pulse`}>{agent.icon}</span>
              <span className="text-[11px] font-medium text-text-secondary">{agent.name}</span>
            </div>
            <span className="text-[9px] font-mono text-text-muted">{agent.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

