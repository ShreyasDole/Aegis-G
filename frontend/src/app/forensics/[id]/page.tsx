'use client';
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useParams } from 'next/navigation';

export default function ForensicsDetailPage() {
  const params = useParams();
  const id = params?.id || '1';

  const [forensicData] = useState<any>(null);
  const [timeline] = useState<any[]>([]);
  const [artifacts] = useState<any[]>([]);
  const [indicators] = useState<any[]>([]);
  const [relatedThreats] = useState<any[]>([]);

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
              {forensicData && (
                <>
                  <Badge variant={forensicData.severity}>
                    {forensicData.severity.toUpperCase()}
                  </Badge>
                  <Badge variant="info">{forensicData.status}</Badge>
                </>
              )}
            </div>
            {forensicData ? (
              <>
                <p className="text-text-secondary">{forensicData.title}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                  <span>Created: {forensicData.createdAt}</span>
                  <span>•</span>
                  <span>Analyst: {forensicData.analyst}</span>
                </div>
              </>
            ) : (
              <p className="text-text-secondary">No forensic data available for this analysis</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon="📥" onClick={() => console.log('Export Report clicked', id)}>Export Report</Button>
            <Button variant="ai" icon="🤖" onClick={() => console.log('AI Analysis clicked', id)}>AI Analysis</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">📅 Attack Timeline</h2>
              <div className="space-y-4">
                {timeline.length === 0 ? (
                  <div className="text-center py-12 text-text-secondary">
                    <div className="text-4xl mb-4">📅</div>
                    <h3 className="text-lg font-semibold mb-2">No timeline data available</h3>
                    <p className="text-sm">Timeline events will appear here when available</p>
                  </div>
                ) : (
                  timeline.map((item, idx) => {
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
                  })
                )}
              </div>
            </Card>

            {/* Evidence & Artifacts */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">📦 Evidence & Artifacts</h2>
              <div className="space-y-3">
                {artifacts.length === 0 ? (
                  <div className="text-center py-12 text-text-secondary">
                    <div className="text-4xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold mb-2">No artifacts available</h3>
                    <p className="text-sm">Evidence and artifacts will appear here when available</p>
                  </div>
                ) : (
                  artifacts.map((artifact, idx) => (
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
                      <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => console.log('Download artifact clicked', artifact.name)}>
                        Download
                      </Button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </Card>

            {/* Network Activity */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">🌐 Network Activity</h2>
              <div className="bg-bg-primary p-4 rounded-lg font-mono text-sm text-text-secondary overflow-x-auto">
                {timeline.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    No network activity data available
                  </div>
                ) : (
                  <div className="text-text-muted">Network activity will appear here when available</div>
                )}
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
                {forensicData ? (
                  <div className="text-text-secondary text-center py-8">
                    AI insights will appear here when analysis is available
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-secondary">
                    <div className="text-4xl mb-4">🤖</div>
                    <h3 className="text-lg font-semibold mb-2">No AI insights available</h3>
                    <p className="text-sm">AI analysis will appear here when available</p>
                  </div>
                )}
              </div>
              <Button variant="ai" className="w-full mt-4 text-sm" onClick={() => console.log('Generate Full Report clicked', id)}>
                Generate Full Report
              </Button>
            </Card>

            {/* Indicators of Compromise */}
            <Card>
              <h3 className="text-lg font-semibold mb-3">🎯 IOCs</h3>
              <div className="space-y-3">
                {indicators.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-lg font-semibold mb-2">No IOCs available</h3>
                    <p className="text-sm">Indicators of compromise will appear here when available</p>
                  </div>
                ) : (
                  indicators.map((ioc, idx) => (
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
                  ))
                )}
              </div>
              <Button variant="secondary" className="w-full mt-4 text-sm" onClick={() => console.log('Export IOCs clicked', id)}>
                Export IOCs
              </Button>
            </Card>

            {/* Related Threats */}
            <Card>
              <h3 className="text-lg font-semibold mb-3">🔗 Related Threats</h3>
              <div className="space-y-2 text-sm">
                {relatedThreats.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    <div className="text-4xl mb-4">🔗</div>
                    <h3 className="text-lg font-semibold mb-2">No related threats</h3>
                    <p className="text-sm">Related threats will appear here when available</p>
                  </div>
                ) : (
                  relatedThreats.map((threat, idx) => (
                    <div 
                      key={idx}
                      className="p-2 bg-bg-primary rounded hover:bg-bg-tertiary cursor-pointer transition-colors"
                      onClick={() => console.log('Related threat clicked', threat)}
                    >
                      <div className="font-medium text-text-primary">{threat.title || `Threat #${threat.id}`}</div>
                      <div className="text-xs text-text-muted">{threat.date || 'Unknown date'}</div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
