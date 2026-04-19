'use client';
import React from 'react';
import { CampaignView } from '@/components/visual/CampaignView';

export default function CampaignPage() {
  return (
    <div className="p-6 min-h-screen max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
          Campaign View
        </h1>
        <p className="text-text-secondary text-sm">
          Propagation: source → botnet → targets. Clusters from /api/network/clusters.
        </p>
      </div>
      <CampaignView />
    </div>
  );
}
