'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Circle, Skull, Globe, Server, RefreshCw, Camera } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
function auth(): HeadersInit {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function NetworkPage() {
  const [query, setQuery]       = useState('');
  const [filter, setFilter]     = useState('all');
  const [cluster, setCluster]   = useState(false);
  const [patientZero, setPatientZero] = useState(false);
  const [graphKey, setGraphKey] = useState(0);
  const [nodeCount, setNodeCount] = useState(0);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/network/?limit=500`, { headers: auth() });
        if (!res.ok) return;
        const d = await res.json();
        const nodes = d.nodes || [];
        setNodeCount(nodes.length);
        const byType: Record<string, number> = {};
        for (const n of nodes) { const t = (n.type || n.label || 'unknown').toString(); byType[t] = (byType[t] || 0) + 1; }
        setTypeCounts(byType);
      } catch { setNodeCount(0); }
    })();
  }, [graphKey]);

  const stats = useMemo(() => {
    const actors  = (typeCounts.Actor || 0) + (typeCounts.ThreatActor || 0) + (typeCounts.actor || 0);
    const ips     = (typeCounts.IP || 0) + (typeCounts.Ip || 0);
    const systems = (typeCounts.System || 0) + (typeCounts.Bot || 0) + (typeCounts.Target || 0);
    return [
      { label: 'Total Nodes',    value: nodeCount, icon: Circle },
      { label: 'Actors / Threats', value: actors,  icon: Skull },
      { label: 'IPs',            value: ips,       icon: Globe },
      { label: 'Systems / Bots', value: systems,   icon: Server },
    ];
  }, [nodeCount, typeCounts]);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 32px)' }}>

      {/* Controls header */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.05)', minHeight: '48px' }}
      >
        <input
          className="input"
          style={{ width: '240px', height: '30px' }}
          placeholder="Search nodes…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {['all', 'actors', 'systems'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="btn btn-sm capitalize"
            style={{
              background: filter === f ? 'rgba(94,106,210,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filter === f ? 'rgba(94,106,210,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: filter === f ? '#5e6ad2' : '#9ca3af',
            }}
          >
            {f === 'all' ? 'All Nodes' : f === 'actors' ? 'Actors' : 'Systems'}
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => setCluster(!cluster)}
          className="btn btn-sm mono-10"
          style={{
            background: cluster ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${cluster ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: cluster ? '#7c3aed' : '#9ca3af',
          }}
        >COMMUNITY_VIEW</button>
        <button
          onClick={() => setPatientZero(!patientZero)}
          className="btn btn-sm mono-10"
          style={{
            background: patientZero ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${patientZero ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: patientZero ? '#f97316' : '#9ca3af',
          }}
        >PATIENT_ZERO</button>
        <Badge variant="accent">GDS ACTIVE</Badge>
        <button onClick={() => setGraphKey(k => k + 1)} className="btn btn-ghost btn-sm">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setGraphKey(k => k + 1)} className="btn btn-ghost btn-sm">
          <Camera className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stat band */}
      <div className="grid grid-cols-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center gap-3 px-5 py-4"
              style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
              <Icon className="w-4 h-4 text-[#5e6ad2] shrink-0" strokeWidth={1.5} />
              <div>
                <div className="text-2xl font-semibold text-[#f3f4f6] tabular-nums">{s.value}</div>
                <div className="text-2xs uppercase tracking-wider text-[#6b7280] font-medium mt-0.5">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Graph canvas — fills remaining space */}
      <div className="flex-1 relative flex items-center justify-center" style={{ background: '#0e0e0e' }}>
        <div className="text-center">
          <Circle className="w-12 h-12 text-[#4b5563] mx-auto mb-3" />
          <p className="text-sm text-[#6b7280]">Network graph visualization</p>
          <p className="text-xs text-[#4b5563] mt-1">D3.js force-directed layout</p>
        </div>
      </div>
    </div>
  );
}
