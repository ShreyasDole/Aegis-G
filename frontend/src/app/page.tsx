"use client";
import { useEffect, useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState<string>("Connecting...");
  const [backendData, setBackendData] = useState<any>(null);

  useEffect(() => {
    // Attempt to hit the backend
    fetch('http://localhost:8000/')
      .then(res => res.json())
      .then(data => {
        setStatus("Connected ✅");
        setBackendData(data);
      })
      .catch(err => {
        setStatus("Connection Failed ❌");
        console.error(err);
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Aegis-G Command Center</h1>
      </div>

      <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
        <h2 className="text-2xl mb-4">System Diagnostic</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between w-96">
            <span>Frontend Status:</span>
            <span className="text-green-400">Online</span>
          </div>
          
          <div className="flex justify-between w-96">
            <span>Backend Connection:</span>
            <span className={status.includes("Connected") ? "text-green-400" : "text-red-400"}>
              {status}
            </span>
          </div>

          <div className="mt-4 p-4 bg-black rounded">
            <p className="text-xs text-slate-400 mb-2">RAW API RESPONSE:</p>
            <pre className="text-green-500">
              {JSON.stringify(backendData, null, 2) || "Waiting for signal..."}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}

