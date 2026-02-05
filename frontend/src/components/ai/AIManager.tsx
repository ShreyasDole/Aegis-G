'use client';
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI Security Manager. I can help you analyze threats, generate reports, and provide insights. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I understand you want to analyze the recent threats. Based on the current data, I\'ve identified 12 critical threats that require immediate attention. Would you like me to generate a detailed report?',
        timestamp: new Date(),
        actions: [
          { label: '📊 Generate Report', onClick: () => console.log('Generate report') },
          { label: '🔍 View Threats', onClick: () => console.log('View threats') },
        ],
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-secondary to-primary text-white shadow-glow-purple hover:scale-110 transition-transform flex items-center justify-center text-2xl"
        title="AI Manager (⌘M)"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] animate-slide-up">
          <Card className="h-full flex flex-col p-0 overflow-hidden shadow-modal">
            {/* Header */}
            <div className="bg-gradient-to-r from-secondary to-primary p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="font-semibold text-white">AI Manager</h3>
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                    <span>Online</span>
                  </div>
                </div>
              </div>
              <kbd className="px-2 py-1 bg-white/20 rounded text-xs text-white">⌘M</kbd>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-bg-primary">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-bg-secondary text-text-primary'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🤖</span>
                        <span className="text-xs text-text-muted">AI Manager</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.actions && (
                      <div className="flex gap-2 mt-3">
                        {msg.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={action.onClick}
                            className="text-xs px-3 py-1.5 bg-bg-primary hover:bg-bg-tertiary rounded transition-colors"
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
                  <div className="bg-bg-secondary rounded-lg p-3">
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
                  ↑
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <button className="text-xs px-3 py-1 bg-bg-tertiary hover:bg-bg-primary rounded transition-colors">
                  Show threats
                </button>
                <button className="text-xs px-3 py-1 bg-bg-tertiary hover:bg-bg-primary rounded transition-colors">
                  Generate report
                </button>
                <button className="text-xs px-3 py-1 bg-bg-tertiary hover:bg-bg-primary rounded transition-colors">
                  System status
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

