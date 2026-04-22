'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
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
  const [isLoading, setIsLoading] = useState(false);
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
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const ws = new WebSocket(`ws://${host}:8000/ws/blocked-content`);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'blocked_content') {
        // Add new blocked item to the list
        setBlockedItems(prev => [message.data, ...prev].slice(0, 50));
        setBlockedCount(prev => prev + 1);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-wider uppercase mb-2">
              Policy Guardian Console
            </h1>
            <p className="text-text-secondary text-sm">
              Agent 4: Automated Mitigation - Translate intent into real-time defense rules
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-red-500">{blockedCount}</div>
              <div className="text-xs text-text-secondary uppercase tracking-wider">Blocked Today</div>
            </div>
            <Button variant="secondary" onClick={fetchBlockedContent}>
              Refresh
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
        <Card className="p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary mb-4">
            <span className="text-xl">📋</span> Live Block Log
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {blockedItems.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <div className="text-4xl mb-2">🔍</div>
                <div>No content blocked yet</div>
                <div className="text-xs mt-1">Blocked items will appear here in real-time</div>
              </div>
            ) : (
              blockedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-bg-primary border border-border-subtle rounded p-4 hover:border-red-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-red-500 uppercase">
                          {item.action_taken}
                        </span>
                        <span className="text-xs text-text-secondary">
                          by {item.policy_name}
                        </span>
                        {item.source_platform && (
                          <span className="text-xs text-text-muted">
                            • {item.source_platform}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-primary line-clamp-2">
                        {item.content_preview}
                      </p>
                    </div>
                    <div className="text-xs text-text-secondary ml-4">
                      {new Date(item.blocked_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Active Policies Section */}
        <Card className="p-6 mt-6">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary mb-4">
            <span className="text-xl">⚡</span> Active System Guardrails (Live)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePolicies.length === 0 ? (
              <div className="text-center py-4 text-text-secondary text-sm col-span-full">
                No dynamic guardrails active. System operating on default heuristics.
              </div>
            ) : (
              activePolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="bg-bg-primary border border-primary/30 rounded p-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary animate-pulse" />
                  <div className="flex justify-between items-start mb-2 ml-2">
                    <span className="text-xs font-bold text-text-primary">{policy.name}</span>
                    <span className="text-[9px] bg-success/20 text-success px-2 py-0.5 rounded uppercase">
                      Armed
                    </span>
                  </div>
                  <div className="ml-2 font-mono text-[10px] text-emerald-500 bg-black/50 p-2 rounded">
                    {policy.translated_dsl || policy.content}
                  </div>
                </div>
              ))
            )}
          </div>
      </Card>
    </div>
  );
}

