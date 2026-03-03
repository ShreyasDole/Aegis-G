'use client';
import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ThreatCardProps {
  id: number;
  title: string;
  description: string;
  content?: string; // Full content for AI analysis (when different from truncated description)
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  firstSeen: string;
  affectedSystems: number;
  riskScore: number;
  onAnalyze?: (id: number, content: string) => void;
  onExportSTIX?: (id: number) => void;
}

export const ThreatCard: React.FC<ThreatCardProps> = ({
  id,
  title,
  description,
  content,
  severity,
  source,
  firstSeen,
  affectedSystems,
  riskScore,
  onAnalyze,
  onExportSTIX,
}) => {
  const severityConfig = {
    critical: { class: 'threat-card-critical', label: 'CRITICAL' },
    high: { class: 'threat-card-high', label: 'HIGH' },
    medium: { class: 'threat-card-medium', label: 'MEDIUM' },
    low: { class: 'threat-card-low', label: 'LOW' },
  };

  const config = severityConfig[severity];
  const riskPercentage = (riskScore / 10) * 100;

  return (
    <div className={config.class}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <Badge variant={severity}>
          {config.label}
        </Badge>
        <div className="flex gap-2">
          <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => console.log('View Details clicked', id)}>
            View Details
          </Button>
          <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => onExportSTIX?.(id)}>
            Export STIX
          </Button>
          <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => console.log('Dismiss clicked', id)}>
            Dismiss
          </Button>
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold mb-2 text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary mb-4">{description}</p>

      {/* Details */}
      <div className="space-y-2 mb-4 font-mono text-sm border-t border-border-subtle pt-3">
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-text-muted">Source IP:</span>
          <span className="text-text-primary">{source}</span>
        </div>
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-text-muted">First Detected:</span>
          <span className="text-text-primary">{firstSeen}</span>
        </div>
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-text-muted">Affected Systems:</span>
          <span className="text-text-primary">{affectedSystems}</span>
        </div>
      </div>

      {/* Risk Score Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Risk Score</span>
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
      <div className="flex gap-2 pt-3 border-t border-border-subtle">
        <Button
          variant="ai"
          className="text-xs py-1.5 px-3 flex-1"
          onClick={() => onAnalyze?.(id, content ?? description)}
        >
          AI Analysis
        </Button>
        <Button variant="secondary" className="text-xs py-1.5 px-3" onClick={() => console.log('Graph View clicked', id)}>
          Graph View
        </Button>
        <Button variant="secondary" className="text-xs py-1.5 px-3" onClick={() => console.log('Forensics clicked', id)}>
          Forensics
        </Button>
      </div>
    </div>
  );
};

