'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function ScansPage() {
  const [manualText, setManualText] = useState('');
  const [liveScans, setLiveScans] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [glowEffect, setGlowEffect] = useState(false);

  // Trigger subtle pulse glow on mount
  useEffect(() => {
    setGlowEffect(true);
    const timeout = setTimeout(() => setGlowEffect(false), 2000);
    return () => clearTimeout(timeout);
  }, []);

  const handleManualScan = async () => {
    if (!manualText.trim()) return;
    const mode = typeof window !== 'undefined' ? (localStorage.getItem('inference-mode') || 'local') : 'local';
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    setIsScanning(true);
    try {
      // Phase 1: Call the new core scan endpoint
      const response = await fetch(`${API_URL}/api/scan/core`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Inference-Mode': mode,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: manualText }),
      });
      
      if (!response.ok) throw new Error('Scan failed');
      const result = await response.json();
      
      setLiveScans(prev => [{
        id: result.content_hash?.slice(0, 9) || Math.random().toString(36).substring(2, 9),
        originalContent: manualText,
        denoisedContent: result.denoised_text || manualText,
        risk: result.risk_score ?? 0,
        source: 'Manual Triage',
        timestamp: new Date().toLocaleTimeString(),
        type: result.is_ai_generated ? 'AI_GENERATED' : 'HUMAN',
        attribution: result.attribution || {},
        recommendation: result.recommendation || 'Unknown',
        explainability: result.explainability || [],
        ragMemory: result.rag_memory || []
      }, ...prev].slice(0, 10));
      
      // Clear input after success
      setManualText('');
    } catch (error) {
      console.error('Scan error:', error);
      alert('Forensic scan failed. Ensure the backend is running.');
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.7) return 'text-danger';
    if (score >= 0.4) return 'text-warning';
    return 'text-success';
  };

  const getRiskGradient = (score: number) => {
    if (score >= 0.7) return 'from-danger/20 to-danger/5 border-danger/30';
    if (score >= 0.4) return 'from-warning/20 to-warning/5 border-warning/30';
    return 'from-success/20 to-success/5 border-success/30';
  };

  return (
    <div className="p-4 md:p-8 min-h-screen w-full relative overflow-hidden bg-bg-primary text-text-primary">
      {/* Background ambient light */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black font-display tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary via-info to-secondary animate-pulse-slow">
              Core Scanning Engine
            </h1>
            <p className="text-text-secondary text-sm mt-1 uppercase tracking-widest font-mono">
              Phase 1 / Adversarial Denoising &amp; Attribution
            </p>
          </div>
          <span className={`border-primary text-primary ${glowEffect ? 'shadow-glow-blue' : ''} transition-all duration-1000`}>
            <Badge variant="secondary">
              SYSTEM ONLINE
            </Badge>
          </span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: MANUAL TRIAGE */}
          <div className="lg:col-span-5 transform transition-all hover:-translate-y-1">
            <div className="relative h-full">
              {/* Glassmorphic border glow wrapper */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-xl blur opacity-30"></div>
              
              <div className="relative h-full bg-bg-secondary/80 backdrop-blur-md rounded-xl border border-border-medium shadow-card flex flex-col p-6">
                <div className="flex items-center mb-6 gap-3">
                  <div className="w-2 h-2 rounded-full bg-info animate-pulse"></div>
                  <h2 className="text-xs font-bold text-text-primary tracking-[0.2em] uppercase">Manual Triage</h2>
                </div>
                
                <div className="relative flex-1 flex flex-col group">
                  <div className="absolute inset-0 bg-primary/5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none blur-sm" />
                  <textarea
                    className="flex-1 min-h-[250px] w-full bg-bg-primary/50 backdrop-blur border border-border-subtle p-5 rounded font-mono text-sm leading-relaxed text-text-primary focus:border-primary/70 focus:ring-1 focus:ring-primary/50 outline-none resize-none transition-all placeholder:text-text-disabled shadow-inner"
                    placeholder="[Await Input] Enter suspicious text or adversarial payload here for forensic analysis..."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                  />
                  
                  {/* Decorative corner accents */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary/40 -translate-x-1 -translate-y-1 pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary/40 translate-x-1 translate-y-1 pointer-events-none" />
                </div>

                <button 
                  className={`mt-6 w-full py-4 rounded-lg font-bold uppercase tracking-wider text-sm transition-all duration-300 ease-out overflow-hidden relative ${
                    !manualText.trim() || isScanning 
                      ? 'bg-bg-tertiary text-text-disabled cursor-not-allowed' 
                      : 'bg-gradient-to-r from-primary to-secondary text-white shadow-glow-blue hover:shadow-glow-purple hover:scale-[1.02]'
                  }`}
                  onClick={handleManualScan} 
                  disabled={isScanning || !manualText.trim()}
                >
                  <span className="relative z-10">{isScanning ? 'Executing Initial Scan...' : 'Execute Forensic Scan'}</span>
                  {/* Sweep animation on hover */}
                  {!isScanning && manualText.trim() && (
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[sweep_1.5s_ease-in-out_infinite]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: RESULTS */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="flex justify-between items-end border-b border-border-subtle pb-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <h2 className="text-xs font-bold text-text-primary tracking-[0.2em] uppercase">Scan Results</h2>
              </div>
              <span className="text-xs font-mono text-text-muted">Total Processed: {liveScans.length}</span>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto pr-2 scrollbar-thin max-h-[700px]">
              {liveScans.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 border border-dashed border-border-medium rounded-xl bg-bg-secondary/20">
                  <div className="w-16 h-16 mb-4 rounded-full border-4 border-bg-tertiary border-t-border-medium animate-spin-slow" />
                  <p className="text-text-muted font-mono text-sm uppercase tracking-widest">Awaiting telemetry...</p>
                </div>
              ) : (
                liveScans.map((scan, idx) => (
                  <div 
                    key={scan.id + idx} 
                    className={`animate-slide-up relative bg-gradient-to-br ${getRiskGradient(scan.risk)} bg-opacity-10 backdrop-blur-sm border rounded-xl p-6 transition-all shadow-card hover:shadow-modal group`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="bg-bg-primary px-3 py-1 rounded text-xs font-mono text-primary font-bold shadow-inner">
                            ID: {scan.id}
                          </span>
                          <span className="text-xs font-mono text-text-muted">{scan.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`uppercase ${scan.type === 'AI_GENERATED' ? 'border-warning text-warning' : 'border-success text-success'}`}>
                             <Badge variant="secondary">
                              {scan.type}
                            </Badge>
                          </span>
                          <span className="text-xs uppercase tracking-widest text-text-secondary font-bold">
                            Action: <span className="text-text-primary">{scan.recommendation}</span>
                          </span>
                        </div>
                      </div>

                      {/* Risk Gauge */}
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Risk Score</span>
                        <div className={`text-3xl font-black font-display tracking-tighter ${getRiskColor(scan.risk)}`}>
                          {(scan.risk * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {/* Denoised Text Area / Token Explainer */}
                      <div className="bg-bg-primary/60 border border-border-subtle rounded-lg p-4 shadow-inner flex flex-col">
                        <div className="text-[10px] text-primary uppercase font-bold tracking-widest mb-2 flex justify-between">
                          <span>Token Attribution (SHAP)</span>
                          <span className="opacity-50">Score Overlay</span>
                        </div>
                        <div className="text-sm font-mono text-text-secondary whitespace-pre-wrap break-words leading-relaxed max-h-40 overflow-y-auto scrollbar-thin flex-1 bg-bg-secondary p-3 rounded border border-border-medium/30">
                          {scan.explainability && scan.explainability.length > 0 ? (
                            scan.explainability.map((token: any, tIdx: number) => {
                              if (token.word === '\\n' || token.word === '\n') return <br key={tIdx} />;
                              // Compute heat map color (Red/Orange for high AI importance, Green for human)
                              const opacity = token.importance;
                              const heatColor = scan.type === 'AI_GENERATED' 
                                ? `rgba(239, 68, 68, ${opacity * 0.8})` // danger red
                                : `rgba(34, 197, 94, ${opacity * 0.5})`; // success green
                              
                              return (
                                <span 
                                  key={tIdx}
                                  className="relative group inline-block mr-1 transition-colors rounded px-0.5"
                                  style={{ backgroundColor: heatColor }}
                                >
                                  {token.word}
                                  <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-1 bg-bg-tertiary text-text-primary text-[9px] px-2 py-1 rounded border border-border-subtle shadow-modal z-50 whitespace-nowrap transition-opacity pointer-events-none">
                                    Importance: {(token.importance * 100).toFixed(1)}%
                                  </div>
                                </span>
                              );
                            })
                          ) : (
                            <span className="opacity-70">{scan.denoisedContent}</span>
                          )}
                        </div>
                      </div>

                      {/* Attribution Chart */}
                      <div className="bg-bg-primary/60 border border-border-subtle rounded-lg p-4 shadow-inner flex flex-col justify-center">
                        <div className="text-[10px] text-info uppercase font-bold tracking-widest mb-3">Model Attribution Map</div>
                        <div className="space-y-3">
                          {Object.entries(scan.attribution || {}).map(([model, prob]: [string, any]) => {
                            const percent = (prob * 100).toFixed(1);
                            
                            // Map colors based on model
                            let barColor = 'bg-text-disabled';
                            if (model === 'gpt-4') barColor = 'bg-[#10a37f]'; // OpenAI green
                            else if (model === 'claude-3') barColor = 'bg-[#d97757]'; // Anthropic orange
                            else if (model === 'llama-3') barColor = 'bg-primary'; // Meta blue
                            else if (model === 'human') barColor = 'bg-success';

                            return (
                              <div key={model} className="flex items-center gap-3 relative group">
                                <div className="w-16 text-right text-[10px] uppercase font-bold text-text-muted">
                                  {model}
                                </div>
                                <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden relative">
                                  <div 
                                    className={`absolute left-0 top-0 h-full ${barColor} transition-all duration-1000 ease-out`} 
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <div className="w-8 text-[10px] text-text-primary text-right font-mono">
                                  {percent}%
                                </div>
                              </div>
                            );
                          })}
                          
                          {Object.keys(scan.attribution || {}).length === 0 && (
                            <div className="text-xs font-mono text-text-muted italic text-center py-4">
                              Distribution unavailable (Model Air-Gapped / Fallback Active)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RAG Memory Panel */}
                    {scan.ragMemory && scan.ragMemory.length > 0 && (
                      <div className="mt-4 border-t border-border-subtle pt-4">
                        <div className="flex items-center gap-2 mb-3 text-[10px] text-warning uppercase font-bold tracking-widest">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                          RAG Institutional Memory (Similar Historical Matches)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {scan.ragMemory.map((mem: any, mIdx: number) => (
                            <div key={mIdx} className="bg-bg-primary/40 border border-warning/20 rounded p-3 text-xs shadow-sm hover:border-warning/50 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">ID: {mem.threat_id}</span>
                                <span className="text-[10px] font-mono text-success">{(mem.similarity * 100).toFixed(1)}% Match</span>
                              </div>
                              <p className="text-text-secondary truncate mt-1">{mem.summary}</p>
                              <div className="mt-2 flex justify-between items-center text-[10px] text-text-muted">
                                <span>{mem.timestamp}</span>
                                <span className={`uppercase font-bold ${mem.action_taken === 'BLOCKED' ? 'text-danger' : 'text-warning'}`}>
                                  {mem.action_taken}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* Add custom styles for sweeping animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}} />
    </div>
  );
}
