"use client";
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Policy {
  id?: number;
  name: string;
  description?: string;
  policy_type: 'logical' | 'natural';
  content: string;
  category?: string;
  priority: number;
}

interface PolicyEditorProps {
  policy?: Policy | null;
  onSave: (_policy: Policy) => void;
  onCancel: () => void;
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({
  policy,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Policy>({
    name: '',
    description: '',
    policy_type: 'natural',
    content: '',
    category: '',
    priority: 5
  });

  useEffect(() => {
    if (policy) {
      setFormData(policy);
    }
  }, [policy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        {policy?.id ? 'Edit Policy' : 'Create New Policy'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Policy Name *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Election Disinformation Block"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Description
          </label>
          <Input
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the policy"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Category
            </label>
            <Input
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., security, finance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Priority (1-10)
            </label>
            <Input
              type="number"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Policy Type
          </label>
          <select
            value={formData.policy_type}
            onChange={(e) => setFormData({ ...formData, policy_type: e.target.value as 'logical' | 'natural' })}
            className="w-full bg-bg-primary border border-border-subtle rounded px-3 py-2 text-sm focus:border-primary outline-none"
          >
            <option value="natural">Natural Language</option>
            <option value="logical">DSL (Logical)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Policy Content *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder={
              formData.policy_type === 'natural'
                ? 'e.g., Be extremely aggressive against any election disinformation'
                : 'IF narrative_match("keyword") AND ai_score > 0.8 THEN BLOCK_AND_LOG'
            }
            className="w-full h-32 bg-bg-primary border border-border-subtle rounded p-3 text-sm focus:border-primary outline-none resize-none font-mono"
            required
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {policy?.id ? 'Update Policy' : 'Create Policy'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

