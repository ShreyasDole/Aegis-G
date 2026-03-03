"use client";
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface Policy {
  id: number;
  name: string;
  description?: string;
  policy_type: 'logical' | 'natural';
  content: string;
  translated_dsl?: string;
  category?: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

interface PolicyListProps {
  onEdit?: (policy: Policy) => void;
  onDelete?: (policyId: number) => void;
  onToggleActive?: (policyId: number, isActive: boolean) => void;
}

export const PolicyList: React.FC<PolicyListProps> = ({
  onEdit,
  onDelete,
  onToggleActive
}) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchPolicies();
  }, [filter]);

  const fetchPolicies = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filter === 'all' 
        ? '/api/ai/policies'
        : `/api/ai/policies?is_active=${filter === 'active'}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (policy: Policy) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ai/policies/${policy.id}/activate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(!policy.is_active)
      });

      if (response.ok) {
        await fetchPolicies();
        if (onToggleActive) {
          onToggleActive(policy.id, !policy.is_active);
        }
      }
    } catch (error) {
      console.error('Error toggling policy:', error);
    }
  };

  const handleDelete = async (policyId: number) => {
    if (!confirm('Are you sure you want to delete this policy?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ai/policies/${policyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (response.ok) {
        await fetchPolicies();
        if (onDelete) {
          onDelete(policyId);
        }
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-text-secondary">Loading policies...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilter('all')}
          className="text-sm"
        >
          All ({policies.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'primary' : 'secondary'}
          onClick={() => setFilter('active')}
          className="text-sm"
        >
          Active ({policies.filter(p => p.is_active).length})
        </Button>
        <Button
          variant={filter === 'inactive' ? 'primary' : 'secondary'}
          onClick={() => setFilter('inactive')}
          className="text-sm"
        >
          Inactive ({policies.filter(p => !p.is_active).length})
        </Button>
      </div>

      {/* Policy List */}
      {policies.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-8 text-text-secondary">
            <div className="text-4xl mb-2">📋</div>
            <div>No policies found</div>
            <div className="text-xs mt-1">Create a policy to start blocking threats</div>
          </div>
        </Card>
      ) : (
        policies.map((policy) => (
          <Card key={policy.id} className="p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-text-primary">{policy.name}</h3>
                  <Badge variant={policy.is_active ? 'success' : 'secondary'}>
                    {policy.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {policy.category && (
                    <Badge variant="default">{policy.category}</Badge>
                  )}
                  <Badge variant="default">Priority: {policy.priority}</Badge>
                </div>
                {policy.description && (
                  <p className="text-sm text-text-secondary mb-2">{policy.description}</p>
                )}
                <div className="text-xs text-text-muted mb-3">
                  Type: {policy.policy_type} • Created: {new Date(policy.created_at).toLocaleDateString()}
                </div>
                {policy.translated_dsl && (
                  <div className="bg-bg-primary border border-border-subtle rounded p-3 mt-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                      DSL Rule
                    </div>
                    <pre className="text-xs font-mono text-emerald-500 whitespace-pre-wrap">
                      {policy.translated_dsl}
                    </pre>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <Button
                  variant={policy.is_active ? 'danger' : 'primary'}
                  className="text-sm"
                  onClick={() => handleToggleActive(policy)}
                >
                  {policy.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="secondary"
                  className="text-sm"
                  onClick={() => onEdit && onEdit(policy)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  className="text-sm"
                  onClick={() => handleDelete(policy.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

