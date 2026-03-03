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
      <Card className="h-full flex flex-col items-center justify-center border border-dashed border-border-medium min-h-[280px]">
        <div className="flex flex-col items-center justify-center text-center px-4 py-8">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <FileSearch className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary mb-1">
            Intelligence Brief
          </h3>
          <p className="text-sm text-text-muted max-w-[220px] leading-relaxed">
            Select a threat from the list and run <span className="text-primary font-medium">AI Analysis</span> to generate a fused intelligence report.
          </p>
        </div>
      </Card>
    );
  }

  // Map risk level to badge variant
  const riskVariant = report.risk_level?.toLowerCase() as 'critical' | 'high' | 'medium' | 'low' | undefined;

  return (
    <Card className="border-l-4 border-l-primary h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Badge variant={riskVariant || 'info'}>{report.risk_level} RISK</Badge>
          <h2 className="text-2xl font-bold mt-2 font-display uppercase tracking-tight">
            {report.threat_title}
          </h2>
          <p className="text-xs text-text-muted font-mono mt-1">
            CONFIDENCE: {(report.confidence * 100).toFixed(0)}%
          </p>
        </div>
        <Cpu className="w-8 h-8 text-primary opacity-50" />
      </div>

      <div className="space-y-6 flex-1">
        <section>
          <h3 className="text-xs font-bold uppercase text-primary tracking-widest mb-2">
            Executive Summary
          </h3>
          <p className="text-sm text-text-primary leading-relaxed bg-bg-primary/50 p-3 rounded border border-border-subtle italic">
            "{report.executive_summary}"
          </p>
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase text-primary tracking-widest mb-2">
            Fused Evidence Base
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {report.evidence?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 bg-bg-tertiary rounded">
                <span className="text-text-secondary font-bold uppercase">{item.source}</span>
                <span className="text-text-primary">{item.finding}</span>
                <span className="text-blue-400">wt: {item.weight?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase text-primary tracking-widest mb-2">
            Immediate Mitigation
          </h3>
          <ul className="space-y-1">
            {report.recommendations?.map((rec: any, idx: number) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
                {rec.action} <span className="text-[10px] opacity-50">[{rec.priority}]</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle space-y-3">
        <Button variant="ai" className="w-full" onClick={() => setShowLogic(true)}>
          <Brain className="w-4 h-4 mr-2" /> Inspect AI Reasoning logic
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" className="text-xs py-1">
            <Search className="w-3 h-3 mr-1" /> Deep Research
          </Button>
          <Button variant="danger" className="text-xs py-1">
            <ShieldAlert className="w-3 h-3 mr-1" /> Armed Policy
          </Button>
        </div>
      </div>

      {/* Logic Drawer / Terminal Overlay */}
      {showLogic && (
        <ReasoningTerminal 
          content={thoughts} 
          onClose={() => setShowLogic(false)} 
        />
      )}
    </Card>
  );
};

