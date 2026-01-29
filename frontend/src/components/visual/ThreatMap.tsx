/**
 * Geospatial Threat Heatmap Component
 */
'use client';

import { useEffect, useRef } from 'react';

interface Threat {
  id: number;
  risk_score: number;
  source_platform?: string;
  timestamp: string;
}

interface ThreatMapProps {
  threats: Threat[];
}

export function ThreatMap({ threats }: ThreatMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In production, integrate with a mapping library like Leaflet or Mapbox
    // For now, display a placeholder
    if (mapRef.current) {
      mapRef.current.innerHTML = `
        <div style="height: 400px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
          <div style="text-align: center;">
            <h3 style="color: #666;">Threat Heatmap</h3>
            <p style="color: #999;">Map visualization will be rendered here</p>
            <p style="color: #999; margin-top: 10px;">Threats detected: ${threats.length}</p>
          </div>
        </div>
      `;
    }
  }, [threats]);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Geospatial Threat Heatmap</h2>
      <div ref={mapRef} className="w-full"></div>
    </div>
  );
}

