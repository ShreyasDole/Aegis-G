'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line
} from 'react-simple-maps';
import { Loader2 } from 'lucide-react';

interface Node { id: string; label: string; type: string; severity?: string; coordinates?: [number, number] }
interface Edge { source: string; target: string; }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Pseudo-random deterministic placement based on string hash
function seededRandom(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  const x = Math.abs(Math.sin(hash++) * 10000);
  return x - Math.floor(x);
}

function assignCoordinates(id: string, isPatientZero: boolean): [number, number] {
  if (isPatientZero) return [37.6173, 55.7558]; // Moscow (example anchor)
  
  // Distribute other nodes globally
  const lng = -180 + (seededRandom(id + "_lng") * 360);
  const lat = -60 + (seededRandom(id + "_lat") * 130); // keep away from extreme poles
  return [lng, lat];
}

interface NetworkGraphProps {
  refreshKey?: number;
  highlightPatientZero?: boolean;
  dataSource?: 'api' | 'campaign' | 'mock';
  campaignRootId?: string | null;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  refreshKey = 0,
  highlightPatientZero = false,
  dataSource = 'api',
  campaignRootId = null,
}) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGraph = async () => {
      setError(null);
      setIsLoading(true);
      try {
        let data;
        if (dataSource === 'campaign' && campaignRootId) {
          const res = await fetch(`${API_URL}/api/network/campaign/${encodeURIComponent(campaignRootId)}`, {
            headers: getAuthHeaders(),
          });
          if (!res.ok) throw new Error('Campaign API failed');
          data = await res.json();
        } else if (dataSource === 'api') {
          const res = await fetch(`${API_URL}/api/network/?limit=200`, { headers: getAuthHeaders() });
          if (!res.ok) throw new Error('Network API failed');
          data = await res.json();
        } else {
          throw new Error('Fallback to mock'); // force mock if needed
        }

        const rawNodes = data.nodes || [];
        const rawEdges = data.edges || [];
        
        let pZeroId = highlightPatientZero && rawNodes.length > 0 ? rawNodes[0].id : null;
        
        const mappedNodes = rawNodes.map((n: any, i: number) => ({
          ...n,
          severity: n.properties?.severity ?? n.severity,
          coordinates: assignCoordinates(n.id, i === 0)
        }));
        setNodes(mappedNodes);
        setEdges(rawEdges);

      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load api');
        // MOCK FALLBACK
        const mockNodes = Array.from({ length: 45 }, (_, i) => ({
          id: `node_${i}`,
          label: i === 0 ? 'SOURCE_ORIGIN' : i < 8 ? `CommandServer_${i}` : `ZombieBot_${i}`,
          type: i === 0 ? 'Threat Actor' : i < 8 ? 'Server' : 'Bot',
          severity: i === 0 ? 'critical' : i < 8 ? 'high' : 'low',
          coordinates: assignCoordinates(`node_${i}`, i === 0)
        }));
        const mockEdges = mockNodes.slice(1).map((n, i) => ({ 
           source: mockNodes[Math.floor(i / 5)].id, 
           target: n.id 
        }));
        setNodes(mockNodes as Node[]);
        setEdges(mockEdges);
      } finally {
        setIsLoading(false);
      }
    };
    loadGraph();
  }, [refreshKey, dataSource, campaignRootId, highlightPatientZero]);

  const mappedEdges = useMemo(() => {
    const coordsMap = new Map(nodes.map(n => [n.id, n.coordinates]));
    return edges.map(e => ({
      sourceCoords: coordsMap.get(e.source),
      targetCoords: coordsMap.get(e.target)
    })).filter(e => e.sourceCoords && e.targetCoords);
  }, [nodes, edges]);

  const patientZeroNode = nodes.length > 0 ? nodes[0] : null;

  return (
    <div className="relative w-full h-[600px] glass-panel bg-black/80 rounded-2xl overflow-hidden border border-white/10 group cursor-crosshair">
      {/* Background Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <Loader2 className="w-8 h-8 text-neon-cyan animate-spin mb-4" />
          <p className="text-neon-cyan font-mono text-xs uppercase tracking-widest">Triangulating Geo-Spatial Feed...</p>
        </div>
      ) : (
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 120, center: [0, 40] }}
          className="w-full h-full opacity-80"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Base World Map */}
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="rgba(255,255,255,0.02)"
                  stroke="rgba(0, 242, 255, 0.2)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "rgba(0, 242, 255, 0.05)", outline: "none", cursor: "crosshair" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Network Edges (Connections) */}
          {mappedEdges.map((edge, i) => (
            <Line
              key={`edge-${i}`}
              from={edge.sourceCoords as [number, number]}
              to={edge.targetCoords as [number, number]}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth={1}
              strokeLinecap="round"
              className="transition-opacity duration-300"
            />
          ))}

          {/* Map Nodes (Plots) */}
          {nodes.map((node) => {
            if (!node.coordinates) return null;
            const isPatientZero = highlightPatientZero && patientZeroNode?.id === node.id;
            const isHovered = hoveredNode === node.id;
            
            // Color based on type or patient zero
            let glowColor = "rgba(0, 242, 255, ";
            let fillColor = "#00f2ff"; // neon-cyan default
            if (isPatientZero) {
              glowColor = "rgba(255, 0, 229, ";
              fillColor = "#ff00e5"; // neon-magenta
            } else if (node.type?.includes("Actor")) {
              glowColor = "rgba(173, 255, 0, ";
              fillColor = "#adff00"; // neon-lime
            }

            return (
              <Marker 
                key={node.id} 
                coordinates={node.coordinates}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Radar Ripple Effect */}
                {(isPatientZero || isHovered) && (
                  <circle r={12} fill={`${glowColor}0.2)`} className="animate-ping origin-center" />
                )}
                
                {/* Core Dot */}
                <circle 
                  r={isPatientZero ? 6 : isHovered ? 5 : 3} 
                  fill={fillColor} 
                  stroke="#050505" 
                  strokeWidth={1}
                  className="transition-all duration-300"
                />

                {/* Label tooltips on hover */}
                {(isPatientZero || isHovered) && (
                  <g className="pointer-events-none">
                    <rect x={10} y={-10} width={node.label.length * 6 + 30} height={20} fill="#050505" stroke={fillColor} strokeWidth={1} rx={2} />
                    <text
                      textAnchor="start"
                      x={15}
                      y={-5}
                      alignmentBaseline="middle"
                      fill="#ffffff"
                      fontSize={8}
                      fontWeight="bold"
                      className="font-mono uppercase tracking-wider"
                    >
                      {node.label}
                    </text>
                  </g>
                )}
              </Marker>
            );
          })}
        </ComposableMap>
      )}

      {/* Top Left Floating Legend */}
      <div className="absolute top-4 left-4 glass-panel bg-black/80 border-white/10 p-3 rounded flex flex-col gap-2 pointer-events-none">
         <div className="text-[9px] uppercase tracking-widest text-white/50 font-bold mb-1">Telemetry Map Overlay</div>
         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-neon-cyan" /> <span className="text-[10px] text-white/80 font-mono">Bots / Systems</span></div>
         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-neon-lime" /> <span className="text-[10px] text-white/80 font-mono">Threat Actors</span></div>
         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-neon-magenta animate-pulse" /> <span className="text-[10px] text-white/80 font-mono">Origin / Patient Zero</span></div>
      </div>

       {error && (
         <div className="absolute top-4 right-4 text-center text-[10px] tracking-widest font-mono text-neon-magenta glass-panel bg-neon-magenta/10 border border-neon-magenta/30 rounded px-3 py-1.5 uppercase pointer-events-none">
           LIVE FEED OFFLINE (SIMULATING DATA)
         </div>
       )}
    </div>
  );
};
