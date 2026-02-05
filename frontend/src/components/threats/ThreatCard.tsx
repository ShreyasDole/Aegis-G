'use client';
import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ThreatCardProps {
  id: number;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  firstSeen: string;
  affectedSystems: number;
  riskScore: number;
}

export const ThreatCard: React.FC<ThreatCardProps> = ({
  title,
  description,
  severity,
  source,
  firstSeen,
  affectedSystems,
  riskScore,
}) => {
  const severityConfig = {
    critical: { emoji: '🔴', class: 'threat-card-critical', label: 'CRITICAL' },
    high: { emoji: '🟠', class: 'threat-card-high', label: 'HIGH' },
    medium: { emoji: '🟡', class: 'threat-card-medium', label: 'MEDIUM' },
    low: { emoji: '🟢', class: 'threat-card-low', label: 'LOW' },
  };

  const config = severityConfig[severity];
  const riskPercentage = (riskScore / 10) * 100;

  return (
    <div className={config.class}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <Badge variant={severity} icon={config.emoji}>
          {config.label}
        </Badge>
        <div className="flex gap-2">
          <Button variant="secondary" className="text-xs py-1 px-3">
            View
          </Button>
          <Button variant="secondary" className="text-xs py-1 px-3">
            Dismiss
          </Button>
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold mb-2 text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary mb-4">{description}</p>

      {/* Details */}
      <div className="space-y-2 mb-4 font-mono text-sm">
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="text-text-muted">•</span>
          <span className="text-text-muted">Source:</span>
          <span className="text-text-primary">{source}</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="text-text-muted">•</span>
          <span className="text-text-muted">First seen:</span>
          <span className="text-text-primary">{firstSeen}</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="text-text-muted">•</span>
          <span className="text-text-muted">Affected systems:</span>
          <span className="text-text-primary">{affectedSystems}</span>
        </div>
      </div>

      {/* Risk Score Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-text-muted">Risk Score</span>
          <span className="text-sm font-bold text-text-primary">{riskScore.toFixed(1)}/10</span>
        </div>
        <div className="w-full bg-bg-primary rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              severity === 'critical' ? 'bg-danger' :
              severity === 'high' ? 'bg-warning' :
              severity === 'medium' ? 'bg-yellow-500' : 'bg-success'
            }`}
            style={{ width: `${riskPercentage}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="ai" className="text-xs py-1.5 px-3 flex-1">
          🤖 AI Analysis
        </Button>
        <Button variant="secondary" className="text-xs py-1.5 px-3">
          📊 Details
        </Button>
        <Button variant="secondary" className="text-xs py-1.5 px-3">
          🔗 Graph
        </Button>
      </div>
    </div>
  );
};

