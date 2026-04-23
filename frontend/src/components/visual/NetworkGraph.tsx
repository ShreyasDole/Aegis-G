'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  severity?: string;
  platform?: string;
  caption?: string;
  risk_score?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship?: string;
}

type SimNode = GraphNode & { x: number; y: number; vx: number; vy: number };

const EDGE_PALETTE: Record<string, { stroke: string; glow: string }> = {
  REPOSTED: { stroke: 'rgba(249, 115, 22, 0.85)', glow: 'rgba(249, 115, 22, 0.45)' },
  SHARED: { stroke: 'rgba(34, 211, 238, 0.75)', glow: 'rgba(34, 211, 238, 0.35)' },
  INTERACTED_WITH: { stroke: 'rgba(167, 139, 250, 0.8)', glow: 'rgba(167, 139, 250, 0.35)' },
  RELATED: { stroke: 'rgba(59, 130, 246, 0.55)', glow: 'rgba(59, 130, 246, 0.25)' },
};

function edgeStyle(rel?: string) {
  const k = rel && EDGE_PALETTE[rel] ? rel : 'RELATED';
  return EDGE_PALETTE[k] || EDGE_PALETTE.RELATED;
}

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  isLoading: boolean;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ nodes, edges, isLoading }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const hoverRef = useRef<string | null>(null);
  const dimsRef = useRef({ w: 800, h: 600, dpr: 1 });
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const syncSimFromProps = useCallback(() => {
    const prev = simRef.current;
    const w = dimsRef.current.w;
    const h = dimsRef.current.h;
    simRef.current = nodes.map(n => {
      const old = prev.find(o => o.id === n.id);
      return {
        ...n,
        x: old?.x ?? 0.15 * w + Math.random() * 0.7 * w,
        y: old?.y ?? 0.15 * h + Math.random() * 0.7 * h,
        vx: old?.vx ?? 0,
        vy: old?.vy ?? 0,
      };
    });
    edgesRef.current = edges;
  }, [nodes, edges]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      dimsRef.current.w = Math.max(320, rect.width);
      dimsRef.current.h = Math.max(400, rect.height);
      dimsRef.current.dpr = Math.min(window.devicePixelRatio || 1, 2);
      syncSimFromProps();
    });
    ro.observe(canvas.parentElement || canvas);
    return () => ro.disconnect();
  }, [syncSimFromProps]);

  useEffect(() => {
    syncSimFromProps();
  }, [syncSimFromProps]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const t0 = performance.now();
    const repulsion = 900;
    const springLength = 110;
    const friction = 0.88;

    const screenToSim = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * dimsRef.current.w;
      const y = ((clientY - rect.top) / rect.height) * dimsRef.current.h;
      return { x, y };
    };

    const hitTest = (sx: number, sy: number): SimNode | null => {
      let best: SimNode | null = null;
      let bestD = 1e9;
      for (const n of simRef.current) {
        const dx = sx - n.x;
        const dy = sy - n.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const r = n.type === 'PATIENT_ZERO' ? 14 : n.severity === 'critical' ? 10 : n.type === 'COMMUNITY' ? 12 : 8;
        if (d < r + 6 && d < bestD) {
          bestD = d;
          best = n;
        }
      }
      return best;
    };

    const onMove = (e: MouseEvent) => {
      const { x, y } = screenToSim(e.clientX, e.clientY);
      const hit = hitTest(x, y);
      hoverRef.current = hit?.id ?? null;
      canvas.style.cursor = hit ? 'pointer' : 'default';
    };

    const onLeave = () => {
      hoverRef.current = null;
      canvas.style.cursor = 'default';
    };

    const onClick = (e: MouseEvent) => {
      const { x, y } = screenToSim(e.clientX, e.clientY);
      const hit = hitTest(x, y);
      setSelected(hit ? { ...hit } : null);
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('click', onClick);

    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      const sim = simRef.current;
      const E = edgesRef.current;
      const { w, h, dpr } = dimsRef.current;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      for (let i = 0; i < sim.length; i++) {
        const node = sim[i];
        for (let j = i + 1; j < sim.length; j++) {
          const other = sim[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          node.vx += fx;
          node.vy += fy;
          other.vx -= fx;
          other.vy -= fy;
        }
        const cx = w / 2 - node.x;
        const cy = h / 2 - node.y;
        node.vx += cx * 0.012;
        node.vy += cy * 0.012;
      }

      E.forEach(edge => {
        const src = sim.find(n => n.id === edge.source);
        const tgt = sim.find(n => n.id === edge.target);
        if (!src || !tgt) return;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - springLength) * 0.035;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        src.vx += fx;
        src.vy += fy;
        tgt.vx -= fx;
        tgt.vy -= fy;
      });

      const g1 = ctx.createLinearGradient(0, 0, w, h);
      g1.addColorStop(0, '#050814');
      g1.addColorStop(0.45, '#0c1228');
      g1.addColorStop(1, '#08051a');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const pulse = 0.5 + 0.5 * Math.sin(t * 1.2);
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.04 + pulse * 0.04})`;
      ctx.lineWidth = 1;
      const grid = 48;
      const off = (t * 18) % grid;
      for (let x = -off; x < w + grid; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = -off; y < h + grid; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const rg = ctx.createRadialGradient(w * 0.2, h * 0.15, 0, w * 0.35, h * 0.25, w * 0.55);
      rg.addColorStop(0, `rgba(99, 102, 241, ${0.08 + pulse * 0.04})`);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);

      const dashPhase = (t * 42) % 24;
      E.forEach(edge => {
        const src = sim.find(n => n.id === edge.source);
        const tgt = sim.find(n => n.id === edge.target);
        if (!src || !tgt) return;
        const { stroke, glow } = edgeStyle(edge.relationship);
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = glow;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = hoverRef.current === src.id || hoverRef.current === tgt.id ? 2.2 : 1.4;
        ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -dashPhase;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        ctx.restore();
      });

      sim.forEach(node => {
        node.vx *= friction;
        node.vy *= friction;
        node.x = Math.max(24, Math.min(w - 24, node.x + node.vx));
        node.y = Math.max(24, Math.min(h - 24, node.y + node.vy));
      });

      sim.forEach(node => {
        const isPZ = node.type === 'PATIENT_ZERO';
        const isCrit = node.severity === 'critical';
        const isComm = node.type === 'COMMUNITY';
        const hovered = hoverRef.current === node.id;
        const baseR = isPZ ? 11 : isComm ? 13 : isCrit ? 8 : 7;
        const r = hovered ? baseR + 4 : baseR;
        const pulseR = isPZ ? 22 + Math.sin(t * 3.2) * 6 : 0;

        if (isPZ && pulseR > 0) {
          const grd = ctx.createRadialGradient(node.x, node.y, r * 0.5, node.x, node.y, pulseR);
          grd.addColorStop(0, `rgba(239, 68, 68, ${0.35 + pulse * 0.2})`);
          grd.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
          ctx.fill();
        }

        const fillG = ctx.createRadialGradient(
          node.x - r * 0.4,
          node.y - r * 0.4,
          0,
          node.x,
          node.y,
          r * 1.4
        );
        if (isPZ) {
          fillG.addColorStop(0, '#fecaca');
          fillG.addColorStop(1, '#b91c1c');
        } else if (isComm) {
          fillG.addColorStop(0, '#e9d5ff');
          fillG.addColorStop(1, '#6b21a8');
        } else if (isCrit) {
          fillG.addColorStop(0, '#fde68a');
          fillG.addColorStop(1, '#c2410c');
        } else {
          fillG.addColorStop(0, '#bfdbfe');
          fillG.addColorStop(1, '#1d4ed8');
        }

        ctx.shadowBlur = hovered ? 20 : isPZ ? 24 : 10;
        ctx.shadowColor = isPZ ? '#ef4444' : isComm ? '#a855f7' : '#3b82f6';
        ctx.fillStyle = fillG;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        const short =
          node.label.length > 36 ? `${node.label.slice(0, 34)}…` : node.label;
        const tx = node.x + r + 6;
        const ty = node.y + 4;
        const padX = 6;
        const padY = 3;
        ctx.font = isPZ ? '600 11px ui-sans-serif, system-ui' : '500 10px ui-sans-serif, system-ui';
        const tw = ctx.measureText(short).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
        const bx = tx - padX;
        const by = ty - 11 - padY;
        const bw = tw + padX * 2;
        const bh = 16 + padY * 2;
        const rad = 4;
        ctx.beginPath();
        ctx.moveTo(bx + rad, by);
        ctx.lineTo(bx + bw - rad, by);
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + rad);
        ctx.lineTo(bx + bw, by + bh - rad);
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - rad, by + bh);
        ctx.lineTo(bx + rad, by + bh);
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - rad);
        ctx.lineTo(bx, by + rad);
        ctx.quadraticCurveTo(bx, by, bx + rad, by);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = hovered ? '#f8fafc' : '#cbd5e1';
        ctx.fillText(short, tx, ty);
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('click', onClick);
    };
  }, [nodes, edges]);

  return (
    <div className="relative w-full min-h-[70vh] h-[72vh] max-h-[900px] rounded-xl overflow-hidden border border-border-subtle shadow-[0_0_40px_rgba(59,130,246,0.08)] bg-[#050814]">
      <canvas ref={canvasRef} className="block w-full h-full touch-none" />

      <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-400/90">
        <span className="rounded border border-cyan-500/30 bg-cyan-950/40 px-2 py-1 text-cyan-200/90">
          REPOSTED
        </span>
        <span className="rounded border border-orange-500/30 bg-orange-950/40 px-2 py-1 text-orange-200/90">
          SHARED
        </span>
        <span className="rounded border border-violet-500/30 bg-violet-950/40 px-2 py-1 text-violet-200/90">
          INTERACTED
        </span>
      </div>

      {selected && (
        <div className="pointer-events-auto absolute bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/92 backdrop-blur-md p-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Selected node</p>
              <p className="text-sm font-semibold text-slate-100">{selected.label}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                {selected.platform && (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">{selected.platform}</span>
                )}
                {selected.severity && (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-amber-200/90">{selected.severity}</span>
                )}
                {selected.risk_score != null && (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                    risk {selected.risk_score.toFixed(2)}
                  </span>
                )}
              </div>
              {selected.caption && (
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{selected.caption}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="pointer-events-auto rounded border border-slate-600 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050814]/85 text-primary font-mono text-xs tracking-widest uppercase">
          Syncing topology…
        </div>
      )}
      {!isLoading && nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted font-mono text-sm">
          No graph data. Seed demo or ingest content.
        </div>
      )}
    </div>
  );
};
