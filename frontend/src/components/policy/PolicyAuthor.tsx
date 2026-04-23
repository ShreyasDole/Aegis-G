'use client';
import React, { useState } from 'react';
import { Wand2, Check } from 'lucide-react';

export function PolicyAuthor() {
  const [intent, setIntent] = useState('');
  const [translating, setTranslating] = useState(false);
  const [result, setResult] = useState<{ dsl?: string; confidence?: number; explanation?: string } | null>(null);

  const translate = async () => {
    if (!intent.trim()) return;
    setTranslating(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/ai/policy-translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ intent }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        setResult({ explanation: 'Translation failed. Check backend.' });
      }
    } catch (err) {
      setResult({ explanation: 'Network error. Backend unreachable.' });
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      <div>
        <label className="text-2xs uppercase tracking-wider text-[#6b7280] mb-2 block font-medium">
          Natural Language Policy Intent
        </label>
        <textarea
          className="textarea"
          rows={5}
          placeholder="Describe your policy in plain English... e.g., 'Block any election misinformation posts with AI score above 0.7 and more than 5 coordinated accounts'"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={translate}
          disabled={translating || !intent.trim()}
          className="btn btn-primary btn-md gap-2"
        >
          {translating ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              Translate to DSL
            </>
          )}
        </button>
        <button onClick={() => { setIntent(''); setResult(null); }} className="btn btn-secondary btn-md">
          Clear
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className="rounded-lg p-4 space-y-3"
          style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-[#10b981]" />
            <span className="text-xs font-medium text-[#f3f4f6]">Translation Complete</span>
            {result.confidence !== undefined && (
              <span className="text-2xs text-[#9ca3af]">{(result.confidence * 100).toFixed(0)}% confidence</span>
            )}
          </div>

          {result.dsl && (
            <div>
              <p className="text-2xs uppercase tracking-wider text-[#6b7280] mb-2 font-medium">Generated DSL</p>
              <pre
                className="text-xs font-mono text-[#f3f4f6] p-3 rounded overflow-x-auto"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                {result.dsl}
              </pre>
            </div>
          )}

          {result.explanation && (
            <div>
              <p className="text-2xs uppercase tracking-wider text-[#6b7280] mb-2 font-medium">Explanation</p>
              <p className="text-xs text-[#9ca3af] leading-relaxed">{result.explanation}</p>
            </div>
          )}

          <button className="btn btn-primary btn-sm w-full">Save Policy</button>
        </div>
      )}
    </div>
  );
}
