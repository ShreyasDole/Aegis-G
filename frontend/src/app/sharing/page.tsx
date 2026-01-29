/**
 * Intel Exchange Portal
 * Secure sharing with allied agencies
 */
'use client';

import { useState } from 'react';

export default function SharingPage() {
  const [reportId, setReportId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [redactPII, setRedactPII] = useState(true);
  const [result, setResult] = useState<any>(null);

  const handleShare = async () => {
    if (!reportId || !recipient) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`/api/federated/share/${reportId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_agency: recipient,
          redact_pii: redactPII
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Sharing failed:', error);
      alert('Sharing failed. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🔐 Intelligence Sharing Portal</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Report ID</label>
          <input
            type="number"
            value={reportId}
            onChange={(e) => setReportId(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            placeholder="Enter threat report ID"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Recipient Agency</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            placeholder="Allied agency name"
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={redactPII}
              onChange={(e) => setRedactPII(e.target.checked)}
              className="mr-2"
            />
            Redact PII before sharing
          </label>
        </div>

        <button
          onClick={handleShare}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Share Intelligence
        </button>

        {result && (
          <div className="mt-6 p-4 bg-green-100 rounded">
            <h3 className="font-semibold mb-2">Sharing Successful</h3>
            <p>Ledger Hash: {result.ledger_hash}</p>
            <p>Status: {result.status}</p>
            <p>PII Redacted: {result.pii_redacted ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

