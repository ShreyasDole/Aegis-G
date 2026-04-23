'use client';
import React, { useEffect, useState } from 'react';

interface HealthState {
  database: boolean;
  ai_engine: boolean;
  latency: number | null;
}

export function StatusBar() {
  const [health, setHealth] = useState<HealthState>({ database: false, ai_engine: false, latency: null });
  const [time, setTime] = useState('');

  const checkHealth = async () => {
    const start = performance.now();
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/system/health`);
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        setHealth({ database: !!data.database, ai_engine: !!data.ai_engine, latency });
      } else {
        setHealth(h => ({ ...h, latency, database: false, ai_engine: false }));
      }
    } catch {
      setHealth(h => ({ ...h, database: false, ai_engine: false, latency: null }));
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="status-bar">
      {/* Left: main status */}
      <div className="flex items-center gap-3 flex-1">
        <span className="dot-online" />
        <span className="text-[#9ca3af]">AEGIS-G ACTIVE</span>
        <span className="text-[#4b5563]">·</span>
        <span className="text-[#4b5563]">v2.0.0</span>
      </div>

      {/* Center: service statuses */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className={health.database ? 'dot-online' : 'dot-offline'} />
          <span className={health.database ? 'text-[#10b981]' : 'text-[#ef4444]'}>DB</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={health.ai_engine ? 'dot-online' : 'dot-offline'} />
          <span className={health.ai_engine ? 'text-[#10b981]' : 'text-[#ef4444]'}>AI</span>
        </span>
        {health.latency !== null && (
          <span className="text-[#4b5563]">{health.latency}ms</span>
        )}
      </div>

      {/* Right: time */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        <span className="text-[#4b5563]">{time}</span>
      </div>
    </div>
  );
}
