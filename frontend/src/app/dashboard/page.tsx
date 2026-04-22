"use client";
import React from 'react';
import Link from 'next/link';
import { Activity, Network, Lock } from 'lucide-react';

export default function DashboardHubPage() {
  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-4 relative z-10 w-full font-satoshi">
      
      {/* Dynamic Status Pill */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-neon-lime animate-pulse" />
          <span className="font-space text-[10px] uppercase tracking-widest text-white/80 font-bold">System Status: Orbital</span>
        </div>
      </div>

      {/* Massive Hero Section */}
      <div className="text-center">
        <h1 className="font-cabinet font-black uppercase tracking-tighter text-6xl md:text-8xl lg:text-[9rem] leading-[0.85] mb-8 bg-clip-text text-transparent bg-gradient-to-br from-neon-cyan via-white to-neon-magenta">
          Zero Trust<br/>Intelligence
        </h1>

        <p className="max-w-xl mx-auto font-space text-sm md:text-base text-white/60 leading-relaxed mb-12">
          Deploy air-gapped forensic threat detection in milliseconds. 
          Powered by <span className="text-neon-cyan font-bold">Local-First ONNX Pipelines</span> and mathematically verifiable <span className="text-neon-magenta font-bold">SHAP Explainability</span>.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
          <Link href="/scans" className="px-8 py-4 bg-white text-black-true font-cabinet font-bold uppercase tracking-wider text-sm hover:scale-105 hover:bg-neon-cyan transition-all shadow-glow-cyan w-full sm:w-auto">
            Initialize Engine
          </Link>
          <button className="px-8 py-4 bg-transparent border border-neon-lime/40 text-neon-lime font-cabinet font-bold uppercase tracking-wider text-sm hover:border-neon-lime hover:bg-neon-lime/10 transition-all shadow-glow-lime w-full sm:w-auto group">
            Install Extension <span className="inline-block group-hover:animate-pulse ml-2 text-lg leading-none align-middle">+</span>
          </button>
          <button className="px-8 py-4 bg-transparent border border-white/20 text-white font-cabinet font-bold uppercase tracking-wider text-sm hover:border-white hover:bg-white/5 transition-all w-full sm:w-auto">
            View Protocol Specs
          </button>
        </div>
      </div>

      {/* Core Systems Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 w-full max-w-6xl mx-auto">
        <div className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 transition-all hover:-translate-y-2 hover:border-neon-cyan hover:bg-white/10 flex flex-col">
          <div className="w-12 h-12 border border-white/20 bg-black-true flex flex-col items-center justify-center rounded-lg mb-6 group-hover:border-neon-cyan group-hover:shadow-glow-cyan transition-all">
            <Activity className="w-5 h-5 text-neon-cyan" />
          </div>
          <h3 className="font-cabinet font-bold text-xl uppercase tracking-wide mb-3 text-white">AI Threat Attribution</h3>
          <p className="font-satoshi text-white/60 text-xs leading-relaxed flex-1">
            Stylometric deep-learning pipeline that precisely attributes hostile generative text to specific origin models locally via ONNX Runtime.
          </p>
        </div>

        <div className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 transition-all hover:-translate-y-2 hover:border-neon-magenta hover:bg-white/10 flex flex-col">
          <div className="w-12 h-12 border border-white/20 bg-black-true flex flex-col items-center justify-center rounded-lg mb-6 group-hover:border-neon-magenta group-hover:shadow-glow-magenta transition-all">
            <Network className="w-5 h-5 text-neon-magenta" />
          </div>
          <h3 className="font-cabinet font-bold text-xl uppercase tracking-wide mb-3 text-white">Graph Intelligence</h3>
          <p className="font-satoshi text-white/60 text-xs leading-relaxed flex-1">
            Topological tracking of disinformation campaigns using Neo4j graph networks. Identifies patient zero clusters and temporal diffusion patterns mathematically.
          </p>
        </div>

        <div className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 transition-all hover:-translate-y-2 hover:border-neon-lime hover:bg-white/10 flex flex-col">
          <div className="w-12 h-12 border border-white/20 bg-black-true flex flex-col items-center justify-center rounded-lg mb-6 group-hover:border-neon-lime group-hover:shadow-glow-lime transition-all">
            <Lock className="w-5 h-5 text-neon-lime" />
          </div>
          <h3 className="font-cabinet font-bold text-xl uppercase tracking-wide mb-3 text-white">Immutable Ledger</h3>
          <p className="font-satoshi text-white/60 text-xs leading-relaxed flex-1">
            Zero-knowledge cryptographic hashing anchors adversarial telemetry to a sovereign blockchain layer, ensuring chain of custody.
          </p>
        </div>
      </div>

    </div>
  );
}
