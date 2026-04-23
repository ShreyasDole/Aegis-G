'use client';
import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';

interface AIAgentControlCardProps {
  className?: string;
}

export function AIAgentControlCard({ className = '' }: AIAgentControlCardProps) {
  const [confidence, setConfidence] = useState(0.75);
  const [scanDepth, setScanDepth] = useState(3);
  const [attribution, setAttribution] = useState(0.65);
  const [isActive, setIsActive] = useState(true);

  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai-agent-config');
    if (saved) {
      try {
        const cfg = JSON.parse(saved);
        if (cfg.confidence !== undefined) setConfidence(cfg.confidence);
        if (cfg.scanDepth !== undefined) setScanDepth(cfg.scanDepth);
        if (cfg.attribution !== undefined) setAttribution(cfg.attribution);
      } catch {}
    }
  }, []);

  const save = (key: string, value: number) => {
    const saved = localStorage.getItem('ai-agent-config') || '{}';
    try {
      const cfg = JSON.parse(saved);
      cfg[key] = value;
      localStorage.setItem('ai-agent-config', JSON.stringify(cfg));
    } catch {}
  };

  return (
    <div
      className={`rounded-lg border border-[rgba(255,255,255,0.1)] overflow-hidden ${className}`}
      style={{ background: 'var(--bg-elevated)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2.5">
          <Bot className="w-4 h-4 text-[#5e6ad2]" />
          <span className="text-xs font-medium text-[#f3f4f6]">AI Agent Controls</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#10b981] animate-pulse-dot' : 'bg-[#6b7280]'}`}
          />
          <span className="mono-10 text-[#6b7280]">{isActive ? 'ACTIVE' : 'IDLE'}</span>
        </div>
      </div>

      {/* Slider rows */}
      <div className="p-4 space-y-4">
        {/* Confidence Threshold */}
        <div className="grid items-center gap-3" style={{ gridTemplateColumns: '100px 1fr 36px' }}>
          <span className="text-2xs text-[#6b7280] font-medium">CONFIDENCE</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={confidence}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setConfidence(v);
              save('confidence', v);
            }}
            className="ai-range"
          />
          <span className="mono-10 text-[#9ca3af] text-right">{confidence.toFixed(2)}</span>
        </div>

        {/* Scan Depth */}
        <div className="grid items-center gap-3" style={{ gridTemplateColumns: '100px 1fr 36px' }}>
          <span className="text-2xs text-[#6b7280] font-medium">SCAN DEPTH</span>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={scanDepth}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              setScanDepth(v);
              save('scanDepth', v);
            }}
            className="ai-range"
          />
          <span className="mono-10 text-[#9ca3af] text-right">{scanDepth}/5</span>
        </div>

        {/* Attribution Sensitivity */}
        <div className="grid items-center gap-3" style={{ gridTemplateColumns: '100px 1fr 36px' }}>
          <span className="text-2xs text-[#6b7280] font-medium">ATTRIBUTION</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={attribution}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setAttribution(v);
              save('attribution', v);
            }}
            className="ai-range"
          />
          <span className="mono-10 text-[#9ca3af] text-right">{attribution.toFixed(2)}</span>
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between pt-1 border-t border-[rgba(255,255,255,0.05)]">
          <span className="mono-10 text-[#4b5563]">MODELS: GEMINI-2.5 + LOCAL</span>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`mono-10 px-2 py-0.5 rounded border transition-colors ${
              isActive
                ? 'border-[rgba(16,185,129,0.3)] text-[#10b981] hover:bg-[rgba(16,185,129,0.1)]'
                : 'border-[rgba(255,255,255,0.1)] text-[#6b7280] hover:bg-[rgba(255,255,255,0.05)]'
            }`}
          >
            {isActive ? 'DEACTIVATE' : 'ACTIVATE'}
          </button>
        </div>
      </div>
    </div>
  );
}
