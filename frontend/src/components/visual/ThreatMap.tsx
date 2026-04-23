'use client';
import React from 'react';
import { MapPin } from 'lucide-react';

interface ThreatMapProps {
  threats: Array<{
    id: number;
    risk_score: number;
    source_platform: string;
    timestamp: string;
  }>;
}

export function ThreatMap({ threats }: ThreatMapProps) {
  return (
    <div className="relative w-full h-64 flex items-center justify-center" style={{ background: '#0e0e0e' }}>
      {/* Map grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <MapPin className="w-12 h-12 text-[#5e6ad2]" strokeWidth={1.5} />
        <div className="text-center">
          <p className="text-xs text-[#9ca3af] font-medium">Geospatial Threat Heatmap</p>
          <p className="text-2xs text-[#4b5563] mt-1">{threats.length} threats mapped globally</p>
        </div>
      </div>

      {/* Glow effect */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-10"
        style={{ background: 'radial-gradient(circle, #ef4444, transparent 70%)' }}
      />
    </div>
  );
}
