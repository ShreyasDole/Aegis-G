'use client';
import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface IntelligenceBriefProps {
  report?: {
    threat_title?: string;
    executive_summary?: string;
    threat_type?: string;
    risk_level?: string;
    confidence?: number;
    evidence?: Array<{ source: string; finding: string; weight: number }>;
    recommendations?: Array<{ action: string; priority: string }>;
  } | null;
  thoughts?: string;
}

export function IntelligenceBrief({ report, thoughts }: IntelligenceBriefProps) {
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
        <Shield className="w-10 h-10 text-[#4b5563]" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium text-[#9ca3af] mb-1">No Analysis Selected</p>
          <p className="text-xs text-[#6b7280]">Select a threat to view intelligence</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (level?: string) => {
    const l = (level || '').toLowerCase();
    if (l === 'critical') return '#ef4444';
    if (l === 'high') return '#f97316';
    if (l === 'medium') return '#ca8a04';
    return '#10b981';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-[#5e6ad2]" />
          <h3 className="text-sm font-semibold text-[#f3f4f6]">{report.threat_title || 'Threat Analysis'}</h3>
        </div>
        <div className="flex items-center gap-2">
          {report.risk_level && (
            <Badge variant={report.risk_level.toLowerCase() as any}>
              {report.risk_level}
            </Badge>
          )}
          {report.threat_type && (
            <span className="text-2xs text-[#6b7280] font-mono">{report.threat_type}</span>
          )}
          {report.confidence !== undefined && (
            <span className="text-2xs text-[#9ca3af]">{(report.confidence * 100).toFixed(0)}% confidence</span>
          )}
        </div>
      </div>

      <div className="divider" />

      {/* Executive Summary */}
      {report.executive_summary && (
        <div>
          <p className="text-2xs uppercase tracking-wider text-[#6b7280] mb-2 font-medium">Executive Summary</p>
          <p className="text-xs text-[#9ca3af] leading-relaxed">{report.executive_summary}</p>
        </div>
      )}

      {/* Evidence */}
      {report.evidence && report.evidence.length > 0 && (
        <>
          <div className="divider" />
          <div>
            <p className="text-2xs uppercase tracking-wider text-[#6b7280] mb-2 font-medium">Evidence</p>
            <div className="space-y-2">
              {report.evidence.map((ev, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#5e6ad2] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#f3f4f6] mb-0.5">{ev.finding}</p>
                    <p className="text-2xs text-[#6b7280] font-mono">{ev.source} • weight: {ev.weight.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <>
          <div className="divider" />
          <div>
            <p className="text-2xs uppercase tracking-wider text-[#6b7280] mb-2 font-medium">Recommendations</p>
            <div className="space-y-1.5">
              {report.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-xs"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <Badge variant={rec.priority.toLowerCase() as any}>{rec.priority}</Badge>
                  <span className="text-[#9ca3af]">{rec.action}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* AI Reasoning */}
      {thoughts && (
        <>
          <div className="divider" />
          <div>
            <p className="text-2xs uppercase tracking-wider text-[#6b7280] mb-2 font-medium">AI Reasoning Log</p>
            <p className="text-2xs text-[#6b7280] font-mono leading-relaxed whitespace-pre-wrap">{thoughts}</p>
          </div>
        </>
      )}
    </div>
  );
}
