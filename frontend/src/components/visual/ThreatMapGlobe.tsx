'use client';
import React from 'react';
import { Globe } from 'lucide-react';

export function ThreatMapGlobe() {
  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ background: '#0e0e0e' }}>
      {/* Radial gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #5e6ad2 0%, transparent 60%)',
        }}
      />
      
      {/* Globe icon */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <Globe className="w-16 h-16 text-[#5e6ad2] animate-pulse" strokeWidth={1} />
        <div className="text-center">
          <p className="text-xs text-[#9ca3af] font-medium">Global Threat Map</p>
          <p className="text-2xs text-[#4b5563] mt-1">Real-time geospatial analysis</p>
        </div>
      </div>

      {/* Pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="absolute w-32 h-32 rounded-full border border-[#5e6ad2] opacity-20"
          style={{ animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite' }}
        />
        <div
          className="absolute w-48 h-48 rounded-full border border-[#5e6ad2] opacity-10"
          style={{ animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite 1s' }}
        />
      </div>
    </div>
  );
}
