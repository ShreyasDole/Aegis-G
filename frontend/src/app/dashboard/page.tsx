/**
 * Main Threat Heatmap Dashboard
 * Aegis-G Command Center
 */
'use client';

import { ThreatMap } from '@/components/visual/ThreatMap';
import { ThreatContext } from '@/context/ThreatContext';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [threats, setThreats] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  useEffect(() => {
    // Fetch threat data from API
    fetch('/api/scan')
      .then(res => res.json())
      .then(data => {
        setThreats(data);
        // Calculate stats
        const critical = data.filter((t: any) => t.risk_score > 0.8).length;
        const high = data.filter((t: any) => t.risk_score > 0.6 && t.risk_score <= 0.8).length;
        const medium = data.filter((t: any) => t.risk_score > 0.4 && t.risk_score <= 0.6).length;
        const low = data.filter((t: any) => t.risk_score <= 0.4).length;
        
        setStats({
          total: data.length,
          critical,
          high,
          medium,
          low
        });
      })
      .catch(err => console.error('Failed to fetch threats:', err));
  }, []);

  return (
    <ThreatContext.Provider value={{ threats, stats }}>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">🛡️ Aegis-G Command Dashboard</h1>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-red-100 p-4 rounded">
            <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
            <div className="text-sm text-red-600">Critical Threats</div>
          </div>
          <div className="bg-orange-100 p-4 rounded">
            <div className="text-2xl font-bold text-orange-700">{stats.high}</div>
            <div className="text-sm text-orange-600">High Risk</div>
          </div>
          <div className="bg-yellow-100 p-4 rounded">
            <div className="text-2xl font-bold text-yellow-700">{stats.medium}</div>
            <div className="text-sm text-yellow-600">Medium Risk</div>
          </div>
          <div className="bg-green-100 p-4 rounded">
            <div className="text-2xl font-bold text-green-700">{stats.low}</div>
            <div className="text-sm text-green-600">Low Risk</div>
          </div>
        </div>

        <ThreatMap threats={threats} />
      </div>
    </ThreatContext.Provider>
  );
}

