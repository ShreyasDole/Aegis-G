'use client';
import React from 'react';
import { X, Terminal } from 'lucide-react';

interface ReasoningTerminalProps {
  content: string;
  onClose: () => void;
}

export const ReasoningTerminal: React.FC<ReasoningTerminalProps> = ({ content, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-bg-primary/80 backdrop-blur-md flex items-center justify-end p-6">
      <div className="w-full max-w-2xl h-full bg-black border border-primary/30 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-slide-in">
        <div className="bg-bg-secondary p-3 flex justify-between items-center border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Gemini 3: Neural Thinking Trace
            </span>
          </div>
          <button onClick={onClose} className="hover:text-danger transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs leading-relaxed scrollbar-thin">
          <div className="text-emerald-500 mb-4 font-bold tracking-tighter">
            [SYS_LOG]: INITIATING MULTI-AGENT FUSION REASONING...
          </div>
          <p className="text-text-secondary whitespace-pre-wrap">
            {content || "No reasoning trace available. Interaction was direct."}
          </p>
          <div className="text-primary mt-4 font-bold animate-pulse cursor-default">
            _ [TRACE_COMPLETE]
          </div>
        </div>
      </div>
    </div>
  );
};

