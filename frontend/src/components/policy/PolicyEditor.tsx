'use client';
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PolicyEditorProps {
  policy: any;
  onSave: (policy: any) => void;
  onCancel: () => void;
}

export function PolicyEditor({ policy, onSave, onCancel }: PolicyEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('threat_blocking');
  const [priority, setPriority] = useState(50);

  useEffect(() => {
    if (policy) {
      setName(policy.name || '');
      setDescription(policy.description || '');
      setContent(policy.content || '');
      setCategory(policy.category || 'threat_blocking');
      setPriority(policy.priority || 50);
    }
  }, [policy]);

  const handleSave = () => {
    onSave({
      ...(policy?.id ? { id: policy.id } : {}),
      name,
      description,
      content,
      policy_type: 'natural',
      category,
      priority,
    });
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#f3f4f6]">{policy?.id ? 'Edit Policy' : 'New Policy'}</h3>
        <button onClick={onCancel} className="btn btn-ghost btn-sm">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <label className="text-2xs uppercase tracking-wider text-[#6b7280] mb-2 block font-medium">Policy Name</label>
        <input className="input" placeholder="e.g., Block Election Disinfo" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <label className="text-2xs uppercase tracking-wider text-[#6b7280] mb-2 block font-medium">Description</label>
        <input className="input" placeholder="Brief description..." value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <label className="text-2xs uppercase tracking-wider text-[#6b7280] mb-2 block font-medium">Category</label>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="threat_blocking">Threat Blocking</option>
          <option value="content_moderation">Content Moderation</option>
          <option value="user_behavior">User Behavior</option>
          <option value="network_security">Network Security</option>
        </select>
      </div>

      <div>
        <label className="text-2xs uppercase tracking-wider text-[#6b7280] mb-2 block font-medium">Priority (0-100)</label>
        <input type="number" min="0" max="100" className="input" value={priority} onChange={(e) => setPriority(parseInt(e.target.value))} />
      </div>

      <div>
        <label className="text-2xs uppercase tracking-wider text-[#6b7280] mb-2 block font-medium">Policy Content (DSL or Natural Language)</label>
        <textarea className="textarea" rows={6} placeholder="IF ai_score > 0.7 THEN BLOCK_AND_LOG" value={content} onChange={(e) => setContent(e.target.value)} />
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={handleSave} className="btn btn-primary flex-1">
          {policy?.id ? 'Update Policy' : 'Create Policy'}
        </button>
        <button onClick={onCancel} className="btn btn-secondary flex-1">
          Cancel
        </button>
      </div>
    </div>
  );
}
