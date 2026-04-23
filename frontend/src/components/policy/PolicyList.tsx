'use client';
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Edit, Trash2, Power } from 'lucide-react';

interface Policy {
  id: number;
  name: string;
  description?: string;
  policy_type: string;
  category: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

interface PolicyListProps {
  onEdit: (policy: Policy) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
}

export function PolicyList({ onEdit, onDelete, onToggleActive }: PolicyListProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/ai/policies`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setPolicies(data);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  if (loading) {
    return <div className="text-xs text-[#6b7280] text-center py-8">Loading policies...</div>;
  }

  if (policies.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-sm text-[#9ca3af] mb-2">No policies created yet</p>
        <p className="text-xs text-[#6b7280]">Use the Policy Author tab to create your first policy</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {policies.map((policy) => (
        <div
          key={policy.id}
          className="card flex items-center justify-between gap-4 p-3 transition-colors"
          style={{ background: policy.is_active ? 'rgba(16,185,129,0.03)' : '#111113' }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-[#f3f4f6] truncate">{policy.name}</span>
              <Badge variant={policy.is_active ? 'success' : 'low'}>
                {policy.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-2xs text-[#6b7280] font-mono">{policy.category}</span>
            </div>
            {policy.description && (
              <p className="text-xs text-[#9ca3af] truncate">{policy.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleActive(policy.id, !policy.is_active)}
              className={`btn btn-sm ${policy.is_active ? 'btn-ghost' : 'btn-primary'}`}
              title={policy.is_active ? 'Deactivate' : 'Activate'}
            >
              <Power className="w-3 h-3" />
            </button>
            <button onClick={() => onEdit(policy)} className="btn btn-ghost btn-sm" title="Edit">
              <Edit className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(policy.id)} className="btn btn-ghost btn-sm text-[#ef4444]" title="Delete">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
