"use client";
import Link from 'next/link';
import { Shield, Zap, Workflow, Server, Activity, Lock, Search, Network } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-black-true text-white overflow-hidden font-satoshi selection:bg-neon-magenta/30 selection:text-white">
      {/* 40px Grid Layer */}
      <div className="absolute inset-0 bg-grid z-0 opacity-100 pointer-events-none" />
      {/* Animated Scanline Overlay */}
      <div className="scanline" />

      {/* FIXED NAVIGATION */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 w-full max-w-[896px] z-50 px-4">
        <div className="flex items-center justify-between px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
              <Shield className="w-5 h-5 text-black-true" />
            </div>
            <span className="font-cabinet font-bold uppercase tracking-tight text-lg text-white">Aegis-G</span>
          </div>

          {/* Technical Pills */}
          <div className="hidden md:flex items-center gap-6 font-space text-[10px] tracking-[0.2em] uppercase text-white/60 font-semibold">
            <Link href="#architecture" className="hover:text-neon-cyan transition-colors">Architecture</Link>
            <Link href="#engines" className="hover:text-neon-magenta transition-colors">AI Engines</Link>
            <Link href="#telemetry" className="hover:text-neon-lime transition-colors">Telemetry</Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 font-space text-xs tracking-widest uppercase font-bold">
            <Link href="/login" className="text-white/70 hover:text-white transition-colors">Sign In</Link>
            <Link href="#" className="px-5 py-2.5 bg-white text-black-true rounded-full hover:bg-neon-cyan transition-colors">Terminal</Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-[25vh] pb-32 flex flex-col items-center justify-center text-center px-4">
        {/* Massive Radial Glow Behind Hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-cyan/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-neon-lime animate-pulse" />
          <span className="font-space text-[10px] uppercase tracking-widest text-white/80 font-bold">System Status: Orbital</span>
        </div>

        <h1 className="font-cabinet font-black uppercase tracking-tighter text-6xl md:text-8xl lg:text-[10rem] leading-[0.85] mb-8 bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-lime">
          Zero Trust<br/>Intelligence
        </h1>

        <p className="max-w-2xl font-space text-sm md:text-base text-white/60 leading-relaxed mb-12">
          Deploy air-gapped forensic threat detection in milliseconds. 
          Powered by <span className="text-neon-cyan font-bold">Local-First ONNX Pipelines</span> and mathematically verifiable <span className="text-neon-magenta font-bold">SHAP Explainability</span>. 
          Welcome to the next epoch of enterprise cybersecurity.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Link href="/login" className="px-8 py-4 bg-white text-black-true font-cabinet font-bold uppercase tracking-wider text-sm hover:scale-105 hover:bg-neon-cyan transition-all shadow-glow-cyan w-full sm:w-auto">
            Initialize Engine
          </Link>
          <button className="px-8 py-4 bg-transparent border border-neon-lime/40 text-neon-lime font-cabinet font-bold uppercase tracking-wider text-sm hover:border-neon-lime hover:bg-neon-lime/10 transition-all shadow-glow-lime w-full sm:w-auto group">
            Install Extension <span className="inline-block group-hover:animate-pulse ml-2 text-lg leading-none align-middle">+</span>
          </button>
          <Link href="#" className="px-8 py-4 bg-transparent border border-white/20 text-white font-cabinet font-bold uppercase tracking-wider text-sm hover:border-white hover:bg-white/5 transition-all w-full sm:w-auto">
            View Protocol Specs
          </Link>
        </div>
      </section>

      {/* METRICS SECTION */}
      <section className="relative z-10 border-y border-white/5 bg-black-true/40 backdrop-blur-md py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-6 divide-x divide-white/5">
          <div className="flex flex-col items-center text-center">
            <span className="font-cabinet font-black text-4xl md:text-5xl text-white mb-2">99.9%</span>
            <span className="font-space text-[10px] uppercase tracking-widest text-neon-cyan font-semibold">Attribution Accuracy</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-cabinet font-black text-4xl md:text-5xl text-white mb-2">&lt;45ms</span>
            <span className="font-space text-[10px] uppercase tracking-widest text-neon-magenta font-semibold">Inference Latency</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-cabinet font-black text-4xl md:text-5xl text-white mb-2">10B+</span>
            <span className="font-space text-[10px] uppercase tracking-widest text-neon-lime font-semibold">Vectors Processed</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-cabinet font-black text-4xl md:text-5xl text-white mb-2">0</span>
            <span className="font-space text-[10px] uppercase tracking-widest text-white/60 font-semibold">External API Calls</span>
          </div>
        </div>
      </section>

      {/* FEATURE BRICKS */}
      <section id="engines" className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-24">
          <h2 className="font-cabinet font-black text-4xl md:text-5xl uppercase tracking-tight mb-4">Core Architecture</h2>
          <p className="font-space text-sm text-white/60 uppercase tracking-widest max-w-xl mx-auto">Modular defense systems designed for extreme hostile environments.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Cyan */}
          <div className="group relative bg-white/[0.02] backdrop-blur-[10px] border border-white/5 rounded-3xl p-8 transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 hover:border-neon-cyan hover:shadow-glow-cyan flex flex-col">
            <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center rounded-xl mb-8 group-hover:bg-neon-cyan transition-colors duration-400">
              <Activity className="w-6 h-6 text-white/50 group-hover:text-black-true transition-colors" />
            </div>
            <h3 className="font-cabinet font-bold text-2xl uppercase tracking-wide mb-3">AI Threat Attribution</h3>
            <p className="font-satoshi text-white/60 text-sm leading-relaxed mb-10 flex-1">
              Stylometric deep-learning pipeline that precisely attributes hostile generative text to specific origin models (e.g., Llama-3, GPT-4) locally via ONNX Runtime.
            </p>
            <ul className="space-y-3 font-space text-xs text-white/80">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-neon-cyan rounded-full"/> Offline Inference Engine</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-neon-cyan rounded-full"/> SHAP Explainability Graph</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-neon-cyan rounded-full"/> Adversarial Denoising</li>
            </ul>
          </div>

          {/* Card 2: Magenta */}
          <div className="group relative bg-white/[0.02] backdrop-blur-[10px] border border-white/5 rounded-3xl p-8 transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 hover:border-neon-magenta hover:shadow-glow-magenta flex flex-col">
            <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center rounded-xl mb-8 group-hover:bg-neon-magenta transition-colors duration-400">
              <Network className="w-6 h-6 text-white/50 group-hover:text-black-true transition-colors" />
            </div>
            <h3 className="font-cabinet font-bold text-2xl uppercase tracking-wide mb-3">Graph Intelligence</h3>
            <p className="font-satoshi text-white/60 text-sm leading-relaxed mb-10 flex-1">
              Topological tracking of disinformation campaigns using Neo4j graph networks. Identifies patient zero clusters and temporal diffusion patterns mathematically.
            </p>
            <ul className="space-y-3 font-space text-xs text-white/80">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-neon-magenta rounded-full"/> Spatial-Temporal Clustering</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-neon-magenta rounded-full"/> Centrality Scoring</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-neon-magenta rounded-full"/> Attack Path Visualization</li>
            </ul>
          </div>

          {/* Card 3: Lime */}
          <div className="group relative bg-white/[0.02] backdrop-blur-[10px] border border-white/5 rounded-3xl p-8 transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 hover:border-neon-lime hover:shadow-glow-lime flex flex-col">
            <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center rounded-xl mb-8 group-hover:bg-neon-lime transition-colors duration-400">
              <Lock className="w-6 h-6 text-white/50 group-hover:text-black-true transition-colors" />
            </div>
            <h3 className="font-cabinet font-bold text-2xl uppercase tracking-wide mb-3">Immutable Ledger</h3>
            <p className="font-satoshi text-white/60 text-sm leading-relaxed mb-10 flex-1">
              Zero-knowledge cryptographic hashing anchors adversarial telemetry to a sovereign blockchain layer, ensuring chain of custody for legal and military review.
            </p>
            <ul className="space-y-3 font-space text-xs text-white/80">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-neon-lime rounded-full"/> Cryptographic Tamper-Proofing</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-neon-lime rounded-full"/> Decentralized Audit Trails</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-neon-lime rounded-full"/> Sub-Second Block Anchors</li>
            </ul>
          </div>
        </div>
      </section>

      {/* MULTI-AUDIENCE CTA BENTO */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border border-white/10 rounded-xl overflow-hidden bg-black-true">
          
          <div className="p-12 hover:bg-white/5 transition-colors flex flex-col group">
            <span className="font-space text-[10px] text-neon-cyan uppercase tracking-widest font-bold mb-6 block">Target Audience // 01</span>
            <h4 className="font-cabinet font-bold text-3xl uppercase tracking-tight mb-4 group-hover:text-white transition-colors">National Defense</h4>
            <p className="font-satoshi text-white/50 text-sm leading-relaxed mb-12 flex-1">
              Operate in zero-connectivity environments with fully self-contained neural networks that never "call home" to external CDNs.
            </p>
            <Link href="#" className="font-space text-xs uppercase tracking-widest font-bold text-white group-hover:text-neon-cyan transition-colors flex items-center gap-3">
              Deploy Protocol <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          <div className="p-12 hover:bg-white/5 transition-colors flex flex-col group">
            <span className="font-space text-[10px] text-neon-magenta uppercase tracking-widest font-bold mb-6 block">Target Audience // 02</span>
            <h4 className="font-cabinet font-bold text-3xl uppercase tracking-tight mb-4 group-hover:text-white transition-colors">Enterprise SOC</h4>
            <p className="font-satoshi text-white/50 text-sm leading-relaxed mb-12 flex-1">
              Seamless integration with existing SIEM tools. Aggregate vast amounts of unclassified data to automatically strip generative AI noise.
            </p>
            <Link href="/login" className="font-space text-xs uppercase tracking-widest font-bold text-white group-hover:text-neon-magenta transition-colors flex items-center gap-3">
              Access Dashboard <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          <div className="p-12 hover:bg-white/5 transition-colors flex flex-col group">
            <span className="font-space text-[10px] text-neon-lime uppercase tracking-widest font-bold mb-6 block">Target Audience // 03</span>
            <h4 className="font-cabinet font-bold text-3xl uppercase tracking-tight mb-4 group-hover:text-white transition-colors">Forensic Legal</h4>
            <p className="font-satoshi text-white/50 text-sm leading-relaxed mb-12 flex-1">
              A mathematical paper trail for every inference. SHAP token scores legally quantify exactly why a threat classification was reached.
            </p>
            <Link href="#" className="font-space text-xs uppercase tracking-widest font-bold text-white group-hover:text-neon-lime transition-colors flex items-center gap-3">
              Read Case Study <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-12 border-t border-white/5 text-center text-white/40 font-space text-[10px] uppercase tracking-widest">
        &copy; {new Date().getFullYear()} Aegis-G Command. All Rights Reserved. Air-Gapped Intelligence Engine.
      </footer>
    </main>
  );
}
