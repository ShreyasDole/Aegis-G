'use client';
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ReasoningTerminal } from './ReasoningTerminal';
import { Search, ShieldAlert, Cpu, Brain, FileSearch } from 'lucide-react';

interface IntelligenceBriefProps {
  report: any;
  thoughts: string;
}

export const IntelligenceBrief: React.FC<IntelligenceBriefProps> = ({ report, thoughts }) => {
  const [showLogic, setShowLogic] = useState(false);

  if (!report) {
    return (
      <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/20 bg-white/5 backdrop-blur-md min-h-[280px] rounded-xl relative group">
        <div className="absolute inset-0 bg-gradient-to-tr from-neon-magenta/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="flex flex-col items-center justify-center text-center px-4 py-8 relative z-10">
          <div className="w-14 h-14 rounded border border-white/10 flex items-center justify-center mb-4 bg-black-true">
            <FileSearch className="w-7 h-7 text-neon-magenta" strokeWidth={1.5} />
          </div>
          <h3 className="font-cabinet font-black text-xl uppercase tracking-widest text-white mb-2">
            Intelligence Brief
          </h3>
          <p className="font-space text-[10px] uppercase font-bold text-white/50 max-w-[220px] leading-relaxed tracking-widest">
            Select a threat from the list and run <span className="text-neon-cyan relative z-10">AI Analysis</span> to generate a fused intelligence report.
          </p>
        </div>
      </div>
    );
  }

  // Map risk level to badge variant
  const riskVariant = report.risk_level?.toLowerCase() as 'critical' | 'high' | 'medium' | 'low' | undefined;

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 h-full flex flex-col rounded-xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan shadow-glow-cyan" />
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <div className="px-2 py-0.5 border text-[10px] font-space font-bold uppercase tracking-widest rounded border-neon-cyan text-neon-cyan bg-neon-cyan/5 mb-3 inline-block">
            {report.risk_level} RISK
          </div>
          <h2 className="text-3xl font-black mt-2 font-cabinet uppercase tracking-tighter text-white">
            {report.threat_title}
          </h2>
          <p className="text-[10px] text-white/60 font-space font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-lime" />
            CONFIDENCE: {(report.confidence * 100).toFixed(0)}%
          </p>
        </div>
        <Cpu className="w-8 h-8 text-neon-cyan opacity-40 mix-blend-screen" />
      </div>

      <div className="space-y-8 flex-1 relative z-10">
        <section>
          <h3 className="text-[10px] font-bold uppercase font-space text-neon-cyan tracking-widest mb-3 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-neon-cyan"></span> Executive Summary
          </h3>
          <p className="text-sm text-white/80 leading-relaxed font-satoshi bg-white/5 p-4 rounded border border-white/10 italic">
            "{report.executive_summary}"
          </p>
        </section>

        <section>
          <h3 className="text-[10px] font-bold uppercase font-space text-neon-magenta tracking-widest mb-3 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-neon-magenta"></span> Fused Evidence Base
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {report.evidence?.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-col gap-1 text-[11px] p-3 bg-black-true/60 border border-white/5 rounded">
                <div className="flex justify-between w-full">
                  <span className="text-white/60 font-space font-bold uppercase">{item.source}</span>
                  <span className="text-neon-lime font-space">wt: {item.weight?.toFixed(2)}</span>
                </div>
                <span className="text-white/90 font-satoshi">{item.finding}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold uppercase font-space text-neon-lime tracking-widest mb-3 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-neon-lime"></span> Immediate Mitigation
          </h3>
          <ul className="space-y-3">
            {report.recommendations?.map((rec: any, idx: number) => (
              <li key={idx} className="flex items-start gap-3 text-xs text-white/70 font-satoshi">
                <span className="w-2 h-2 mt-1 shrink-0 rounded-full bg-neon-magenta shadow-glow-magenta" />
                <span className="flex-1">{rec.action}</span>
                <span className="text-[9px] font-space text-neon-magenta uppercase px-1.5 py-0.5 bg-neon-magenta/10 rounded">[{rec.priority}]</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 space-y-3 relative z-10 w-full">
        <button className="w-full text-xs font-space font-bold uppercase tracking-widest py-3 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded transition-colors flex items-center justify-center gap-2" onClick={() => setShowLogic(true)}>
          <Brain className="w-4 h-4" /> Inspect AI Reasoning logic
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button className="w-full text-[10px] font-space font-bold uppercase tracking-widest py-2 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded transition-colors flex items-center justify-center gap-2">
            <Search className="w-3 h-3" /> Deep Research
          </button>
          <button className="w-full text-[10px] font-space font-bold uppercase tracking-widest py-2 bg-neon-magenta/10 hover:bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30 hover:shadow-glow-magenta rounded transition-colors flex items-center justify-center gap-2">
            <ShieldAlert className="w-3 h-3" /> Armed Policy
          </button>
        </div>
      </div>

      {/* Logic Drawer / Terminal Overlay */}
      {showLogic && (
        <div className="absolute inset-0 z-50">
          <ReasoningTerminal 
            content={thoughts} 
            onClose={() => setShowLogic(false)} 
          />
        </div>
      )}
    </div>
  );
};

