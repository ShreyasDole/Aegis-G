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

  // Listen for custom event from Navbar
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
        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded bg-primary text-white shadow-lg hover:bg-blue-600 hover:shadow-glow-blue transition-all flex items-center gap-2 font-medium text-sm"
        title="AI Assistant (⌘M)"
      >
        <span>AI Assistant</span>
        {!isOpen && <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-xs">⌘M</kbd>}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] animate-slide-up">
          <Card className="h-full flex flex-col p-0 overflow-hidden shadow-modal">
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between border-b border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-semibold text-white text-sm">AI Security Assistant</h3>
                  <div className="text-xs text-white/80">Online</div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-bg-primary">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-bg-secondary text-text-primary border border-border-subtle'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-xs text-primary font-semibold uppercase tracking-wider">
                        AI ASSISTANT
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.actions && (
                      <div className="flex gap-2 mt-3">
                        {msg.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={action.onClick}
                            className="text-xs px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded transition-colors border border-primary/30 text-primary font-medium"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-text-muted mt-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-bg-secondary rounded p-3 border border-border-subtle">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border-subtle bg-bg-secondary">
              <div className="flex gap-2 mb-2">
                <button 
                  className="text-xs px-3 py-1 bg-bg-tertiary hover:bg-bg-primary rounded transition-colors text-text-secondary"
                  onClick={() => window.location.href = '/threats'}
                >
                  Show threats
                </button>
                <button 
                  className="text-xs px-3 py-1 bg-bg-tertiary hover:bg-bg-primary rounded transition-colors text-text-secondary"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Dashboard
                </button>
                <button 
                  className="text-xs px-3 py-1 bg-bg-tertiary hover:bg-bg-primary rounded transition-colors text-text-secondary"
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
                  placeholder="Ask me anything..."
                  className="input flex-1 text-sm"
                />
                <Button
                  variant="primary"
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="px-4"
                >
                  Send
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};