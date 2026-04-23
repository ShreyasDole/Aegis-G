'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PolicyAuthor } from '@/components/policy/PolicyAuthor';
import { PolicyList } from '@/components/policy/PolicyList';
import { PolicyEditor } from '@/components/policy/PolicyEditor';

interface BlockedItem {
  id: number;
  content_preview: string;
  policy_name: string;
  action_taken: string;
  blocked_at: string;
  source_platform?: string;
}

export default function PolicyPage() {
  const [blockedItems, setBlockedItems] = useState<BlockedItem[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);

  const [showEditor, setShowEditor] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'author' | 'manage'>('author');
  const [activePolicies, setActivePolicies] = useState<any[]>([]);

  useEffect(() => {
    fetchBlockedContent();
    fetchActivePolicies();
    const interval = setInterval(() => {
      fetchBlockedContent();
      fetchActivePolicies();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBlockedContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/blocked-content/stats', {
        headers: { 'Authorization': `Bearer ${token || ''}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBlockedCount(data.today_count || 0);
        setBlockedItems(data.recent_blocks || []);
      }
    } catch (error) {
      console.error('Error fetching blocked content:', error);
    }
  };

  const fetchActivePolicies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/policies?is_active=true', {
        headers: { 'Authorization': `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivePolicies(data);
      }
    } catch (error) {
      console.error('Error fetching active policies:', error);
    }
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = window.location.hostname;
    const wsPort = process.env.NEXT_PUBLIC_WS_PORT || '8000';
    const ws = new WebSocket(`ws://${host}:${wsPort}/ws/blocked-content`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'blocked_content') {
          setBlockedItems(prev => [message.data, ...prev].slice(0, 50));
          setBlockedCount(prev => prev + 1);
        }
      } catch { /* ignore malformed messages */ }
    };

    ws.onerror = () => { /* suppress console noise — WS is best-effort */ };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-space font-bold tracking-wider uppercase text-neon-cyan mb-2">
              Policy Guardian Console
            </h1>
            <p className="text-text-muted text-sm font-space">
              AGENT_4 // AUTOMATED_MITIGATION // Translating intent into real-time defense rules
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-3xl font-bold font-space text-neon-magenta">{blockedCount}</div>
              <div className="text-[10px] text-text-secondary font-space uppercase tracking-widest">Blocked Today</div>
            </div>
            <Button variant="secondary" onClick={fetchBlockedContent} className="font-space tracking-widest text-[10px] uppercase border-neon-cyan/30 hover:border-neon-cyan/80">
              Refresh Feed
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border-subtle">
          <button
            onClick={() => setActiveTab('author')}
            className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'author'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Policy Author
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'manage'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Policy Management
          </button>
        </div>

        {/* Policy Authoring Section */}
        {activeTab === 'author' && (
          <div className="mb-8">
            <PolicyAuthor />
          </div>
        )}

        {/* Policy Management Section */}
        {activeTab === 'manage' && (
          <div className="mb-8">
            {showEditor ? (
              <PolicyEditor
                policy={editingPolicy}
                onSave={async (policy) => {
                  try {
                    const token = localStorage.getItem('token');
                    const url = policy.id
                      ? `/api/ai/policies/${policy.id}`
                      : '/api/ai/policies';
                    
                    const response = await fetch(url, {
                      method: policy.id ? 'PUT' : 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token || ''}`
                      },
                      body: JSON.stringify(policy)
                    });

                    if (response.ok) {
                      setShowEditor(false);
                      setEditingPolicy(null);
                    }
                  } catch (error) {
                    console.error('Error saving policy:', error);
                  }
                }}
                onCancel={() => {
                  setShowEditor(false);
                  setEditingPolicy(null);
                }}
              />
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Policies</h2>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setEditingPolicy(null);
                      setShowEditor(true);
                    }}
                  >
                    Create New Policy
                  </Button>
                </div>
                <PolicyList
                  onEdit={(policy) => {
                    setEditingPolicy(policy);
                    setShowEditor(true);
                  }}
                  onDelete={(id) => {
                    console.log('Policy deleted:', id);
                  }}
                  onToggleActive={(id, isActive) => {
                    console.log('Policy toggled:', id, isActive);
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Live Block Log */}
        <div className="bg-bg-primary/60 border border-white/5 shadow-[0_0_15px_rgba(0,183,255,0.05)] rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold font-space uppercase tracking-widest text-neon-cyan mb-6">
            <span className="text-xl">📋</span> Live Block Log
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {blockedItems.length === 0 ? (
              <div className="text-center py-12 text-text-secondary font-space">
                <div className="text-4xl mb-4 opacity-50">🔍</div>
                <div className="uppercase tracking-widest text-sm">No activity detected</div>
                <div className="text-xs mt-2 opacity-50">Monitoring network traffic...</div>
              </div>
            ) : (
              blockedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-black/40 border border-neon-magenta/20 rounded p-4 hover:border-neon-magenta/60 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 font-space">
                        <span className="text-[10px] font-bold text-neon-magenta bg-neon-magenta/10 px-2 py-0.5 rounded uppercase tracking-wider shadow-[0_0_10px_rgba(255,0,255,0.2)]">
                          {item.action_taken}
                        </span>
                        <span className="text-[10px] text-text-secondary uppercase tracking-widest">
                          SRC: {item.policy_name}
                        </span>
                        {item.source_platform && (
                          <span className="text-[10px] text-neon-cyan/70 uppercase tracking-widest">
                            {"// "} {item.source_platform}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-primary line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        {item.content_preview}
                      </p>
                    </div>
                    <div className="text-[10px] uppercase font-space text-text-muted ml-4 mt-1 border border-white/10 px-2 py-1 bg-black/50">
                      {new Date(item.blocked_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Policies Section */}
        <div className="bg-bg-primary/60 border border-white/5 shadow-[0_0_15px_rgba(0,183,255,0.05)] rounded-lg p-6 mb-8">
          <h3 className="flex items-center gap-2 text-sm font-bold font-space uppercase tracking-widest text-neon-cyan mb-6">
            <span className="text-xl animate-pulse">⚡</span> Active System Guardrails (Live)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePolicies.length === 0 ? (
              <div className="text-center py-8 text-text-secondary font-space text-[10px] uppercase tracking-widest col-span-full border border-dashed border-white/10">
                No dynamic guardrails active. System operating on default heuristics.
              </div>
            ) : (
              activePolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="bg-black/50 border border-neon-cyan/30 hover:border-neon-cyan shadow-[0_0_10px_rgba(0,183,255,0.1)] rounded p-4 relative overflow-hidden transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan animate-pulse shadow-[0_0_10px_rgba(0,183,255,0.8)]" />
                  <div className="flex justify-between items-start mb-3 ml-2">
                    <span className="text-sm font-bold font-space uppercase tracking-wider text-text-primary">{policy.name}</span>
                    <span className="text-[9px] font-space bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 px-2 py-0.5 rounded uppercase tracking-widest">
                      Armed
                    </span>
                  </div>
                  <div className="ml-2 font-mono text-[11px] text-neon-cyan/80 bg-black/80 border border-white/5 p-3 rounded leading-relaxed shadow-inner">
                    {policy.translated_dsl || policy.content}
                  </div>
                </div>
              ))
            )}
          </div>
      </div>
    </div>
  );
}

