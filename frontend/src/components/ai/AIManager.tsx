'use client';
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{ label: string; onClick: () => void }>;
}

export const AIManager: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Custom event from EnterpriseShell "AI Assistant" button
  React.useEffect(() => {
    const handleOpenAI = () => {
      setIsOpen(true);
    };

    window.addEventListener('openAIAssistant', handleOpenAI);
    return () => window.removeEventListener('openAIAssistant', handleOpenAI);
  }, []);

  // Keyboard shortcut (Ctrl+M or Cmd+M)
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage('');
    setIsTyping(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: currentMessage, use_tools: true }),
      });
      const data = res.ok ? await res.json() : null;
      const reply = data?.message || 'I couldn’t process that. Please try again.';
      const suggestions = data?.suggestions || [];
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        actions: suggestions.slice(0, 3).map((label: string) => ({
          label,
          onClick: () => {
            if (label.toLowerCase().includes('threat')) window.location.href = '/threats';
            else if (label.toLowerCase().includes('report') || label.toLowerCase().includes('dashboard')) window.location.href = '/dashboard';
            else if (label.toLowerCase().includes('scan')) window.location.href = '/scans';
          },
        })),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Connection error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg glass-panel bg-black/80 border border-neon-cyan/40 text-neon-cyan shadow-lg shadow-black hover:shadow-neon-cyan/30 hover:bg-neon-cyan/10 transition-all flex items-center gap-2 font-mono tracking-widest text-[10px]"
        title="AI Assistant (⌘M)"
      >
        <span>AI_AGENT</span>
        {!isOpen && <kbd className="px-1.5 py-0.5 bg-neon-cyan/20 border border-neon-cyan/40 rounded text-[9px]">⌘M</kbd>}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] animate-slide-up">
          <div className="h-full flex flex-col p-0 overflow-hidden shadow-2xl glass-panel bg-black/80 border-white/10 rounded-xl">
            {/* Header */}
            <div className="glass-panel bg-black/60 p-4 flex items-center justify-between border-b border-white/10 rounded-t-xl shadow-none">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-neon-cyan"></div>
                <div>
                  <h3 className="font-bold tracking-widest text-[#00f2ff] text-[10px] uppercase">AI Security Assistant</h3>
                  <div className="text-[10px] font-mono text-white/60">Online</div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-black/40 backdrop-blur-sm">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'border border-white/10 bg-white/5 text-white shadow-inner'
                        : 'border border-neon-cyan/20 bg-neon-cyan/5 text-white/90 shadow-[0_0_15px_rgba(0,242,255,0.05)]'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-[9px] text-[#00f2ff] font-bold uppercase tracking-[0.2em]">
                        AI_AGENT <span className="opacity-50">#AUTH</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{msg.content}</p>
                    {msg.actions && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {msg.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={action.onClick}
                            className="text-[10px] uppercase tracking-widest px-3 py-1.5 bg-neon-cyan/5 hover:bg-neon-cyan/20 rounded transition-colors border border-neon-cyan/30 text-neon-cyan font-bold"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="text-[9px] font-mono uppercase text-white/30 mt-2 text-right tracking-widest">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-neon-cyan/5 rounded-lg p-3 border border-neon-cyan/20 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
                    <div className="flex gap-1.5 p-1">
                      <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce shadow-neon-cyan text-transparent"></span>
                      <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce shadow-neon-cyan text-transparent" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce shadow-neon-cyan text-transparent" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/80 rounded-b-xl shadow-none">
              <div className="flex gap-2 mb-3">
                <button 
                  className="text-[9px] uppercase tracking-widest px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors text-white/50 border border-white/5"
                  onClick={() => window.location.href = '/threats'}
                >
                  Show threats
                </button>
                <button 
                  className="text-[9px] uppercase tracking-widest px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors text-white/50 border border-white/5"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Dashboard
                </button>
                <button 
                  className="text-[9px] uppercase tracking-widest px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors text-white/50 border border-white/5"
                  onClick={() => window.location.href = '/scans'}
                >
                  Scans
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="[AWAITING COMMAND] Ask me anything..."
                  className="flex-1 bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 shadow-inner transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:border-neon-cyan text-white hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-md transition-all font-mono tracking-widest uppercase text-[10px] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};