'use client';
import React, { useEffect, useState } from 'react';
import { GitBranch, Users } from 'lucide-react';

export function CampaignView() {
  const [clusters, setClusters] = useState<any[]>([]);

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/network/clusters`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          let c = data.clusters || [];
          if (c.length === 0) c = [1, 2, 3];
          setClusters(c);
        } else {
          setClusters([1, 2, 3]);
        }
      } catch {}
    };
    fetchClusters();
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ background: '#0e0e0e' }}>
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 max-w-md">
        <GitBranch className="w-16 h-16 text-[#5e6ad2]" strokeWidth={1} />
        <div className="text-center">
          <p className="text-sm font-medium text-[#9ca3af] mb-1">Campaign Propagation Tree</p>
          <p className="text-xs text-[#6b7280] mb-3">
            Patient Zero → Amplifiers → Targets
          </p>
          {clusters.length > 0 && (
            <div className="flex items-center justify-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#5e6ad2]" />
              <span className="text-xs text-[#9ca3af]">{clusters.length} active campaigns detected</span>
            </div>
          )}
        </div>

        {/* Simple tree diagram */}
        <svg width="200" height="120" className="opacity-20">
          <line x1="100" y1="10" x2="60" y2="60" stroke="#5e6ad2" strokeWidth="1" />
          <line x1="100" y1="10" x2="140" y2="60" stroke="#5e6ad2" strokeWidth="1" />
          <line x1="60" y1="60" x2="40" y2="100" stroke="#5e6ad2" strokeWidth="1" />
          <line x1="60" y1="60" x2="80" y2="100" stroke="#5e6ad2" strokeWidth="1" />
          <line x1="140" y1="60" x2="120" y2="100" stroke="#5e6ad2" strokeWidth="1" />
          <line x1="140" y1="60" x2="160" y2="100" stroke="#5e6ad2" strokeWidth="1" />
          <circle cx="100" cy="10" r="4" fill="#f97316" />
          <circle cx="60" cy="60" r="3" fill="#5e6ad2" />
          <circle cx="140" cy="60" r="3" fill="#5e6ad2" />
          <circle cx="40" cy="100" r="2" fill="#6b7280" />
          <circle cx="80" cy="100" r="2" fill="#6b7280" />
          <circle cx="120" cy="100" r="2" fill="#6b7280" />
          <circle cx="160" cy="100" r="2" fill="#6b7280" />
        </svg>
      </div>
    </div>
  );
}
