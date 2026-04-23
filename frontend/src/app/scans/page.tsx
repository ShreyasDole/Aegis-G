'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import { AIAgentControlCard } from '@/components/ui/AIAgentControlCard';
import { Paperclip, Send, X, ImageIcon, Bot, User, AlertCircle } from 'lucide-react';

/* ─── Message types ─── */
interface UserMessage {
  role: 'user';
  id: string;
  text?: string;
  image?: { url: string; name: string; size: number };
  ts: string;
}

interface AssistantMessage {
  role: 'assistant';
  id: string;
  ts: string;
  loading?: boolean;
  result?: {
    risk: number;
    type: string;
    recommendation: string;
    explainability: any[];
    attribution: Record<string, number>;
    ragMemory: any[];
    denoisedContent: string;
  };
  error?: string;
}

type Message = UserMessage | AssistantMessage;

/* ─── Helpers ─── */
const getRiskColor   = (s: number) => s >= 0.7 ? '#ef4444' : s >= 0.4 ? '#f97316' : '#10b981';
const getRiskVariant = (s: number): any => s >= 0.7 ? 'critical' : s >= 0.4 ? 'warning' : 'low';
const fileToBase64   = (f: File): Promise<string> =>
  new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });
const uid            = () => Math.random().toString(36).slice(2, 10);

/* ─── Token highlight ─── */
function ShapTokens({ tokens, isAI }: { tokens: any[]; isAI: boolean }) {
  return (
    <span className="font-mono text-xs leading-relaxed">
      {tokens.map((tok: any, i: number) => {
        if (tok.word === '\n') return <br key={i} />;
        const opacity = tok.importance;
        const bg = isAI
          ? `rgba(239,68,68,${opacity * 0.7})`
          : `rgba(16,185,129,${opacity * 0.5})`;
        return (
          <span key={i} title={`Importance: ${(tok.importance * 100).toFixed(1)}%`}
            className="mr-0.5 px-0.5 rounded cursor-help" style={{ background: bg }}>
            {tok.word}
          </span>
        );
      })}
    </span>
  );
}

