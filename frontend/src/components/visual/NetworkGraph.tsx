'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../ui/Card';

interface Node { id: string; label: string; type: string; severity?: string; x?: number; y?: number; vx?: number; vy?: number; }
interface Edge { source: string; target: string; }

interface NetworkGraphProps {
  refreshKey?: number;
  highlightPatientZero?: boolean;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ refreshKey = 0, highlightPatientZero = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Fetch real data from backend (refetch when refreshKey changes)
  useEffect(() => {
    const loadGraph = async () => {
      try {
        // In production: fetch from /api/network/
        // MOCK DATA for Visual Verification:
        const mockNodes = Array.from({length: 20}, (_, i) => ({
            id: `node_${i}`, 
            label: i === 0 ? "PATIENT_ZERO" : `Bot_${i}`, 
            type: i === 0 ? "Actor" : "Bot",
            severity: i === 0 ? "critical" : "medium",
            x: Math.random() * 800, y: Math.random() * 600, vx: 0, vy: 0
        }));
        const mockEdges = mockNodes.slice(1).map(n => ({ source: "node_0", target: n.id }));
        
        setNodes(mockNodes);
        setEdges(mockEdges);
        setIsLoading(false);
      } catch (e) { console.error(e); }
    };
    loadGraph();
  }, [refreshKey]);

  // Physics Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simulation Params
    const repulsion = 1000;
    const springLength = 100;
    const friction = 0.9;
    
    const animate = () => {
      // 1. Calculate Forces
      nodes.forEach(node => {
        // Repulsion
        nodes.forEach(other => {
            if (node === other) return;
            const dx = (node.x || 0) - (other.x || 0);
            const dy = (node.y || 0) - (other.y || 0);
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            const force = repulsion / (dist * dist);
            node.vx = (node.vx || 0) + (dx / dist) * force;
            node.vy = (node.vy || 0) + (dy / dist) * force;
        });
        
        // Center Gravity
        const dx = canvas.width/2 - (node.x || 0);
        const dy = canvas.height/2 - (node.y || 0);
        node.vx = (node.vx || 0) + dx * 0.005;
        node.vy = (node.vy || 0) + dy * 0.005;
      });

      // Spring Force
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (source && target) {
            const dx = (target.x || 0) - (source.x || 0);
            const dy = (target.y || 0) - (source.y || 0);
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            const force = (dist - springLength) * 0.05;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            source.vx = (source.vx || 0) + fx;
            source.vy = (source.vy || 0) + fy;
            target.vx = (target.vx || 0) - fx;
            target.vy = (target.vy || 0) - fy;
        }
      });

      // 2. Update Positions
      nodes.forEach(node => {
          node.vx = (node.vx || 0) * friction;
          node.vy = (node.vy || 0) * friction;
          node.x = (node.x || 0) + node.vx;
          node.y = (node.y || 0) + node.vy;
      });

      // 3. Draw
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Edges
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 1;
      edges.forEach(edge => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);
          if (source && target) {
              ctx.beginPath();
              ctx.moveTo(source.x || 0, source.y || 0);
              ctx.lineTo(target.x || 0, target.y || 0);
              ctx.stroke();
          }
      });

      // Draw nodes
      const nodeColors: Record<string, string> = { Actor: '#8b5cf6', Bot: '#3b82f6' };
      const severityColors: Record<string, string> = { critical: '#ef4444', medium: '#eab308', low: '#64748b' };
      const hoveredNode: string | null = null;
      const patientZeroId = highlightPatientZero && nodes.length > 0 ? nodes[0].id : null;
      nodes.forEach(node => {
        if (!node.x || !node.y) return;

        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode?.id === node.id;
        const isPatientZero = patientZeroId === node.id;
        const nodeSize = isHovered || isSelected ? 12 : isPatientZero ? 14 : 10;

        // Node glow (including patient zero)
        if (isHovered || isSelected || isPatientZero) {
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nodeSize * 3);
          gradient.addColorStop(0, (isPatientZero ? '#f59e0b' : nodeColors[node.type]) + '60');
          gradient.addColorStop(1, (isPatientZero ? '#f59e0b' : nodeColors[node.type]) + '00');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, (isPatientZero ? 20 : nodeSize * 3), 0, Math.PI * 2);
          ctx.fill();
        }

        // Node circle
        ctx.fillStyle = isPatientZero ? '#f59e0b' : nodeColors[node.type];
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
        ctx.fill();

        // Node border (severity)
        if (node.severity) {
          ctx.strokeStyle = severityColors[node.severity];
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Node label
        ctx.fillStyle = '#f1f5f9';
        ctx.font = isHovered || isSelected ? 'bold 12px Inter' : '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + nodeSize + 15);
      });

      requestAnimationFrame(animate);
    };
    
    animate();
  }, [nodes, edges]);

  return (
    <div className="relative w-full h-[500px] bg-bg-primary rounded-lg overflow-hidden border border-border-subtle">
       <canvas ref={canvasRef} className="w-full h-full" />
       {isLoading && <div className="absolute inset-0 flex items-center justify-center text-primary">Initializing Physics Engine...</div>}
    </div>
  );
};
