'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function ScansPage() {
  const [manualText, setManualText] = useState('');
  const [liveScans, setLiveScans] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Simulation of WebSocket for live ingestion
  useEffect(() => {
    const mockScanStream = setInterval(() => {
      const newScan = {
        id: Math.random().toString(36).substr(2, 9),
        content: "Suspicious message from external source regarding naval maneuvers...",
        risk: (Math.random() * 1).toFixed(2),
        source: "Browser Extension",
        timestamp: new Date().toLocaleTimeString(),
        type: "AI_GENERATED"
      };
      setLiveScans(prev => [newScan, ...prev].slice(0, 10));
    }, 15000); // New hit every 15 seconds

    return () => clearInterval(mockScanStream);
  }, []);

  const handleManualScan = async () => {
    if (!manualText.trim()) return;
    const mode = typeof window !== 'undefined' ? (localStorage.getItem('inference-mode') || 'cloud') : 'cloud';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setIsScanning(true);
    try {
      const response = await fetch(`/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Inference-Mode': mode,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: manualText }),
      });
      if (!response.ok) throw new Error('Scan failed');
      const result = await response.json();
      setLiveScans(prev => [{
        id: result.content_hash?.slice(0, 9) || Math.random().toString(36).substr(2, 9),
        content: manualText.slice(0, 80) + (manualText.length > 80 ? '...' : ''),
        risk: result.risk_score?.toFixed(2) ?? '0.00',
        source: 'Manual Triage',
        timestamp: new Date().toLocaleTimeString(),
        type: result.is_ai_generated ? 'AI_GENERATED' : 'HUMAN',
      }, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Scan error:', error);
      alert('Forensic scan failed. Ensure the backend is running.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-6 min-h-screen max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-6">
        📥 Ingestion Hub / Incoming Scans
      </h1>

        <div className="grid grid-cols-12 gap-6">
          {/* Manual Entry Column */}
          <div className="col-span-12 lg:col-span-5">
            <Card className="h-full">
              <h2 className="text-xs font-bold text-primary tracking-widest uppercase mb-4">Manual Triage</h2>
              <textarea 
                className="w-full h-48 bg-bg-primary border border-border-subtle p-4 rounded font-sans text-sm focus:border-primary outline-none resize-none mb-4"
                placeholder="Paste suspicious text or chat message here for Agent 1 analysis..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
              />
              <div className="border-2 border-dashed border-border-medium rounded-lg p-6 text-center mb-4 hover:border-primary transition-colors cursor-pointer">
                <span className="text-2xl mb-2 block">🖼️</span>
                <span className="text-xs text-text-muted uppercase font-semibold">Drop image for Vision Scan</span>
              </div>
              <Button variant="primary" className="w-full py-3" onClick={handleManualScan} disabled={isScanning || !manualText.trim()}>
                {isScanning ? 'Scanning...' : 'Execute Forensic Scan'}
              </Button>
            </Card>
          </div>

          {/* Live Stream Column */}
          <div className="col-span-12 lg:col-span-7">
            <Card className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs font-bold text-success tracking-widest uppercase flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                  Live Ingestion Stream
                </h2>
                <Badge variant="info">Source: All</Badge>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin max-h-[500px]">
                {liveScans.length === 0 ? (
                  <div className="text-center py-20 text-text-muted italic">Waiting for incoming external telemetry...</div>
                ) : (
                  liveScans.map((scan) => (
                    <div key={scan.id} className="bg-bg-primary border border-border-subtle p-4 rounded hover:border-primary/50 transition-all group animate-slide-in">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">ID: {scan.id}</span>
                          <span className="text-[10px] font-mono text-text-muted">{scan.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-danger">RISK: {scan.risk}</span>
                          <button className="text-[10px] text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">ESCALATE</button>
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-2 italic mb-2">&quot;{scan.content}&quot;</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-tighter">Via: {scan.source}</span>
                        <Badge variant="secondary">{scan.type}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
      </div>
    </div>
  );
}
