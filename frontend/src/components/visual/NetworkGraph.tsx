'use client';
import React, { useEffect, useState, useRef } from 'react';

interface NetworkGraphProps {
  refreshKey?: number;
  highlightPatientZero?: boolean;
  showCommunities?: boolean;
  dataSource?: string;
}

interface NodeData {
  id: string;
  label: string;
  type: string;
  severity: string;
  cluster: string;
  is_patient_zero: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  colorIdx: number;
}

interface EdgeData {
  source: string;
  target: string;
  relationship: string;
}

const CLUSTER_COLORS = [
  '#5e6ad2', '#10b981', '#f97316', '#ec4899', '#f59e0b', '#06b6d4', '#eab308'
];

export function NetworkGraph({ refreshKey, highlightPatientZero, showCommunities }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);

  const nodesRef = useRef<NodeData[]>([]);
  const edgesRef = useRef<EdgeData[]>([]);
  const animRef = useRef<number>();

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/network/?limit=500`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok || !active) return;
        const data = await res.json();
        
        let rawNodes = data.nodes || [];
        let rawEdges = data.edges || [];
        
        if (rawNodes.length === 0) {
          rawNodes = [
            { id: "1", type: "Actor", label: "ThreatGroupAlpha", cluster: "Cluster A", is_patient_zero: true, severity: "critical" },
            { id: "2", type: "Actor", label: "BotnetCommander", cluster: "Cluster A", severity: "high" },
            { id: "3", type: "IP", label: "192.168.1.55", cluster: "Cluster B", severity: "low" },
            { id: "4", type: "IP", label: "10.0.0.12", cluster: "Cluster C", severity: "medium" },
            { id: "5", type: "System", label: "Web Proxy", cluster: "Cluster B", severity: "high" },
            { id: "6", type: "System", label: "Internal Node", cluster: "Cluster C" },
            { id: "7", type: "System", label: "Email Server", cluster: "Cluster D" },
            { id: "8", type: "Target", label: "User Database", cluster: "Cluster D", severity: "critical" },
          ];
          rawEdges = [
            { source: "1", target: "3", relationship: "CONNECTS_TO" },
            { source: "1", target: "2", relationship: "CONTROLS" },
            { source: "2", target: "4", relationship: "CONNECTS_TO" },
            { source: "3", target: "5", relationship: "EXPLOITS" },
            { source: "4", target: "6", relationship: "SCAN" },
            { source: "5", target: "8", relationship: "ACCESSES" },
            { source: "6", target: "7", relationship: "SPREADS_TO" },
            { source: "7", target: "8", relationship: "BREACHES" },
          ];
        }
        
        setNodeCount(rawNodes.length);
        setEdgeCount(rawEdges.length);

        const clusterMap = Array.from(new Set(rawNodes.map((n: any) => n.cluster || 'Unknown')));
        
        nodesRef.current = rawNodes.map((n: any) => ({
          ...n,
          x: (Math.random() - 0.5) * 400,
          y: (Math.random() - 0.5) * 400,
          vx: 0,
          vy: 0,
          colorIdx: clusterMap.indexOf(n.cluster || 'Unknown') % CLUSTER_COLORS.length
        }));
        edgesRef.current = rawEdges;
      } catch {}
    };
    fetchData();
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let isRunning = true;
    const K_REPULSION = 3000;
    const K_SPRING = 0.05;
    const SPRING_LENGTH = 120;
    const K_GRAVITY = 0.005;
    const DAMPING = 0.85;

    let width = containerRef.current?.clientWidth || 800;
    let height = containerRef.current?.clientHeight || 600;
    canvas.width = width;
    canvas.height = height;

    // Handle resize
    const onResize = () => {
      width = containerRef.current?.clientWidth || 800;
      height = containerRef.current?.clientHeight || 600;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', onResize);

    const draw = () => {
      if (!isRunning) return;
      
      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // PHYSICS TICK
      for (let i = 0; i < nodes.length; i++) {
        let fx = 0, fy = 0;
        const n1 = nodes[i];
        
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const distSq = dx*dx + dy*dy || 1;
          const dist = Math.sqrt(distSq);
          const force = K_REPULSION / distSq;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
        
        fx += -n1.x * K_GRAVITY;
        fy += -n1.y * K_GRAVITY;
        
        n1.vx = (n1.vx + fx) * DAMPING;
        n1.vy = (n1.vy + fy) * DAMPING;
      }
      
      edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return;
        
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dist = Math.sqrt(dx*dx + dy*dy || 1);
        const force = (dist - SPRING_LENGTH) * K_SPRING;
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        sourceNode.vx += fx; sourceNode.vy += fy;
        targetNode.vx -= fx; targetNode.vy -= fy;
      });
      
      nodes.forEach(n => { n.x += n.vx; n.y += n.vy; });

      // RENDER TICK
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);

      // Draw Edges
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return;
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();
      });

      // Draw Nodes
      nodes.forEach(n => {
        // Base color determination
        let baseColor = '#9ca3af'; // default gray
        if (showCommunities) {
          baseColor = CLUSTER_COLORS[n.colorIdx] || '#9ca3af';
        } else if (n.severity === 'critical') {
          baseColor = '#ef4444';
        } else if (n.severity === 'high') {
          baseColor = '#f97316';
        }

        const isPZ = n.is_patient_zero && highlightPatientZero;
        
        if (isPZ) {
          // Patient zero pulsing glow
          const time = Date.now() / 200;
          const radius = 10 + Math.sin(time) * 4;
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(249, 115, 22, 0.4)';
          ctx.fill();
          baseColor = '#f97316';
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, isPZ ? 8 : (n.type === 'Actor' ? 8 : 5), 0, Math.PI * 2);
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#0e0e0e';
        ctx.stroke();

        // Draw Labels
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(n.label, n.x + 10, n.y + 4);
      });

      ctx.restore();
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      isRunning = false;
      window.removeEventListener('resize', onResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [showCommunities, highlightPatientZero]);

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ background: '#0e0e0e', overflow: 'hidden' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10" />
      
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Info overlay */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <p className="text-sm font-medium text-[#9ca3af] mb-1">Aegis Graph Intelligence</p>
        <p className="text-xs text-[#6b7280]">
          {nodeCount} nodes • {edgeCount} edges
        </p>
        {nodeCount > 0 && (
          <p className="text-2xs text-[#4b5563] mt-2 w-48">
            Visualising active entity clusters and relational Botnets using Force-Directed Canvas Simulation.
          </p>
        )}
      </div>

      {nodesRef.current.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <p className="text-[#4b5563] text-sm font-mono animate-pulse">Initializing Network Graph...</p>
        </div>
      )}
    </div>
  );
}
