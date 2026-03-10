'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../ui/Card';

interface Node {
  id: string;
  label: string;
  type: 'threat' | 'ip' | 'actor' | 'system';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  x?: number;
  y?: number;
}

interface Edge {
  source: string;
  target: string;
  strength: number;
}

interface NetworkGraphProps {
  refreshKey?: number;
  highlightPatientZero?: boolean;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ refreshKey = 0, highlightPatientZero = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from backend (refetch when refreshKey changes)
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const response = await fetch(`${API_URL}/api/network/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const rawNodes = data.nodes || [];
          const rawEdges = data.edges || [];
          setNodes(
            rawNodes.map((n: Record<string, unknown>) => ({
              id: String(n.id),
              label: String(n.label || n.id),
              type: (['threat', 'ip', 'actor', 'system'].includes(String(n.type)) ? n.type : 'threat') as Node['type'],
              severity: (n.severity as Node['severity']) || 'medium',
            }))
          );
          setEdges(
            rawEdges.map((e: Record<string, unknown>) => ({
              source: String(e.source),
              target: String(e.target),
              strength: typeof e.strength === 'number' ? e.strength : 0.7,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load graph data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraph();
  }, [refreshKey]);

  useEffect(() => {
    if (nodes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Initialize node positions (simple circular layout)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;

    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
    });

    // Node colors
    const nodeColors = {
      actor: '#ef4444',
      ip: '#f59e0b',
      system: '#3b82f6',
      threat: '#8b5cf6',
    };

    const severityColors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#eab308',
      low: '#10b981',
    };

    // Drawing function
    const draw = () => {
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw edges
      edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${edge.strength * 0.5})`;
          ctx.lineWidth = edge.strength * 3;
          ctx.stroke();
        }
      });

      // Draw nodes
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
    };

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let foundNode = false;
      for (const node of nodes) {
        if (!node.x || !node.y) continue;
        const distance = Math.sqrt(
          Math.pow(mouseX - node.x, 2) + Math.pow(mouseY - node.y, 2)
        );
        if (distance < 15) {
          setHoveredNode(node.id);
          canvas.style.cursor = 'pointer';
          foundNode = true;
          break;
        }
      }
      if (!foundNode) {
        setHoveredNode(null);
        canvas.style.cursor = 'default';
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      for (const node of nodes) {
        if (!node.x || !node.y) continue;
        const distance = Math.sqrt(
          Math.pow(mouseX - node.x, 2) + Math.pow(mouseY - node.y, 2)
        );
        if (distance < 15) {
          setSelectedNode(node);
          return;
        }
      }
      setSelectedNode(null);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    // Animation loop
    let animationFrame: number;
    const animate = () => {
      draw();
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrame);
    };
  }, [hoveredNode, selectedNode, nodes, edges]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary/80 z-10">
          <span className="text-text-secondary text-sm">Loading graph...</span>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* Legend */}
      <Card className="absolute bottom-4 left-4 p-3">
        <div className="text-xs font-semibold text-text-secondary mb-2">Node Types</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-danger rounded-full"></span>
            <span className="text-text-secondary">Threat Actor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-warning rounded-full"></span>
            <span className="text-text-secondary">IP Address</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-primary rounded-full"></span>
            <span className="text-text-secondary">System</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-secondary rounded-full"></span>
            <span className="text-text-secondary">Unknown Threat</span>
          </div>
        </div>
      </Card>

      {/* Node Detail Panel */}
      {selectedNode && (
        <Card className="absolute top-4 right-4 w-64 p-4 animate-slide-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Node Details</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-text-muted">Label:</span>
              <span className="text-text-primary ml-2 font-semibold">
                {selectedNode.label}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Type:</span>
              <span className="text-text-primary ml-2 capitalize">
                {selectedNode.type}
              </span>
            </div>
            {selectedNode.severity && (
              <div>
                <span className="text-text-muted">Severity:</span>
                <span className={`ml-2 capitalize font-semibold ${
                  selectedNode.severity === 'critical' ? 'text-danger' :
                  selectedNode.severity === 'high' ? 'text-warning' :
                  selectedNode.severity === 'medium' ? 'text-yellow-500' :
                  'text-success'
                }`}>
                  {selectedNode.severity}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <button className="btn-primary w-full text-xs py-1.5">
              View Details
            </button>
            <button className="btn-secondary w-full text-xs py-1.5">
              Investigate
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};

