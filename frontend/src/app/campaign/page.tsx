'use client';
import React from 'react';
import { CampaignView } from '@/components/visual/CampaignView';

export default function CampaignPage() {
  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-y-auto">
      <div className="w-full flex-shrink-0 mb-2">
        <h1 className="text-3xl font-space font-bold tracking-wider uppercase text-neon-cyan drop-shadow-[0_0_10px_rgba(0,183,255,0.5)]">
          Disinformation Campaign Tracking
        </h1>
        <p className="text-text-muted mt-2 font-space text-sm tracking-wider uppercase">
          AGENT_2 // TEMPORAL_GRAPH // Propagation: source → botnet → targets (Clusters from /api/network/clusters)
        </p>
      </div>
      <div className="flex-1 min-h-[600px] w-full bg-black/40 border border-neon-cyan/20 rounded-lg overflow-hidden relative shadow-[0_0_15px_rgba(0,183,255,0.05)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan/0 via-neon-cyan/50 to-neon-cyan/0"></div>
        <CampaignView />
      </div>
    </div>
  );
}
