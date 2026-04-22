'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

interface ThreatCardProps {
  id: number;
  title: string;
  description: string;
  content?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  firstSeen: string;
  affectedSystems: number;
  riskScore: number;
  onAnalyze?: (_id: number, _content: string) => void;
  onExportSTIX?: (_id: number) => void;
  onDismiss?: (_id: number) => void;
}

export const ThreatCard: React.FC<ThreatCardProps> = ({
  id,
  title,
  description,
  content,
  severity,
  source,
  firstSeen,
  affectedSystems,
  riskScore,
  onAnalyze,
  onExportSTIX,
  onDismiss,
}) => {
  const router = useRouter();
  const severityConfig = {
    critical: { class: 'threat-card-critical', label: 'CRITICAL' },
    high: { class: 'threat-card-high', label: 'HIGH' },
    medium: { class: 'threat-card-medium', label: 'MEDIUM' },
    low: { class: 'threat-card-low', label: 'LOW' },
  };

  const config = severityConfig[severity];
  const riskPercentage = (riskScore / 10) * 100;

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl relative overflow-hidden group hover:bg-white/10 transition-all duration-300">
      {/* Underlying glow on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-r ${
        severity === 'critical' ? 'from-neon-magenta to-transparent' :
        severity === 'high' ? 'from-neon-cyan to-transparent' :
        severity === 'medium' ? 'from-neon-lime to-transparent' : 'from-white to-transparent'
      }`} />
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`px-2 py-0.5 border text-[10px] font-space font-bold uppercase tracking-widest rounded ${
           severity === 'critical' ? 'border-neon-magenta text-neon-magenta bg-neon-magenta/10' :
           severity === 'high' ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10' :
           severity === 'medium' ? 'border-neon-lime text-neon-lime bg-neon-lime/10' : 'border-white/50 text-white/50 bg-white/5'
        }`}>
          {config.label}
        </div>
        <div className="flex gap-2">
          <button className="text-[9px] font-space font-bold uppercase tracking-widest px-2 py-1 border border-white/10 hover:border-white/30 text-white/60 hover:text-white rounded transition-colors" onClick={() => router.push(`/forensics/${id}`)}>
            View Details
          </button>
          <button className="text-[9px] font-space font-bold uppercase tracking-widest px-2 py-1 border border-white/10 hover:border-white/30 text-white/60 hover:text-white rounded transition-colors" onClick={() => onExportSTIX?.(id)}>
            Export STIX
          </button>
          <button className="text-[9px] font-space font-bold uppercase tracking-widest px-2 py-1 border border-white/10 hover:border-neon-magenta hover:text-neon-magenta text-white/60 rounded transition-colors" onClick={() => onDismiss?.(id)}>
            Dismiss
          </button>
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-cabinet font-black uppercase tracking-wider mb-2 text-white relative z-10">{title}</h3>
      <p className="text-sm font-satoshi text-white/60 mb-6 relative z-10">{description}</p>

      {/* Details */}
      <div className="space-y-2.5 mb-6 font-space text-[10px] uppercase font-bold tracking-widest border-t border-white/10 pt-4 relative z-10">
        <div className="flex items-center justify-between text-white/50">
          <span className="">Source IP:</span>
          <span className="text-white">{source}</span>
        </div>
        <div className="flex items-center justify-between text-white/50">
          <span className="">First Detected:</span>
          <span className="text-white">{firstSeen}</span>
        </div>
        <div className="flex items-center justify-between text-white/50">
          <span className="">Affected Systems:</span>
          <span className="text-white">{affectedSystems}</span>
        </div>
      </div>

      {/* Risk Score Bar */}
      <div className="mb-6 relative z-10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-space font-bold uppercase tracking-widest text-white/50">Risk Score</span>
          <span className="text-sm font-cabinet font-black text-white">{riskScore.toFixed(1)}/10</span>
        </div>
        <div className="w-full bg-white/5 border border-white/10 rounded overflow-hidden h-1.5 line-clamp-1">
          <div
            className={`h-full transition-all duration-500 shadow-lg ${
              severity === 'critical' ? 'bg-neon-magenta shadow-glow-magenta' :
              severity === 'high' ? 'bg-neon-cyan shadow-glow-cyan' :
              severity === 'medium' ? 'bg-neon-lime shadow-glow-lime' : 'bg-white/60'
            }`}
            style={{ width: `${riskPercentage}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-white/10 relative z-10 w-full font-space">
        <button
          className="text-[10px] font-bold uppercase tracking-widest py-2 px-3 flex-1 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded transition-colors"
          onClick={() => onAnalyze?.(id, content ?? description)}
        >
          AI Analysis
        </button>
        <button className="text-[10px] font-bold uppercase tracking-widest py-2 px-3 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 hover:border-white/20 rounded transition-colors" onClick={() => router.push('/network')}>
          Graph View
        </button>
        <button className="text-[10px] font-bold uppercase tracking-widest py-2 px-3 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 hover:border-white/20 rounded transition-colors" onClick={() => router.push(`/forensics/${id}`)}>
          Forensics
        </button>
      </div>
    </div>
  );
};

