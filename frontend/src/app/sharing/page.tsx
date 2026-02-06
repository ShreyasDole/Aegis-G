'use client';
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function SharingPage() {
  const [selectedReports, setSelectedReports] = useState<Set<number>>(new Set());

  const reports: any[] = [];

  const sharedWith: any[] = [];

  const toggleReport = (id: number) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedReports(newSelected);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display text-glow-blue mb-2">
            🔗 Intelligence Sharing
          </h1>
          <p className="text-text-secondary">
            Securely share threat intelligence with partner agencies via blockchain
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card hover className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{reports.filter(r => r.status === 'shared').length}</div>
                <div className="text-sm text-text-secondary">Shared Reports</div>
              </Card>
              <Card hover className="text-center">
                <div className="text-3xl font-bold text-success mb-1">{sharedWith.length}</div>
                <div className="text-sm text-text-secondary">Partner Agencies</div>
              </Card>
              <Card hover className="text-center">
                <div className="text-3xl font-bold text-warning mb-1">{sharedWith.length > 0 ? Math.round((sharedWith.filter(p => p.status === 'verified').length / sharedWith.length) * 100) : 0}%</div>
                <div className="text-sm text-text-secondary">Verified</div>
              </Card>
            </div>

            {/* Reports List */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">📋 Reports</h2>
                <Button
                  variant="primary"
                  disabled={selectedReports.size === 0}
                  className="text-sm"
                  onClick={() => console.log('Share Selected clicked', Array.from(selectedReports))}
                >
                  Share Selected ({selectedReports.size})
                </Button>
              </div>

              <div className="space-y-3">
                {reports.length === 0 ? (
                  <div className="text-center py-12 text-text-secondary">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold mb-2">No reports available</h3>
                    <p className="text-sm">No reports to share at this time</p>
                  </div>
                ) : (
                  reports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedReports.has(report.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border-subtle bg-bg-primary hover:bg-bg-tertiary'
                    }`}
                    onClick={() => toggleReport(report.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedReports.has(report.id)}
                        onChange={() => {}}
                        className="mt-1 w-5 h-5 rounded border-border-medium bg-bg-primary checked:bg-primary"
                      />

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-text-primary">
                            {report.title}
                          </h3>
                          <Badge variant={report.severity}>
                            {report.severity}
                          </Badge>
                          <Badge variant={report.status === 'shared' ? 'info' : 'low'}>
                            {report.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-text-secondary mb-2">
                          Created: {report.date}
                        </div>
                        {report.recipients.length > 0 && (
                          <div className="text-sm text-text-muted">
                            Shared with: {report.recipients.join(', ')}
                          </div>
                        )}
                        <div className="text-xs font-mono text-text-muted mt-2">
                          Blockchain Hash: {report.hash}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => console.log('View report clicked', report.id)}>
                          View
                        </Button>
                        {report.status === 'shared' && (
                          <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => console.log('Verify report clicked', report.id)}>
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </Card>

            {/* Blockchain Info */}
            <Card className="bg-gradient-to-br from-bg-secondary to-blue-950/10 border-primary/30">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>🔗</span> Blockchain Audit Trail
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Blocks:</span>
                  <span className="font-mono text-text-primary">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Last Block:</span>
                  <span className="font-mono text-text-primary">N/A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Chain Integrity:</span>
                  <span className="text-text-muted font-semibold">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Last Updated:</span>
                  <span className="text-text-primary">Never</span>
                </div>
              </div>
              <Button variant="secondary" className="w-full mt-4 text-sm" onClick={() => console.log('View Full Chain clicked')}>
                View Full Chain →
              </Button>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Share New Report */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">📤 Share New Report</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Report ID or Title"
                  icon={<span>🔍</span>}
                />
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Share With
                  </label>
                  <select className="input w-full text-sm">
                    <option>FBI Cyber Division</option>
                    <option>CISA</option>
                    <option>NSA</option>
                    <option>DHS</option>
                    <option>All Partners</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Classification
                  </label>
                  <select className="input w-full text-sm">
                    <option>UNCLASSIFIED</option>
                    <option>CONFIDENTIAL</option>
                    <option>SECRET</option>
                    <option>TOP SECRET</option>
                  </select>
                </div>
                <Button variant="primary" className="w-full" onClick={() => console.log('Share Securely clicked')}>
                  🔒 Share Securely
                </Button>
              </div>
            </Card>

            {/* Partner Agencies */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">🤝 Partner Agencies</h3>
              <div className="space-y-3">
                {sharedWith.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary text-sm">
                    No partner agencies configured
                  </div>
                ) : (
                  sharedWith.map((partner, idx) => (
                  <div key={idx} className="p-3 bg-bg-primary rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-text-primary text-sm">
                        {partner.name}
                      </span>
                      <Badge
                        variant={partner.status === 'verified' ? 'info' : 'medium'}
                      >
                        {partner.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-text-muted">
                      Last sync: {partner.lastSync}
                    </div>
                  </div>
                  ))
                )}
              </div>
              <Button variant="secondary" className="w-full mt-4 text-sm" onClick={() => console.log('Manage Partners clicked')}>
                Manage Partners
              </Button>
            </Card>

            {/* Security Notice */}
            <Card className="bg-warning/10 border-warning/30">
              <div className="flex items-start gap-2">
                <span className="text-xl">🔐</span>
                <div className="text-xs text-text-secondary">
                  <div className="font-semibold text-warning mb-1">
                    ENCRYPTION ENABLED
                  </div>
                  <div>
                    All shared intelligence is encrypted end-to-end and recorded on an immutable blockchain ledger.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
