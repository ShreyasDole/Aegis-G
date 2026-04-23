'use client';

import React, { useState } from 'react';
import { Target, Activity, Zap, ShieldAlert, Cpu } from 'lucide-react';

export default function RedTeamPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [attackCount, setAttackCount] = useState(25);
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const startSimulation = async () => {
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch('/api/scan/red-team/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ count: attackCount })
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        alert("Simulation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-8 pb-32">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center rounded-2xl">
          <Target className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h1 className="font-cabinet font-black text-3xl md:text-4xl uppercase tracking-tighter text-white">
            Red-Team Simulator
          </h1>
          <p className="font-space text-xs text-white/50 uppercase tracking-widest mt-1">
            Continuous Adversarial Testing & Guardrail Validation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-1 bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col items-start gap-6 border-l-red-500/50">
          <div>
            <h2 className="font-cabinet font-bold text-xl uppercase tracking-wide text-white mb-2">Simulate Attack</h2>
            <p className="font-space text-xs text-white/50 leading-relaxed">
              Launch obfuscated payload swarms (leetspeak, zero-width chars) directly at the Agent 1 Local ONNX Model and Agent 4 Policy Guardrails to test defense durability.
            </p>
          </div>
          <div className="w-full">
            <label className="font-space text-[10px] uppercase font-bold text-white/60 tracking-widest block mb-2">
              Payload Count: {attackCount}
            </label>
            <input 
              type="range" 
              min="5" 
              max="100" 
              value={attackCount} 
              onChange={(e) => setAttackCount(parseInt(e.target.value))}
              className="w-full accent-red-500 bg-white/10 rounded-full appearance-none h-1 mb-6"
            />
          </div>
          <button 
            onClick={startSimulation}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-all font-space text-xs font-bold uppercase tracking-widest rounded-xl shadow-glow-red"
          >
            {loading ? (
              <span className="flex items-center gap-2"><Zap className="w-4 h-4 animate-spin" /> Launching Swarm...</span>
            ) : (
              <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Execute Simulation</span>
            )}
          </button>
        </div>

        <div className="col-span-1 md:col-span-2 bg-black-true/50 border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="font-cabinet font-bold text-xl uppercase tracking-wide text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-neon-cyan" /> Simulation Telemetry
          </h2>
          
          {!results && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-white/20 font-space text-xs tracking-widest uppercase">
              Awaiting Execution Orders
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-red-500 font-space text-xs tracking-widest uppercase">
              <Zap className="w-8 h-8 animate-pulse text-red-500" />
              Firing Payloads into Agent 1...
            </div>
          )}

          {results && (
            <div className="w-full space-y-6">
              <div className="grid grid-cols-3 gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="font-space text-[10px] text-white/40 uppercase tracking-widest font-bold block mb-1">Total Attacks</span>
                  <span className="font-cabinet font-black text-3xl text-white">{results.total_attacks}</span>
                </div>
                <div>
                  <span className="font-space text-[10px] text-neon-lime uppercase tracking-widest font-bold block mb-1">Blocked (Success)</span>
                  <span className="font-cabinet font-black text-3xl text-neon-lime">{results.successful_blocks}</span>
                </div>
                <div>
                  <span className="font-space text-[10px] text-red-500 uppercase tracking-widest font-bold block mb-1">Bypassed (Fail)</span>
                  <span className="font-cabinet font-black text-3xl text-red-500">{results.bypassed}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-space text-[10px] uppercase font-bold text-white/60 tracking-widest">Agent Shield Resilience Rate</span>
                  <span className="font-cabinet font-black text-2xl text-neon-cyan">{results.block_rate}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-lime transition-all duration-1000"
                    style={{ width: `${results.block_rate}%` }}
                  />
                </div>
              </div>

              <div className="mt-8 space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {results.attack_logs.map((log: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-white/5 bg-white/[0.01] rounded-lg">
                    <div className="flex items-center gap-3">
                       {log.status === 'BLOCKED' ? (
                          <ShieldAlert className="w-4 h-4 text-neon-lime" />
                       ) : (
                          <Cpu className="w-4 h-4 text-red-500" />
                       )}
                       <div>
                         <p className="font-space text-[10px] text-white tracking-wider">{log.payload_snippet}</p>
                         <p className="font-space text-[9px] text-white/40 uppercase tracking-widest">Score: {log.ai_score_estimated} | By: {log.detected_by}</p>
                       </div>
                    </div>
                    <span className={`font-space text-[10px] font-bold tracking-widest uppercase ${log.status === 'BLOCKED' ? 'text-neon-lime' : 'text-red-500'}`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
