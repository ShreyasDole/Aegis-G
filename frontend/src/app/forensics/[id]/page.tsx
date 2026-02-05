'use client';
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useParams } from 'next/navigation';

export default function ForensicsDetailPage() {
  const params = useParams();
  const id = params?.id || '1';

  const forensicData = {
    id: id,
    title: 'APT29 Phishing Campaign Analysis',
    severity: 'critical' as const,
    status: 'investigating',
    createdAt: '2024-02-05 14:23:00',
    analyst: 'Sarah Chen',
    description: 'Detailed forensic analysis of APT29 phishing campaign targeting government agencies',
  };

  const timeline = [
    {
      time: '14:23:00',
      event: 'Threat detected',
      description: 'Malicious email detected by mail filter',
      type: 'detection',
    },
    {
      time: '14:25:30',
      event: 'Initial analysis',
      description: 'Email contains malicious attachment (document.pdf.exe)',
      type: 'analysis',
    },
    {
      time: '14:28:15',
      event: 'C2 communication',
      description: 'Attempted connection to 193.201.45.22:443',
      type: 'network',
    },
    {
      time: '14:30:00',
      event: 'Containment',
      description: 'Blocked IP address and quarantined affected system',
      type: 'response',
    },
    {
      time: '14:35:20',
      event: 'Deep scan',
      description: 'Full system scan initiated, no additional infections found',
      type: 'analysis',
    },
  ];

  const artifacts = [
    {
      name: 'malicious_email.eml',
      type: 'Email',
      hash: 'sha256:a3d4f5...',
      size: '145 KB',
      risk: 'high',
    },
    {
      name: 'document.pdf.exe',
      type: 'Executable',
      hash: 'sha256:7b8c9d...',
      size: '2.3 MB',
      risk: 'critical',
    },
    {
      name: 'network_capture.pcap',
      type: 'Network Capture',
      hash: 'sha256:e1f2g3...',
      size: '512 KB',
      risk: 'medium',
    },
    {
      name: 'system_logs.txt',
      type: 'Logs',
      hash: 'sha256:h4i5j6...',
      size: '89 KB',
      risk: 'low',
    },
  ];

  const indicators = [
    { type: 'IP Address', value: '193.201.45.22', confidence: 'High' },
    { type: 'Domain', value: 'secure-gov-login.xyz', confidence: 'High' },
    { type: 'Email', value: 'admin@gov-security.com', confidence: 'Medium' },
    { type: 'File Hash', value: 'a3d4f5e6b7c8d9...', confidence: 'High' },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold font-display">
                🔍 Forensic Analysis #{id}
              </h1>
              <Badge variant={forensicData.severity}>
                {forensicData.severity.toUpperCase()}
              </Badge>
              <Badge variant="info">{forensicData.status}</Badge>
            </div>
            <p className="text-text-secondary">{forensicData.title}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
              <span>Created: {forensicData.createdAt}</span>
              <span>•</span>
              <span>Analyst: {forensicData.analyst}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon="📥">Export Report</Button>
            <Button variant="ai" icon="🤖">AI Analysis</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">📅 Attack Timeline</h2>
              <div className="space-y-4">
                {timeline.map((item, idx) => {
                  const typeColors = {
                    detection: 'border-warning',
                    analysis: 'border-info',
                    network: 'border-danger',
                    response: 'border-success',
                  };
                  
                  return (
                    <div
                      key={idx}
                      className={`flex gap-4 p-4 bg-bg-primary rounded-lg border-l-4 ${typeColors[item.type as keyof typeof typeColors]}`}
                    >
                      <div className="font-mono text-sm text-text-muted whitespace-nowrap">
                        {item.time}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-text-primary mb-1">
                          {item.event}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Evidence & Artifacts */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">📦 Evidence & Artifacts</h2>
              <div className="space-y-3">
                {artifacts.map((artifact, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-bg-primary rounded-lg hover:bg-bg-tertiary transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary mb-1">
                        {artifact.name}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {artifact.type} • {artifact.size}
                      </div>
                      <div className="text-xs font-mono text-text-muted mt-1">
                        {artifact.hash}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          artifact.risk === 'critical' ? 'critical' :
                          artifact.risk === 'high' ? 'high' :
                          artifact.risk === 'medium' ? 'medium' : 'low'
                        }
                      >
                        {artifact.risk}
                      </Badge>
                      <Button variant="secondary" className="text-xs py-1 px-3">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Network Activity */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">🌐 Network Activity</h2>
              <div className="bg-bg-primary p-4 rounded-lg font-mono text-sm text-text-secondary overflow-x-auto">
                <div className="text-warning mb-2">### Connection Attempts ###</div>
                <div>14:28:15 | OUTBOUND | 192.168.1.105:54321 → 193.201.45.22:443 | BLOCKED</div>
                <div>14:28:16 | DNS      | Query: secure-gov-login.xyz | BLOCKED</div>
                <div>14:28:17 | OUTBOUND | 192.168.1.105:54322 → 45.142.212.61:8080 | BLOCKED</div>
                <div className="text-success mt-2">### All threats contained ###</div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Insights */}
            <Card className="bg-gradient-to-br from-bg-secondary to-purple-950/10 border-secondary/30">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>🤖</span> AI Insights
              </h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-bg-primary/50 rounded">
                  <div className="font-medium text-warning mb-1">⚠️ High Confidence Match</div>
                  <div className="text-text-secondary">
                    Techniques match known APT29 TTPs (MITRE ATT&CK: T1566.001)
                  </div>
                </div>
                <div className="p-3 bg-bg-primary/50 rounded">
                  <div className="font-medium text-info mb-1">💡 Recommendation</div>
                  <div className="text-text-secondary">
                    Review similar emails from past 7 days for additional victims
                  </div>
                </div>
                <div className="p-3 bg-bg-primary/50 rounded">
                  <div className="font-medium text-success mb-1">✅ Good Response</div>
                  <div className="text-text-secondary">
                    Quick containment prevented lateral movement
                  </div>
                </div>
              </div>
              <Button variant="ai" className="w-full mt-4 text-sm">
                Generate Full Report
              </Button>
            </Card>

            {/* Indicators of Compromise */}
            <Card>
              <h3 className="text-lg font-semibold mb-3">🎯 IOCs</h3>
              <div className="space-y-3">
                {indicators.map((ioc, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-muted">{ioc.type}</span>
                      <Badge variant={ioc.confidence === 'High' ? 'high' : 'medium'}>
                        {ioc.confidence}
                      </Badge>
                    </div>
                    <div className="font-mono text-xs text-text-primary bg-bg-primary p-2 rounded break-all">
                      {ioc.value}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="w-full mt-4 text-sm">
                Export IOCs
              </Button>
            </Card>

            {/* Related Threats */}
            <Card>
              <h3 className="text-lg font-semibold mb-3">🔗 Related Threats</h3>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-bg-primary rounded hover:bg-bg-tertiary cursor-pointer transition-colors">
                  <div className="font-medium text-text-primary">APT29 Campaign #847</div>
                  <div className="text-xs text-text-muted">2 days ago</div>
                </div>
                <div className="p-2 bg-bg-primary rounded hover:bg-bg-tertiary cursor-pointer transition-colors">
                  <div className="font-medium text-text-primary">Similar Phishing #923</div>
                  <div className="text-xs text-text-muted">5 days ago</div>
                </div>
                <div className="p-2 bg-bg-primary rounded hover:bg-bg-tertiary cursor-pointer transition-colors">
                  <div className="font-medium text-text-primary">APT29 Infrastructure</div>
                  <div className="text-xs text-text-muted">1 week ago</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
