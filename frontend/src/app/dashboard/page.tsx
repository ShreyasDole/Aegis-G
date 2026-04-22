'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, BrainCircuit, ShieldCheck } from 'lucide-react';
import { NeonGlassCard } from '@/components/cyber/NeonGlassCard';

export default function DashboardPage() {
  return (
    <div className="w-full flex justify-center text-white/60">
      <div className="w-full max-w-7xl px-4 flex flex-col items-center">
        
        {/* HERO SECTION */}
        <section className="relative w-full py-32 flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,242,255,0.08),transparent_60%)] pointer-events-none" />
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-6xl md:text-9xl font-display uppercase tracking-[-0.04em] text-gradient-hero mb-6"
          >
            Aegis-G Core
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="font-mono text-lg max-w-2xl text-white/50 mb-12"
          >
            Executing realtime <span className="text-neon-cyan opacity-100">STYLISTIC ATTRIBUTION</span> and defending against <span className="text-neon-magenta opacity-100">AI-DRIVEN MALIGN OPERATIONS</span> at the <span className="text-neon-lime opacity-100">GRAPH LAYER</span>.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-6"
          >
            <button className="bg-white text-bg-base px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform">
              Deploy Inference
            </button>
            <button className="glass-panel px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm text-white hover:border-white transition-colors">
              Access Logs
            </button>
          </motion.div>
        </section>

        {/* METRICS / PROOF */}
        <section className="w-full border-y border-white/5 bg-black/40 py-12 mb-32">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5 text-center">
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-6xl font-display text-white mb-2">1.2M</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan">Threats Blocked</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-6xl font-display text-white mb-2">120ms</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-neon-lime">Inference Latency</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-6xl font-display text-white mb-2">99%</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-neon-magenta">Model Confidence</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-6xl font-display text-white mb-2">492k</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">Nodes Mapped</span>
            </div>
          </div>
        </section>

        {/* FEATURE BRICKS */}
        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          <NeonGlassCard 
            title="Shatter Illusion"
            description="Our primary neural network detects and dismantles AI generated content directly within the TCP stream."
            themeColor="neon-cyan"
            icon={<ShieldCheck className="w-6 h-6" />}
            features={["Denoising Autoencoders", "Shapley Attribution", "Sub-200ms Blocking"]}
          />
          <NeonGlassCard 
            title="Graph Tracking"
            description="Visually trace Patient Zero and track global narrative propagation via connected Neo4j subgraphs."
            themeColor="neon-magenta"
            icon={<Activity className="w-6 h-6" />}
            features={["Temporal Propagation", "Community Detection", "Air-gapped Storage"]}
          />
          <NeonGlassCard 
            title="Local Inference"
            description="Aegis operates in complete stealth with isolated ONNX runtimes. No API keys, no external leakage."
            themeColor="neon-lime"
            icon={<BrainCircuit className="w-6 h-6" />}
            features={["Zero-Knowledge Sync", "DeBERTa Checkpoints", "Immutable Ledger"]}
          />
        </section>

        {/* BENTO CTA GRID */}
        <section className="w-full mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10 rounded-3xl overflow-hidden glass-panel divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="bg-black text-left p-12 hover:bg-white/5 transition-colors group">
              <span className="text-neon-cyan font-mono text-[10px] tracking-widest uppercase block mb-4">Enterprise Triage</span>
              <h4 className="text-3xl font-display text-white mb-2">SOC Analyst</h4>
              <p className="text-white/50 text-sm mb-8 leading-relaxed">Instantly review quarantined payloads and identify synthetic injection campaigns.</p>
              <button className="px-5 py-2 font-mono text-xs uppercase tracking-widest border border-neon-cyan text-neon-cyan rounded group-hover:shadow-neon-cyan transition-shadow">
                Start Triage
              </button>
            </div>
            
            <div className="bg-black text-left p-12 hover:bg-white/5 transition-colors group">
              <span className="text-neon-magenta font-mono text-[10px] tracking-widest uppercase block mb-4">Graph Intelligence</span>
              <h4 className="text-3xl font-display text-white mb-2">Threat Hunter</h4>
              <p className="text-white/50 text-sm mb-8 leading-relaxed">Run complex cipher queries against our memory database to map adversarial networks.</p>
              <button className="px-5 py-2 font-mono text-xs uppercase tracking-widest border border-neon-magenta text-neon-magenta rounded group-hover:shadow-neon-magenta transition-shadow">
                Launch Graph
              </button>
            </div>

            <div className="bg-black text-left p-12 hover:bg-white/5 transition-colors group">
              <span className="text-neon-lime font-mono text-[10px] tracking-widest uppercase block mb-4">Pipeline Governance</span>
              <h4 className="text-3xl font-display text-white mb-2">Data Engineer</h4>
              <p className="text-white/50 text-sm mb-8 leading-relaxed">Directly configure localized weighting parameters and ONNX scaling tolerances.</p>
              <button className="px-5 py-2 font-mono text-xs uppercase tracking-widest border border-neon-lime text-neon-lime rounded group-hover:shadow-neon-lime transition-shadow">
                Check Nodes
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
