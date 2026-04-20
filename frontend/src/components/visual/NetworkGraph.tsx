'use client';
import React, { useEffect, useRef } from 'react';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  severity?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  isLoading: boolean;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ nodes, edges, isLoading }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Seed positions once
    nodes.forEach(n => {
      if (n.x === undefined) n.x = Math.random() * (canvas.offsetWidth || 800);
      if (n.y === undefined) n.y = Math.random() * (canvas.offsetHeight || 600);
      if (n.vx === undefined) n.vx = 0;
      if (n.vy === undefined) n.vy = 0;
    });

    let animId: number;
    const repulsion = 1200;
    const springLength = 120;
    const friction = 0.85;

    const animate = () => {
      // Repulsion
      nodes.forEach(node => {
        nodes.forEach(other => {
          if (node === other) return;
          const dx = (node.x ?? 0) - (other.x ?? 0);
          const dy = (node.y ?? 0) - (other.y ?? 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          node.vx = (node.vx ?? 0) + (dx / dist) * force;
          node.vy = (node.vy ?? 0) + (dy / dist) * force;
        });

        // Center gravity
        const cx = canvas.width / 2 - (node.x ?? 0);
        const cy = canvas.height / 2 - (node.y ?? 0);
        node.vx = (node.vx ?? 0) + cx * 0.01;
        node.vy = (node.vy ?? 0) + cy * 0.01;
      });

      // Spring attraction along edges
      edges.forEach(edge => {
        const src = nodes.find(n => n.id === edge.source);
        const tgt = nodes.find(n => n.id === edge.target);
        if (!src || !tgt) return;
        const dx = (tgt.x ?? 0) - (src.x ?? 0);
        const dy = (tgt.y ?? 0) - (src.y ?? 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - springLength) * 0.03;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        src.vx = (src.vx ?? 0) + fx;
        src.vy = (src.vy ?? 0) + fy;
        tgt.vx = (tgt.vx ?? 0) - fx;
        tgt.vy = (tgt.vy ?? 0) - fy;
      });

      // Resize canvas to fill container
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // Background
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw edges
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 1.5;
      edges.forEach(edge => {
        const src = nodes.find(n => n.id === edge.source);
        const tgt = nodes.find(n => n.id === edge.target);
        if (!src || !tgt) return;
        ctx.beginPath();
        ctx.moveTo(src.x ?? 0, src.y ?? 0);
        ctx.lineTo(tgt.x ?? 0, tgt.y ?? 0);
        ctx.stroke();
      });

      // Update positions and draw nodes
      nodes.forEach(node => {
        node.vx = (node.vx ?? 0) * friction;
        node.vy = (node.vy ?? 0) * friction;
        node.x = (node.x ?? 0) + node.vx;
        node.y = (node.y ?? 0) + node.vy;

        const isPatientZero = node.type === 'PATIENT_ZERO';
        const isCritical = node.severity === 'critical';
        const radius = isPatientZero ? 9 : isCritical ? 6 : 5;

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        if (isPatientZero) {
          ctx.shadowBlur = 18;
          ctx.shadowColor = '#ef4444';
          ctx.fillStyle = '#ef4444';
        } else if (isCritical) {
          ctx.fillStyle = '#f59e0b';
        } else if (node.type === 'COMMUNITY') {
          ctx.fillStyle = '#a855f7';
        } else {
          ctx.fillStyle = '#3b82f6';
        }

        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#94a3b8';
        ctx.font = isPatientZero ? 'bold 11px monospace' : '10px monospace';
        ctx.fillText(node.label, (node.x ?? 0) + radius + 3, (node.y ?? 0) + 4);
      });

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, [nodes, edges]);

  return (
    <div className="relative w-full h-[600px] bg-bg-primary rounded-lg overflow-hidden border border-border-subtle shadow-inner">
      <canvas ref={canvasRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/80 text-primary font-mono text-sm tracking-widest uppercase">
          Initializing Graph Topology...
        </div>
      )}
      {!isLoading && nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted font-mono text-sm">
          No graph data. Ingest content to populate network.
        </div>
      )}
    </div>
  );
};
