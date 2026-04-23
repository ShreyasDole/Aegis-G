'use client';
import React, { useEffect, useState } from 'react';

interface Shortcut {
  key: string;
  label: string;
}

interface KeyboardToastProps {
  shortcuts: Shortcut[];
  autoHide?: boolean;
  hideAfterMs?: number;
}

export function KeyboardToast({ shortcuts, autoHide = true, hideAfterMs = 5000 }: KeyboardToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoHide) return;
    const t = setTimeout(() => setVisible(false), hideAfterMs);
    return () => clearTimeout(t);
  }, [autoHide, hideAfterMs]);

  if (!visible) return null;

  return (
    <div className="kbd-toast">
      <span className="text-2xs text-[#6b7280]">Shortcuts</span>
      {shortcuts.map((s, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="kbd">{s.key}</span>
          <span className="text-2xs text-[#6b7280]">{s.label}</span>
        </span>
      ))}
      <button
        onClick={() => setVisible(false)}
        className="text-[#4b5563] hover:text-[#9ca3af] transition-colors ml-2"
        aria-label="Dismiss"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
