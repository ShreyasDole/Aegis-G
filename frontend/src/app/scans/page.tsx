"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, Bot, User, Brain, X, Image as ImageIcon } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageObj?: string | null; // base64
  scanResult?: any;
  timestamp: string;
}

export default function ForensicChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Aegis-G Multimodal AntiGravity Engine Online. Provide textual telemetry or graphical payloads for forensic analysis.',
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Only image uploads are supported for vision scans at this time.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputVal.trim() && !imageFile) return;

    const currentText = inputVal;
    const currentBase64 = imagePreview;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentText || 'Attached Forensic Payload',
      imageObj: currentBase64,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputVal('');
    removeAttachment();
    setIsScanning(true);

    try {
      const mode = typeof window !== 'undefined' ? (localStorage.getItem('inference-mode') || 'local') : 'local';
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      // Prepare payload - if image exists, send it inside a multimodal capable endpoint structure
      const payload = {
        content: currentText || '[IMAGE PAYLOAD]',
        image_base64: currentBase64 || null,
        source_platform: "chat-ui"
      };

      const response = await fetch(`${API_URL}/api/scan/core`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Inference-Mode': mode,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Endpoint verification failed.");
      
      const result = await response.json();
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.recommendation || 'Analysis complete.',
        scanResult: result,
        timestamp: new Date().toLocaleTimeString()
      }]);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error during inference pipeline execution: ${err.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsScanning(false);
    }
  };

  const renderBubble = (msg: Message) => {
    const isAssistant = msg.role === 'assistant';
    
    return (
      <div key={msg.id} className={`flex gap-4 w-full ${isAssistant ? '' : 'flex-row-reverse'} animate-slide-in`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center border shadow-lg relative ${
          isAssistant ? 'bg-black-true border-neon-cyan text-neon-cyan shadow-glow-cyan' 
                      : 'bg-white/10 border-white/20 text-white'
        }`}>
          {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        
        {/* Content Box */}
        <div className={`flex flex-col gap-2 max-w-[85%] ${isAssistant ? 'items-start' : 'items-end'}`}>
          <div className="flex items-center gap-2 text-[10px] font-space uppercase tracking-widest text-white/40">
            <span>{isAssistant ? 'Antigravity Agent' : 'Analyst'}</span>
            {/* // */}
            <span>{msg.timestamp}</span>
          </div>

          <div className={`p-4 rounded-xl border font-satoshi text-sm leading-relaxed backdrop-blur-md shadow-2xl relative ${
            isAssistant 
              ? 'bg-black-true/60 border-neon-cyan/30 text-white/90 rounded-tl-none' 
              : 'bg-white/5 border-white/10 text-white rounded-tr-none'
          }`}>
            {/* User Image Attachment rendering */}
            {msg.imageObj && (
              <div className="mb-3 rounded border border-white/10 overflow-hidden relative group">
                <img src={msg.imageObj} alt="payload" className="w-full max-w-sm object-cover" />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black-true/60 backdrop-blur border border-white/10 rounded flex items-center gap-1.5 text-[9px] font-space font-bold uppercase tracking-widest text-white/70">
                  <ImageIcon className="w-2.5 h-2.5" /> Image Object
                </div>
              </div>
            )}

            <span className="whitespace-pre-wrap">{msg.content}</span>

            {/* AI Scan Result Widget overlay inside chat */}
            {msg.scanResult && (
              <div className="mt-4 pt-4 border-t border-neon-cyan/20 w-full md:min-w-[400px]">
                <div className="flex justify-between items-center mb-4">
                  <div className={`px-2 py-1 text-[10px] font-space font-bold uppercase tracking-widest rounded border ${
                    msg.scanResult.risk_score > 0.7 ? 'border-neon-magenta text-neon-magenta bg-neon-magenta/10 shadow-glow-magenta' : 
                    msg.scanResult.risk_score > 0.4 ? 'border-neon-lime text-neon-lime bg-neon-lime/10 shadow-glow-lime' : 
                    'border-neon-cyan text-neon-cyan bg-neon-cyan/10 shadow-glow-cyan'
                  }`}>
                    {msg.scanResult.is_ai_generated ? 'AI GENERATED / SYNTHETIC' : 'HUMAN AUTHENTIC'}
                  </div>
                  <span className="font-cabinet font-black text-2xl text-white">{(msg.scanResult.risk_score * 100).toFixed(0)}%</span>
                </div>
                
                {/* Visual SHAP Explainability Token breakdown */}
                {msg.scanResult.explainability && msg.scanResult.explainability.length > 0 && (
                  <div className="mb-4 bg-black-true/80 border border-white/10 rounded p-3 text-xs font-mono max-h-32 overflow-y-auto scrollbar-thin">
                    <p className="font-space text-[9px] text-neon-cyan uppercase tracking-widest mb-2 font-bold">SHAP Token Heatmap</p>
                    {msg.scanResult.explainability.map((token: any, idx: number) => {
                      if (token.word === '\\n') return <br key={idx} />;
                      const color = token.importance > 0.5 ? `rgba(255,0,229,${token.importance})` : `rgba(0,242,255,${token.importance * 0.5})`;
                      return (
                        <span key={idx} style={{ backgroundColor: color }} className="rounded px-0.5 mr-0.5 transition-colors hover:bg-neon-lime">
                          {token.word}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Model Attribution breakdown */}
                {msg.scanResult.attribution && Object.keys(msg.scanResult.attribution).length > 0 && (
                  <div className="space-y-2">
                    <p className="font-space text-[9px] text-neon-cyan uppercase tracking-widest font-bold">Deep Model Attribution</p>
                    {Object.entries(msg.scanResult.attribution).map(([model, prob]: [string, any]) => (
                      <div key={model} className="flex items-center gap-3">
                        <div className="w-16 text-right text-[10px] uppercase font-bold text-white/50">{model}</div>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-neon-cyan transition-all" style={{ width: `${(prob * 100)}%` }} />
                        </div>
                        <div className="w-8 text-[10px] text-white font-mono">{(prob * 100).toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col relative bg-transparent min-h-[600px]">
      
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between pb-4 border-b border-white/10 mb-4 z-10 relative">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded border border-neon-cyan bg-neon-cyan/5 flex items-center justify-center text-neon-cyan shadow-glow-cyan">
             <Brain className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-cabinet font-black text-2xl uppercase tracking-tighter text-white leading-none">Multimodal Forensic Scan</h1>
            <p className="font-space text-[10px] uppercase font-bold tracking-widest text-neon-cyan mt-1 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" /> Agent Interface Active
            </p>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto scrollbar-thin rounded-xl mr-2 pr-4 space-y-6 z-10 relative">
         {messages.map(renderBubble)}
         {isScanning && (
           <div className="flex gap-4 w-full animate-slide-in">
             <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center border shadow-lg bg-black-true border-neon-magenta text-neon-magenta shadow-glow-magenta animate-pulse">
                <Bot className="w-4 h-4" />
             </div>
             <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2 text-[10px] font-space uppercase tracking-widest text-white/40">
                  <span>Antigravity Agent</span> {/* // */} <span>Processing Neural Weights...</span>
               </div>
               <div className="p-4 rounded-xl border border-neon-magenta/30 bg-black-true/60 rounded-tl-none font-satoshi text-sm text-neon-magenta flex items-center gap-2 w-max shadow-glow-magenta">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-magenta animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-magenta animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-magenta animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </div>
           </div>
         )}
         <div ref={messagesEndRef} className="pb-4" />
      </div>

      {/* Upload Preview Banner */}
      {imagePreview && (
        <div className="mx-4 mt-2 mb-2 p-2 bg-black-true/80 border border-neon-lime/40 backdrop-blur rounded flex items-center gap-4 animate-slide-in relative z-20">
          <img src={imagePreview} className="w-12 h-12 object-cover rounded border border-white/20" alt="upload-preview" />
          <div className="flex-1 font-space text-[10px] text-neon-lime font-bold uppercase tracking-widest">
            Visual Payload Attached ({(imageFile?.size ? (imageFile.size / 1024).toFixed(1) : 0)} KB)
          </div>
          <button type="button" onClick={removeAttachment} className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="shrink-0 pt-4 z-10 relative">
        <form onSubmit={handleSubmit} className="flex gap-2">
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors text-white/60 hover:text-white group"
            title="Attach Screen Capture / Image Payload"
          >
            <Paperclip className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>

          <input
             type="text"
             value={inputVal}
             onChange={e => setInputVal(e.target.value)}
             placeholder="Query Antigravity Engine or Paste Raw Extracted Metadata..."
             className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 text-sm font-space text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan focus:shadow-glow-cyan transition-all"
          />

          <button 
            type="submit"
            disabled={isScanning || (!inputVal.trim() && !imageFile)}
            className="w-14 h-14 rounded-xl bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-cyan transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
      
    </div>
  );
}
