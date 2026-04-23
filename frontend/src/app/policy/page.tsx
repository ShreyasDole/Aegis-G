'use client';
import React, { useState, useEffect } from 'react';
import { PolicyAuthor } from '@/components/policy/PolicyAuthor';
import { PolicyList } from '@/components/policy/PolicyList';
import { PolicyEditor } from '@/components/policy/PolicyEditor';
import { Badge } from '@/components/ui/Badge';
import { RefreshCw, Plus } from 'lucide-react';

interface BlockedItem {
  id: number;
  content_preview: string;
  policy_name: string;
  action_taken: string;
  blocked_at: string;
  source_platform?: string;
}

export default function PolicyPage() {
  const [tab, setTab] = useState<'author' | 'manage'>('author');
  const [blocked, setBlocked] = useState<BlockedItem[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [editPolicy, setEditPolicy] = useState<any>(null);

  const fetchBlocked = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/blocked-content/stats', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const d = await res.json();
        setBlockedCount(d.today_count || 0);
        setBlocked(d.recent_blocks || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchBlocked();
    const interval = setInterval(fetchBlocked, 5000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket
  useEffect(() => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const ws = new WebSocket(apiBase.replace(/^http/, 'ws') + '/ws/blocked-content');
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'blocked_content') {
          setBlocked(prev => [msg.data, ...prev].slice(0, 50));
          setBlockedCount(prev => prev + 1);
        }
      };
      ws.onerror = () => console.warn('WebSocket unavailable');
      return () => ws.close();
    } catch { console.warn('WebSocket failed to initialize'); }
  }, []);

  const savePolicy = async (policy: any) => {
    try {
      const token = localStorage.getItem('token');
      const url   = policy.id ? `/api/ai/policies/${policy.id}` : '/api/ai/policies';
      await fetch(url, {
        method: policy.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify(policy),
      });
      setShowEditor(false);
      setEditPolicy(null);
    } catch {}
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 32px)' }}>

      {/* Stat header */}
      <div className="grid grid-cols-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="px-5 py-4 border-r" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="text-2xs uppercase tracking-wider font-medium text-[#6b7280] mb-1.5">Blocked Today</div>
          <div className="text-2xl font-semibold tabular-nums" style={{ color: blockedCount > 0 ? '#ef4444' : '#f3f4f6' }}>
            {blockedCount}
          </div>
        </div>
        <div className="px-5 py-4 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          <span className="text-xs text-[#9ca3af]">WebSocket live feed active</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar px-4">
        {(['author', 'manage'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab ${tab === t ? 'active' : ''} capitalize`}>
            {t === 'author' ? 'Policy Author' : 'Policy Management'}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-2 my-auto">
          <button onClick={fetchBlocked} className="btn btn-ghost btn-sm">
            <RefreshCw className="w-3 h-3" />
          </button>
          {tab === 'manage' && !showEditor && (
            <button onClick={() => { setEditPolicy(null); setShowEditor(true); }} className="btn btn-primary btn-sm gap-1">
              <Plus className="w-3 h-3" /> New Policy
            </button>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="p-4 max-w-4xl">

          {tab === 'author' && <PolicyAuthor />}

          {tab === 'manage' && (
            showEditor
              ? <PolicyEditor policy={editPolicy} onSave={savePolicy} onCancel={() => { setShowEditor(false); setEditPolicy(null); }} />
              : <PolicyList onEdit={p => { setEditPolicy(p); setShowEditor(true); }} onDelete={id => console.log('del', id)} onToggleActive={(id, active) => console.log('toggle', id, active)} />
          )}

          {/* Live block log */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xs uppercase tracking-wider text-[#6b7280] font-medium">Live Block Log</span>
              {blocked.length > 0 && <Badge variant="critical">{blocked.length}</Badge>}
            </div>

            {blocked.length === 0 ? (
              <div
                className="rounded-lg px-4 py-8 text-center text-sm text-[#6b7280]"
                style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                No content blocked yet — blocked items will appear here in real-time
              </div>
            ) : (
              <div className="space-y-1">
                {blocked.map(item => (
                  <div
                    key={item.id}
                    className="rounded-md px-4 py-2.5 flex items-start gap-3 text-xs"
                    style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <span className="mono-10 font-semibold text-[#ef4444] uppercase mt-0.5 shrink-0">{item.action_taken}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[#9ca3af]">by </span>
                      <span className="text-[#f3f4f6]">{item.policy_name}</span>
                      {item.source_platform && <span className="text-[#6b7280] ml-2">· {item.source_platform}</span>}
                      <p className="text-[#6b7280] truncate mt-0.5">{item.content_preview}</p>
                    </div>
                    <span className="mono-10 text-[#4b5563] shrink-0">
                      {new Date(item.blocked_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
