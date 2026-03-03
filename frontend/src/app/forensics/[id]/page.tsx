'use client';
import React from 'react';
import { Card } from '@/components/ui/Card';
import { useParams } from 'next/navigation';

export default function ForensicsDetailPage() {
  const params = useParams();
  const id = params?.id || '';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Forensic Analysis</h1>
          <p className="text-text-secondary mb-4">
            Detail view for analysis #{id} — coming soon.
          </p>
          <p className="text-sm text-text-muted">
            This page will be implemented in a later phase.
          </p>
        </Card>
      </div>
    </div>
  );
}
