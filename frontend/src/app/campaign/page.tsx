'use client';
import React from 'react';
import { CampaignView } from '@/components/visual/CampaignView';

export default function CampaignPage() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 32px)' }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', minHeight: '44px' }}>
        <p className="text-xs text-[#6b7280]">Propagation: source → botnet → targets · Clusters from /api/network/clusters</p>
      </div>
      <div className="flex-1 p-4">
        <div className="card p-0 overflow-hidden h-full">
          <CampaignView />
        </div>
      </div>
    </div>
  );
}
