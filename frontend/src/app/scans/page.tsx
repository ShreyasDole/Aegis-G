'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Upload, Paperclip, ShieldCheck, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  scanData?: any; // The full forensic result
}

export default function ScansPage() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isScanning]);

  const handleManualScan = async () => {
    if (!inputText.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content: inputText,
      timestamp: new Date().toLocaleTimeString(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    const payload = inputText;
    setInputText('');
    setIsScanning(true);

    const mode = typeof window !== 'undefined' ? (localStorage.getItem('inference-mode') || 'local') : 'local';
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      const response = await fetch(`${API_URL}/api/scan/core`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Inference-Mode': mode,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: payload }),
      });
      
      if (!response.ok) throw new Error('Scan failed');
      const result = await response.json();
      
      const aiMsg: ChatMessage = {
        id: result.content_hash?.slice(0, 9) || Math.random().toString(36).substring(2, 9),
        role: 'ai',
        content: result.denoised_text || payload,
        timestamp: new Date().toLocaleTimeString(),
        scanData: {
          id: result.content_hash?.slice(0, 9),
          risk: result.risk_score ?? 0,
          type: result.is_ai_generated ? 'AI_GENERATED' : 'HUMAN',
          attribution: result.attribution || {},
          recommendation: result.recommendation || 'Unknown',
          explainability: result.explainability || [],
          ragMemory: result.rag_memory || []
        }
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Scan error:', error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString() + '_err',
        role: 'ai',
        content: 'Forensic scan failed. Ensure the backend is running.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleManualScan();
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.7) return 'text-neon-magenta';
    if (score >= 0.4) return 'text-neon-cyan';
    return 'text-neon-lime';
  };

  const getRiskGradient = (score: number) => {
    if (score >= 0.7) return 'from-neon-magenta/20 to-neon-magenta/5 border-neon-magenta/30';
    if (score >= 0.4) return 'from-neon-cyan/20 to-neon-cyan/5 border-neon-cyan/30';
    return 'from-neon-lime/20 to-neon-lime/5 border-neon-lime/30';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] w-full max-w-5xl mx-auto px-4 md:px-0">
      
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col items-center justify-center text-center shrink-0"
      >
        <h1 className="text-3xl md:text-5xl font-display tracking-tight text-white mb-2">
          Forensic Chat Agent
        </h1>
        <p className="text-white/60 text-xs uppercase tracking-[0.2em] font-mono flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-lime animate-pulse"></span>
          Adversarial Denoising &amp; Attribution Online
        </p>
      </motion.header>

      {/* Chat Stream Area */}
      <div className="flex-1 overflow-y-auto mb-6 pr-2 scrollbar-thin relative glass-panel bg-black/40 border-white/10 rounded-2xl p-4 md:p-8 flex flex-col">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
            <ShieldCheck className="w-16 h-16 text-white/20 mb-6" />
            <p className="font-mono text-neon-cyan uppercase tracking-widest text-sm mb-2">Ready for Payload</p>
            <p className="text-white/40 text-xs max-w-sm">Enter suspicious text, upload a document, or paste adversarial payloads below. The agent will run a deep DeBERTa forensic scan.</p>
          </div>
        )}

        <div className="flex flex-col space-y-8">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI Avatar */}
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center shrink-0 mr-4 mt-2">
                    <ShieldCheck className="w-4 h-4 text-neon-cyan" />
                  </div>
                )}

                <div className={`flex flex-col max-w-[90%] md:max-w-[80%]`}>
                  {/* Sender Name */}
                  <div className={`text-[10px] uppercase tracking-widest font-bold mb-1.5 font-mono ${msg.role === 'user' ? 'text-white/50 text-right' : 'text-neon-cyan'}`}>
                    {msg.role === 'user' ? 'You' : 'Forensic Engine'}
                  </div>

                  {/* Message Bubble */}
                  <div className={`relative p-5 rounded-2xl ${msg.role === 'user' ? 'glass-panel bg-white/5 border border-white/10 text-white rounded-tr-sm' : 'glass-panel bg-black/80 border border-white/10 shadow-card text-white rounded-tl-sm'}`}>
                    
                    {/* If strictly User Message, just show text */}
                    {msg.role === 'user' && (
                      <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}

                    {/* If AI Message with Scan Data, render the rich Forensic UI components! */}
                    {msg.role === 'ai' && msg.scanData ? (
                      <div className="flex flex-col gap-6">
                        {/* Status Header inside chat bubble */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-white/10">
                          <div className="flex flex-col gap-2">
                            <span className="glass-panel text-neon-cyan border-white/5 px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-inner inline-flex w-fit">
                              ID: {msg.scanData.id}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={`uppercase !text-[10px] tracking-widest border ${msg.scanData.type === 'AI_GENERATED' ? 'border-neon-magenta text-neon-magenta bg-neon-magenta/10' : 'border-neon-lime text-neon-lime bg-neon-lime/10'}`}>
                                {msg.scanData.type}
                              </Badge>
                              <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">
                                Action: <span className="text-white">{msg.scanData.recommendation}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Risk Score</span>
                            <div className={`text-2xl pt-1 font-black font-display tracking-tighter leading-none ${getRiskColor(msg.scanData.risk)}`}>
                              {(msg.scanData.risk * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        {/* SHAP Explainability Block */}
                        <div className="glass-panel bg-black/40 border-white/5 rounded-lg p-3">
                          <div className="text-[10px] text-neon-cyan uppercase font-bold tracking-widest mb-2">Token Attribution (SHAP)</div>
                          <div className="text-xs font-mono text-white/70 whitespace-pre-wrap break-words leading-relaxed">
                            {msg.scanData.explainability && msg.scanData.explainability.length > 0 ? (
                              msg.scanData.explainability.map((token: any, tIdx: number) => {
                                if (token.word === '\\n' || token.word === '\n') return <br key={tIdx} />;
                                const opacity = token.importance;
                                const heatColor = msg.scanData.type === 'AI_GENERATED' 
                                  ? `rgba(255, 0, 229, ${opacity * 0.8})` // neon-magenta
                                  : `rgba(173, 255, 0, ${opacity * 0.5})`;  // neon-lime
                                
                                return (
                                  <motion.span 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 + (tIdx * 0.005) }}
                                    key={tIdx}
                                    className="relative group inline-block mr-1 transition-colors rounded px-0.5"
                                    style={{ backgroundColor: heatColor }}
                                  >
                                    <span className={opacity > 0.4 ? 'text-black font-bold' : 'text-white'}>{token.word}</span>
                                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-white text-[9px] px-2 py-1 rounded border border-neon-cyan shadow-neon-cyan z-[100] whitespace-nowrap transition-opacity pointer-events-none">
                                      {(token.importance * 100).toFixed(1)}% Weight
                                    </div>
                                  </motion.span>
                                );
                              })
                            ) : (
                               <span>{msg.content}</span>
                            )}
                          </div>
                        </div>

                        {/* Dynamic Attribution Chart */}
                        <div className="flex flex-col gap-2">
                          <div className="text-[10px] text-neon-magenta uppercase font-bold tracking-widest">Attribution Map</div>
                          <div className="glass-panel bg-black/40 border-white/5 rounded-lg py-3 px-4 space-y-2.5">
                            {Object.keys(msg.scanData.attribution || {}).length > 0 ? (
                              Object.entries(msg.scanData.attribution).map(([model, prob]: [string, any], mI) => {
                                const percent = (prob * 100).toFixed(1);
                                const dynamicColors = ['bg-neon-cyan', 'bg-neon-magenta', 'bg-neon-lime', 'bg-white'];
                                const barColor = dynamicColors[mI % dynamicColors.length];
                                return (
                                  <div key={model} className="flex items-center gap-3 relative group">
                                    <div className="w-[70px] shrink-0 text-left text-[9px] uppercase font-bold text-white/60 truncate">
                                      {model}
                                    </div>
                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                                      <motion.div 
                                        initial={{ width: 0 }} animate={{ width: `${percent}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 + (mI * 0.1), ease: "easeOut" }}
                                        className={`absolute left-0 top-0 h-full ${barColor}`} 
                                      />
                                    </div>
                                    <div className="w-[30px] shrink-0 text-[10px] text-white text-right font-mono">
                                      {percent}%
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-[10px] font-mono text-white/40 italic text-center py-2">
                                Attribution unavailable.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* RAG Memory */}
                        {msg.scanData.ragMemory && msg.scanData.ragMemory.length > 0 && (
                          <div className="flex flex-col gap-2 mt-2">
                            <div className="text-[10px] text-neon-lime uppercase font-bold tracking-widest flex items-center gap-1.5">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                              RAG Institutional Memory
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {msg.scanData.ragMemory.map((mem: any, mIdx: number) => (
                                <motion.div 
                                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (mIdx * 0.1) }}
                                  key={mIdx} 
                                  className="glass-panel bg-black/20 border-neon-lime/20 rounded p-2.5 text-xs hover:border-neon-lime/50 transition-colors"
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-mono text-neon-lime text-[10px]">ID: {mem.threat_id} - {(mem.similarity * 100).toFixed(1)}% Match</span>
                                  </div>
                                  <p className="text-white/60 truncate text-[11px]">{mem.summary}</p>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Plain AI Text Fallback (e.g., error messages)
                      <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-neon-magenta">{msg.content}</p>
                    )}
                  </div>
                  <div className={`text-[9px] font-mono uppercase text-white/30 mt-1.5 tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/30 flex items-center justify-center shrink-0 ml-4 mt-2">
                    <User className="w-4 h-4 text-white/70" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isScanning && (
            <div className="flex w-full justify-start items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex flex-col items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
              </div>
              <div className="glass-panel bg-black/80 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce shadow-neon-cyan text-transparent"></span>
                <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce shadow-neon-cyan text-transparent" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce shadow-neon-cyan text-transparent" style={{ animationDelay: '0.2s' }}></span>
                <span className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest ml-2">Analyzing payload...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="shrink-0 glass-panel bg-black/80 rounded-2xl border border-white/10 p-2 shadow-card relative z-20">
        <div className="flex items-end gap-2">
          <div className="flex items-center self-stretch px-2 gap-1 border-r border-white/10 mr-2">
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Upload Media">
              <Paperclip className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Import Image/Video File">
              <Upload className="w-4 h-4" />
            </button>
          </div>
          
          <textarea
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none text-white text-sm font-mono placeholder-white/30 resize-none py-3 focus:ring-0 focus:outline-none"
            placeholder="Type a message, paste payload, or attach files for triaging..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={1}
          />
          
          <button 
            onClick={handleManualScan} 
            disabled={isScanning || !inputText.trim()}
            className={`self-stretch px-6 rounded-xl flex items-center justify-center font-mono text-[10px] uppercase tracking-widest font-bold transition-all ${
              !inputText.trim() 
                ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                : 'bg-neon-cyan text-black hover:bg-neon-cyan/90 hover:shadow-[0_0_15px_rgba(0,242,255,0.4)]'
            }`}
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Scan</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
