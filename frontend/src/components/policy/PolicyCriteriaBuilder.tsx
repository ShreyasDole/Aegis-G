'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const KEYWORD_PRESETS: { id: string; label: string; phrase: string }[] = [
  { id: 'election', label: 'Election / voting', phrase: 'election' },
  { id: 'naval', label: 'Naval / maritime', phrase: 'naval' },
  { id: 'classified', label: 'Classified leaks', phrase: 'classified' },
  { id: 'botnet', label: 'Coordination / botnet', phrase: 'botnet' },
  { id: 'disinfo', label: 'Disinformation', phrase: 'disinformation' },
];

type Props = {
  onPolicyCreated?: () => void;
};

export const PolicyCriteriaBuilder: React.FC<Props> = ({ onPolicyCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('security');
  const [priority, setPriority] = useState(5);
  const [aiThreshold, setAiThreshold] = useState(0.65);
  const [clusterMin, setClusterMin] = useState(0);
  const [keywords, setKeywords] = useState<Record<string, boolean>>({
    election: false,
    naval: false,
    classified: false,
    botnet: false,
    disinfo: false,
  });
  const [action, setAction] = useState<'BLOCK_AND_LOG' | 'LOG_ONLY'>('BLOCK_AND_LOG');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const dsl = useMemo(() => {
    const parts: string[] = [];
    parts.push(`ai_score > ${aiThreshold.toFixed(2)}`);
    if (clusterMin > 0) {
      parts.push(`graph_cluster_size > ${clusterMin}`);
    }
    const picks = KEYWORD_PRESETS.filter(k => keywords[k.id]).map(k => `narrative_match("${k.phrase}")`);
    if (picks.length > 0) {
      parts.push(picks.length === 1 ? picks[0] : `( ${picks.join(' OR ')} )`);
    }
    const cond = parts.join(' AND ');
    return `IF ${cond} THEN ${action}`;
  }, [aiThreshold, clusterMin, keywords, action]);

  const save = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Login required');
      return;
    }
    const nm = name.trim() || `criteria_${Date.now()}`;
    if (nm.length < 3) {
      setMessage('Name at least 3 characters');
      return;
    }
    const logic = dsl.length >= 10 ? dsl : `${dsl}\n# aegis`;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/ai/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: nm.slice(0, 200),
          description: description || 'Visual criteria policy',
          policy_type: 'logical',
          content: logic,
          category,
          priority,
        }),
      });
      if (res.ok) {
        setMessage('Policy created and armed.');
        onPolicyCreated?.();
        setName('');
        setDescription('');
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail || res.status));
      }
    } catch {
      setMessage('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Rule metadata</h3>
        <div>
          <label className="text-xs text-text-muted uppercase">Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. High-risk election mesh" />
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase">Description</label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full bg-bg-primary border border-border-subtle rounded px-3 py-2 text-sm"
          >
            <option value="security">security</option>
            <option value="election">election</option>
            <option value="naval">naval</option>
            <option value="guardian">guardian</option>
          </select>
        </div>
        <div>
          <div className="flex justify-between text-xs text-text-muted uppercase mb-1">
            <span>Priority</span>
            <span className="text-text-primary font-mono">{priority}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={priority}
            onChange={e => setPriority(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-text-muted uppercase mb-1">
            <span>AI score threshold</span>
            <span className="text-text-primary font-mono">{aiThreshold.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={35}
            max={95}
            value={Math.round(aiThreshold * 100)}
            onChange={e => setAiThreshold(Number(e.target.value) / 100)}
            className="w-full accent-neon-cyan"
          />
          <p className="text-[10px] text-text-muted mt-1">Posts with forensic ai_score above this match.</p>
        </div>

        <div>
          <div className="flex justify-between text-xs text-text-muted uppercase mb-1">
            <span>Min graph cluster size</span>
            <span className="text-text-primary font-mono">{clusterMin === 0 ? 'off' : clusterMin}</span>
          </div>
          <input
            type="range"
            min={0}
            max={25}
            value={clusterMin}
            onChange={e => setClusterMin(Number(e.target.value))}
            className="w-full accent-neon-magenta"
          />
        </div>

        <div>
          <p className="text-xs text-text-muted uppercase mb-2">Narrative keywords (OR group)</p>
          <div className="flex flex-wrap gap-2">
            {KEYWORD_PRESETS.map(k => (
              <label
                key={k.id}
                className={`flex items-center gap-2 text-xs px-3 py-2 rounded border cursor-pointer ${
                  keywords[k.id] ? 'border-primary bg-primary/10 text-text-primary' : 'border-border-subtle text-text-muted'
                }`}
              >
                <input
                  type="checkbox"
                  checked={keywords[k.id]}
                  onChange={e => setKeywords(prev => ({ ...prev, [k.id]: e.target.checked }))}
                />
                {k.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted uppercase">Action</label>
          <select
            value={action}
            onChange={e => setAction(e.target.value as 'BLOCK_AND_LOG' | 'LOG_ONLY')}
            className="w-full bg-bg-primary border border-border-subtle rounded px-3 py-2 text-sm mt-1"
          >
            <option value="BLOCK_AND_LOG">BLOCK_AND_LOG</option>
            <option value="LOG_ONLY">LOG_ONLY</option>
          </select>
        </div>

        {message && <p className="text-xs text-warning">{message}</p>}

        <Button variant="primary" className="w-full" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Create policy from criteria'}
        </Button>
      </Card>

      <Card className="p-6 bg-black/40 border border-emerald-900/30">
        <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-3">Generated DSL</h3>
        <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap bg-bg-primary p-4 rounded border border-white/5 min-h-[200px]">
          {dsl}
        </pre>
        <p className="text-[10px] text-text-muted mt-3 uppercase tracking-wider">
          Multiple policies: save each variant with a different name. Ingest worker evaluates active policies by priority.
        </p>
      </Card>
    </div>
  );
};
