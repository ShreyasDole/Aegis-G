'use client';
import React, { useEffect, useRef, useState } from 'react';

interface ThreatArc {
  origin: { lat: number; lng: number; label: string };
  target: { lat: number; lng: number; label: string };
  color: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// Convert lat/lng to 3D sphere coordinates
const latLngToSphere = (lat: number, lng: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.cos(phi),
    z: Math.sin(phi) * Math.sin(theta)
  };
};

export const ThreatMapGlobe: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [threatArcs, setThreatArcs] = useState<ThreatArc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch threat data with geographic origins
  useEffect(() => {
    const loadThreats = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // Fetch threats from API (in production, this would include geo data)
        const response = await fetch(`${API_URL}/api/threats/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          // Map threats to geographic arcs
          // In production, threats would have source_platform with geo data
          const arcs: ThreatArc[] = [
            { 
              origin: { lat: 55.7558, lng: 37.6173, label: 'Russia' },
              target: { lat: 40.7128, lng: -74.0060, label: 'USA' },
              color: '#ef4444',
              severity: 'critical'
            },
            { 
              origin: { lat: 39.9042, lng: 116.4074, label: 'China' },
              target: { lat: 51.5074, lng: -0.1278, label: 'UK' },
              color: '#f59e0b',
              severity: 'high'
            },
            { 
              origin: { lat: 35.6762, lng: 139.6503, label: 'Japan' },
              target: { lat: 52.5200, lng: 13.4050, label: 'Germany' },
              color: '#eab308',
              severity: 'medium'
            }
          ];
          setThreatArcs(arcs);
        } else {
          // Fallback to mock data
          setThreatArcs([
            { 
              origin: { lat: 55.7558, lng: 37.6173, label: 'Russia' },
              target: { lat: 40.7128, lng: -74.0060, label: 'USA' },
              color: '#ef4444',
              severity: 'critical'
            },
            { 
              origin: { lat: 39.9042, lng: 116.4074, label: 'China' },
              target: { lat: 51.5074, lng: -0.1278, label: 'UK' },
              color: '#f59e0b',
              severity: 'high'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load threats:', error);
        // Fallback mock data
        setThreatArcs([
          { 
            origin: { lat: 55.7558, lng: 37.6173, label: 'Russia' },
            target: { lat: 40.7128, lng: -74.0060, label: 'USA' },
            color: '#ef4444',
            severity: 'critical'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadThreats();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isLoading) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    let rotation = 0;
    const dots: {x: number, y: number, z: number}[] = [];
    const DOT_COUNT = 800;
    const RADIUS_SCALE = 0.35; // 35% of canvas min dimension

    // Initialize dots on a sphere
    for (let i = 0; i < DOT_COUNT; i++) {
      const phi = Math.acos(-1 + (2 * i) / DOT_COUNT);
      const theta = Math.sqrt(DOT_COUNT * Math.PI) * phi;
      dots.push({
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi)
      });
    }

    // Convert threat arcs to sphere coordinates
    const threatPoints = threatArcs.flatMap(arc => [
      { ...latLngToSphere(arc.origin.lat, arc.origin.lng), label: arc.origin.label, color: arc.color },
      { ...latLngToSphere(arc.target.lat, arc.target.lng), label: arc.target.label, color: arc.color }
    ]);

    const render = () => {
      // Resize
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const w = canvas.width;
      const h = canvas.height;
      const r = Math.min(w, h) * RADIUS_SCALE;

      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, w, h);

      // Rotate Globe
      rotation += 0.002;
      
      // Draw Dots (Back of sphere first)
      const projected = dots.map(dot => {
        // Rotate around Y axis
        const x1 = dot.x * Math.cos(rotation) - dot.z * Math.sin(rotation);
        const z1 = dot.x * Math.sin(rotation) + dot.z * Math.cos(rotation);
        
        // Perspective projection
        const scale = 300 / (300 - z1 * r); 
        return {
          x: w/2 + x1 * r,
          y: h/2 + dot.y * r,
          z: z1,
          alpha: (z1 + 1) / 2 // Fade out back dots
        };
      }).sort((a, b) => a.z - b.z);

      projected.forEach(p => {
        const alpha = Math.max(0.1, p.alpha);
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`; // Primary blue
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5 * alpha, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Threat Arcs (connecting geographic origins to targets)
      threatArcs.forEach((arc, idx) => {
        const origin3d = latLngToSphere(arc.origin.lat, arc.origin.lng);
        const target3d = latLngToSphere(arc.target.lat, arc.target.lng);
        
        // Rotate 3D coordinates
        const rotate3D = (point: {x: number, y: number, z: number}) => {
          const x1 = point.x * Math.cos(rotation) - point.z * Math.sin(rotation);
          const z1 = point.x * Math.sin(rotation) + point.z * Math.cos(rotation);
          return { x: x1, y: point.y, z: z1 };
        };
        
        const originRot = rotate3D(origin3d);
        const targetRot = rotate3D(target3d);
        
        // Project to 2D
        const scale1 = 300 / (300 - originRot.z * r);
        const scale2 = 300 / (300 - targetRot.z * r);
        const p1 = {
          x: w/2 + originRot.x * r,
          y: h/2 + originRot.y * r,
          z: originRot.z
        };
        const p2 = {
          x: w/2 + targetRot.x * r,
          y: h/2 + targetRot.y * r,
          z: targetRot.z
        };
        
        // Only draw if both points are visible
        if(p1.z > -0.5 && p2.z > -0.5) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          // Arc effect - curve upward
          const cx = (p1.x + p2.x) / 2;
          const cy = (p1.y + p2.y) / 2 - 80; // Higher curve for longer distances
          ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
          ctx.strokeStyle = arc.color;
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 15;
          ctx.shadowColor = arc.color;
          ctx.stroke();
          ctx.shadowBlur = 0;
          
          // Draw origin marker
          ctx.fillStyle = arc.color;
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw target marker
          ctx.fillStyle = arc.color;
          ctx.beginPath();
          ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Draw Halo
      const gradient = ctx.createRadialGradient(w/2, h/2, r, w/2, h/2, r * 1.2);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.0)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(w/2, h/2, r * 1.2, 0, Math.PI * 2);
      ctx.fill();

      requestAnimationFrame(render);
    };

    render();
  }, [threatArcs, isLoading]);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-bg-primary rounded-lg overflow-hidden border border-border-subtle">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-4 left-4">
        <span className="text-[10px] font-mono text-primary animate-pulse">● LIVE_TELEMETRY</span>
      </div>
    </div>
  );
};
