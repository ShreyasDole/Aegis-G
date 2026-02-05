'use client';
import React, { useEffect, useRef } from 'react';

interface ThreatLocation {
  lat: number;
  lng: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  label: string;
}

export const ThreatMapGlobe: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Sample threat locations
    const threats: ThreatLocation[] = [
      { lat: 55.7558, lng: 37.6173, severity: 'critical', label: 'Russia' },
      { lat: 39.9042, lng: 116.4074, severity: 'high', label: 'China' },
      { lat: 40.7128, lng: -74.0060, severity: 'medium', label: 'USA' },
      { lat: 51.5074, lng: -0.1278, severity: 'low', label: 'UK' },
      { lat: 35.6762, lng: 139.6503, severity: 'high', label: 'Japan' },
    ];

    // Draw world map (simplified)
    const drawMap = () => {
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw continents (very simplified)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      
      // Grid lines
      ctx.beginPath();
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
      }
      ctx.stroke();

      // Draw threat markers
      threats.forEach((threat) => {
        // Convert lat/lng to canvas coordinates (simplified projection)
        const x = ((threat.lng + 180) / 360) * canvas.width;
        const y = ((90 - threat.lat) / 180) * canvas.height;

        // Draw pulsing circle
        const colors = {
          critical: '#ef4444',
          high: '#f59e0b',
          medium: '#eab308',
          low: '#10b981',
        };

        const color = colors[threat.severity];
        const radius = threat.severity === 'critical' ? 12 : threat.severity === 'high' ? 10 : 8;

        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        gradient.addColorStop(0, color + '80');
        gradient.addColorStop(1, color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '10px Inter';
        ctx.fillText(threat.label, x + radius + 5, y + 4);
      });
    };

    // Animation loop
    let animationFrame: number;
    let pulse = 0;
    const animate = () => {
      pulse += 0.05;
      drawMap();
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-bg-primary rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-bg-secondary/90 backdrop-blur-sm p-3 rounded-lg border border-border-subtle">
        <div className="text-xs font-semibold text-text-secondary mb-2">Threat Severity</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-danger rounded-full"></span>
            <span className="text-text-secondary">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-warning rounded-full"></span>
            <span className="text-text-secondary">High</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <span className="text-text-secondary">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-success rounded-full"></span>
            <span className="text-text-secondary">Low</span>
          </div>
        </div>
      </div>

      {/* Connection indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-bg-secondary/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border-subtle">
        <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
        <span className="text-xs text-text-secondary">Live Updates</span>
      </div>
    </div>
  );
};

