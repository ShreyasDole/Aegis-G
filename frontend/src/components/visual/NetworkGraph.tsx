'use client';
import React, { useEffect, useState } from 'react';
import { Network, Circle } from 'lucide-react';

interface NetworkGraphProps {
  refreshKey?: number;
  highlightPatientZero?: boolean;
  dataSource?: string;
}

export function NetworkGraph({ refreshKey, highlightPatientZero }: NetworkGraphProps) {
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);

  useEffect(() => {
    // Fetch network data from API
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/network/?limit=500`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setNodeCount(data.nodes?.length || 0);
          setEdgeCount(data.edges?.length || 0);
        }
      } catch {}
    };
    fetchData();
  }, [refreshKey]);

  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ background: '#0e0e0e' }}>
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative">
          <Network className="w-16 h-16 text-[#5e6ad2]" strokeWidth={1} />
          {highlightPatientZero && (
            <Circle className="w-6 h-6 text-[#f97316] absolute -top-1 -right-1 animate-pulse" fill="#f97316" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-[#9ca3af] mb-1">Force-Directed Graph</p>
          <p className="text-xs text-[#6b7280]">
            {nodeCount} nodes • {edgeCount} edges
          </p>
          <p className="text-2xs text-[#4b5563] mt-2">D3.js visualization • Real-time Neo4j data</p>
        </div>
      </div>

      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #5e6ad2, transparent 70%)' }}
      />
    </div>
  );
}
