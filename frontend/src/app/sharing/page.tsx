'use client';
import React from 'react';
import { Card } from '@/components/ui/Card';

export default function SharingPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="text-center py-16">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold mb-2">Intelligence Sharing</h1>
          <p className="text-text-secondary mb-4">
            Share threat intelligence with partner agencies — coming soon.
          </p>
          <p className="text-sm text-text-muted">
            This page will be implemented in a later phase.
          </p>
        </Card>
      </div>
    </div>
  );
}
