'use client';
import React from 'react';
import { Network } from 'lucide-react';

export default function CampaignPage() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 32px)' }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', minHeight: '44px' }}>
        <p className="text-xs text-[#6b7280]">Propagation: source → botnet → targets · Clusters from /api/network/clusters</p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Network className="w-12 h-12 text-[#4b5563] mx-auto mb-3" />
          <p className="text-sm text-[#6b7280]">Campaign propagation tree</p>
          <p className="text-xs text-[#4b5563] mt-1">Patient Zero → Amplifiers → Targets</p>
        </div>
      </div>
    </div>
  );
}