/* ─── Assistant bubble content ─── */
function AnalysisResult({ result, loading, error }: AssistantMessage) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <span className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#5e6ad2]"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
        </span>
        <span className="text-xs text-[#6b7280]">Analyzing payload…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#ef4444]">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        {error}
      </div>
    );
  }

  if (!result) return null;

  const isAI = result.type === 'AI_GENERATED';

  return (
    <div className="space-y-3 text-xs">
      {/* Risk summary row */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-xl font-semibold tabular-nums"
          style={{ color: getRiskColor(result.risk) }}
        >
          {(result.risk * 100).toFixed(0)}%
        </span>
        <span className="text-[#6b7280]">risk score</span>
        <Badge variant={getRiskVariant(result.risk)}>{isAI ? 'AI-Generated' : 'Human'}</Badge>
        <Badge variant="accent">{result.recommendation}</Badge>
      </div>

      {/* SHAP tokens */}
      {result.explainability?.length > 0 && (
        <div className="rounded-md p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="mono-10 text-[#6b7280] uppercase tracking-wider mb-2">SHAP Token Attribution</p>
          <ShapTokens tokens={result.explainability} isAI={isAI} />
        </div>
      )}

      {/* Model bars */}
      {Object.keys(result.attribution || {}).length > 0 && (
        <div>
          <p className="mono-10 text-[#6b7280] uppercase tracking-wider mb-2">Model Attribution</p>
          <div className="space-y-1.5">
            {Object.entries(result.attribution).map(([model, prob]) => {
              const pct = (prob * 100).toFixed(1);
              const colors: Record<string, string> = { 'gpt-4': '#10a37f', 'claude-3': '#d97757', 'llama-3': '#5e6ad2', 'human': '#10b981' };
              return (
                <div key={model} className="flex items-center gap-2">
                  <span className="mono-10 text-[#6b7280] w-14 text-right">{model}</span>
                  <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: colors[model] || '#5e6ad2' }} />
                  </div>
                  <span className="mono-10 text-[#9ca3af] w-8">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RAG Memory */}
      {result.ragMemory?.length > 0 && (
        <div>
          <p className="mono-10 text-[#6b7280] uppercase tracking-wider mb-2">Similar Historical Cases</p>
          <div className="space-y-1.5">
            {result.ragMemory.map((m: any, i: number) => (
              <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="mono-10 text-[#5e6ad2] shrink-0 mt-0.5">#{m.threat_id}</span>
                <span className="text-[#9ca3af] flex-1 truncate">{m.summary}</span>
                <span className="mono-10 text-[#10b981] shrink-0">{(m.similarity * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function ScansPage() {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [inputText, setInputText]   = useState('');
  const [pendingImage, setPendingImage] = useState<{ file: File; url: string } | null>(null);
  const [sending, setSending]       = useState(false);
  const [panelOpen, setPanelOpen]   = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const textRef    = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      id: uid(),
      ts: new Date().toLocaleTimeString(),
      result: undefined,
      loading: false,
      error: undefined,
    }]);
  }, []);

  /* Handle image pick */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPendingImage({ file, url });
    e.target.value = '';
  };

  /* Paste image support */
  const onPaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPendingImage({ file, url });
  };

  /* Send */
  const handleSend = async () => {
    const hasText  = inputText.trim().length > 0;
    const hasImage = !!pendingImage;
    if (!hasText && !hasImage) return;
    if (sending) return;

    setSending(true);

    // User message
    const userMsg: UserMessage = {
      role: 'user',
      id: uid(),
      ts: new Date().toLocaleTimeString(),
      text: inputText.trim() || undefined,
      image: pendingImage
        ? { url: pendingImage.url, name: pendingImage.file.name, size: pendingImage.file.size }
        : undefined,
    };

    // Placeholder assistant message
    const assistantId = uid();
    const assistantPlaceholder: AssistantMessage = {
      role: 'assistant',
      id: assistantId,
      ts: new Date().toLocaleTimeString(),
      loading: true,
    };

    setMessages(prev => [...prev, userMsg, assistantPlaceholder]);
    setInputText('');
    const img = pendingImage;
    setPendingImage(null);

    try {
      const mode    = localStorage.getItem('inference-mode') || 'local';
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token   = localStorage.getItem('token');

      // Build content — include base64 image if present
      let content = userMsg.text || '';
      if (img) {
        const b64 = await fileToBase64(img.file);
        content = content
          ? `${content}\n\n[IMAGE_ATTACHMENT: ${img.file.name}]\n${b64}`
          : `[IMAGE_ATTACHMENT: ${img.file.name}]\n${b64}`;
      }

      const res = await fetch(`${API_URL}/api/scan/core`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Inference-Mode': mode,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error(`Scan failed (${res.status})`);
      const data = await res.json();

      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? {
              ...m,
              loading: false,
              result: {
                risk:           data.risk_score ?? 0,
                type:           data.is_ai_generated ? 'AI_GENERATED' : 'HUMAN',
                recommendation: data.recommendation || 'Unknown',
                explainability: data.explainability || [],
                attribution:    data.attribution || {},
                ragMemory:      data.rag_memory || [],
                denoisedContent: data.denoised_text || '',
              },
            }
          : m
      ));
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, loading: false, error: err.message || 'Forensic scan failed. Check backend.' }
          : m
      ));
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const hasInput = inputText.trim().length > 0 || !!pendingImage;

  return (
    <div className="flex h-full relative" style={{ height: 'calc(100vh - 32px)' }}>

      {/* ── CHAT COLUMN ── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Message thread */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">

          {/* Welcome state */}
          {messages.length === 1 && !messages[0].loading && !(messages[0] as AssistantMessage).result && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(94,106,210,0.12)', border: '1px solid rgba(94,106,210,0.2)' }}
              >
                <Bot className="w-6 h-6 text-[#5e6ad2]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#f3f4f6] mb-1">AEGIS-G Forensic Scanner</p>
                <p className="text-xs text-[#6b7280] max-w-sm leading-relaxed">
                  Submit text or images for AI-powered forensic analysis. I'll detect AI-generated content,
                  attribute models, highlight adversarial tokens, and provide threat recommendations.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  'Analyze this text for AI generation',
                  'Check for adversarial payload',
                  'Is this phishing content?',
                ].map(hint => (
                  <button
                    key={hint}
                    onClick={() => { setInputText(hint); textRef.current?.focus(); }}
                    className="px-3 py-1.5 rounded-full text-xs text-[#9ca3af] transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg) => {
            if (msg.role === 'user') {
              const um = msg as UserMessage;
              return (
                <div key={msg.id} className="flex justify-end gap-3 animate-slide-up">
                  <div className="max-w-[70%] space-y-2">
                    {/* Image preview */}
                    {um.image && (
                      <div className="flex justify-end">
                        <div className="relative rounded-lg overflow-hidden"
                          style={{ maxWidth: '240px', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <img src={um.image.url} alt={um.image.name} className="max-h-48 object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 px-2 py-1 mono-10 text-[#9ca3af]"
                            style={{ background: 'rgba(0,0,0,0.6)' }}>
                            {um.image.name} · {(um.image.size / 1024).toFixed(1)}KB
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Text bubble */}
                    {um.text && (
                      <div
                        className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-[#f3f4f6] whitespace-pre-wrap"
                        style={{ background: '#5e6ad2' }}
                      >
                        {um.text}
                      </div>
                    )}
                    <p className="text-right mono-10 text-[#4b5563]">{msg.ts}</p>
                  </div>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold text-white"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  >
                    <User className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            }

            /* Assistant bubble */
            const am = msg as AssistantMessage;
            return (
              <div key={msg.id} className="flex gap-3 animate-slide-up">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(94,106,210,0.15)', border: '1px solid rgba(94,106,210,0.2)' }}
                >
                  <Bot className="w-3.5 h-3.5 text-[#5e6ad2]" />
                </div>
                <div className="flex-1 max-w-[85%]">
                  <div
                    className="rounded-2xl rounded-tl-sm px-4 py-3"
                    style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {/* Welcome message */}
                    {!am.loading && !am.result && !am.error && (
                      <p className="text-xs text-[#9ca3af]">
                        Ready for forensic analysis. Submit text or an image below.
                      </p>
                    )}
                    <AnalysisResult {...am} />
                  </div>
                  <p className="mono-10 text-[#4b5563] mt-1 ml-1">{msg.ts}</p>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* ── INPUT BAR ── */}
        <div
          className="border-t px-4 py-3"
          style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#0e0e0e' }}
        >
          {/* Image preview strip */}
          {pendingImage && (
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="relative rounded-lg overflow-hidden shrink-0"
                style={{ width: '56px', height: '56px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={pendingImage.url} alt="attachment" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#9ca3af] truncate">{pendingImage.file.name}</p>
                <p className="mono-10 text-[#4b5563]">{(pendingImage.file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => setPendingImage(null)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[#6b7280] hover:text-[#f3f4f6] transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Textarea + actions */}
          <div
            className="flex items-end gap-2 rounded-xl px-3 py-2"
            style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Attach image */}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#f3f4f6] hover:bg-[rgba(255,255,255,0.06)] transition-colors shrink-0 mb-0.5"
              title="Attach image"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

            {/* Textarea */}
            <textarea
              ref={textRef}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-[#f3f4f6] leading-relaxed placeholder:text-[#4b5563]"
              style={{ fontFamily: 'Inter, sans-serif', maxHeight: '200px', minHeight: '24px' }}
              placeholder="Enter text or paste an image for forensic analysis… (Shift+Enter for newline)"
              rows={1}
              value={inputText}
              onChange={e => {
                setInputText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
              onKeyDown={onKey}
              onPaste={onPaste}
            />

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!hasInput || sending}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 mb-0.5"
              style={{
                background: hasInput && !sending ? '#5e6ad2' : 'rgba(255,255,255,0.06)',
                color: hasInput && !sending ? '#fff' : '#4b5563',
              }}
              title="Send (Enter)"
            >
              {sending
                ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
                : <Send className="w-3.5 h-3.5" />
              }
            </button>
          </div>

          <p className="text-center mono-10 text-[#4b5563] mt-1.5">
            Enter · send &nbsp;·&nbsp; Shift+Enter · newline &nbsp;·&nbsp; Paste image · attach
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: AI Controls ── */}
      <div
        className="border-l flex flex-col overflow-hidden transition-all duration-200"
        style={{
          width: panelOpen ? '280px' : '0px',
          minWidth: panelOpen ? '280px' : '0px',
          borderColor: 'rgba(255,255,255,0.05)',
          overflow: panelOpen ? undefined : 'hidden',
        }}
      >
        {panelOpen && (
          <div className="p-4 space-y-4 overflow-y-auto scrollbar-thin flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#9ca3af]">Agent Controls</span>
              <button onClick={() => setPanelOpen(false)} className="text-[#4b5563] hover:text-[#9ca3af] text-xs">✕</button>
            </div>
            <AIAgentControlCard />
            <div>
              <p className="mono-10 text-[#4b5563] uppercase tracking-wider mb-2">Session</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7280]">Scans this session</span>
                  <span className="text-[#f3f4f6] tabular-nums">{messages.filter(m => m.role === 'user').length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7280]">Status</span>
                  <span className="text-[#10b981]">Online</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel toggle */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-10 rounded-l-md flex items-center justify-center transition-colors"
        style={{
          background: panelOpen ? 'rgba(94,106,210,0.15)' : 'rgba(255,255,255,0.04)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          color: '#6b7280',
          right: panelOpen ? '280px' : '0px',
          zIndex: 10,
        }}
        title={panelOpen ? 'Close panel' : 'Agent controls'}
      >
        <span className="text-[9px]">{panelOpen ? '›' : '‹'}</span>
      </button>

      {/* Bounce keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
