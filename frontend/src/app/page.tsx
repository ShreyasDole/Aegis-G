"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

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
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-bg-primary relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Content */}
      <div className="z-10 max-w-4xl w-full text-center mb-12">
        <div className="text-6xl mb-4 animate-pulse-slow">🛡️</div>
        <h1 className="text-6xl font-bold font-display mb-4 text-glow-blue">
          AEGIS-G
        </h1>
        <p className="text-2xl text-text-secondary mb-2">
          AI-Powered Cybersecurity Command Center
        </p>
        <p className="text-lg text-text-muted">
          National Security Operations Platform
        </p>
      </div>

      {/* System Diagnostic Card */}
      <div className="card max-w-2xl w-full z-10 mb-8">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <span>⚙️</span> System Diagnostic
        </h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-bg-primary rounded">
            <span className="text-text-secondary">Frontend Status:</span>
            <span className="text-success font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              Online
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-bg-primary rounded">
            <span className="text-text-secondary">Backend Connection:</span>
            <span className={`font-semibold flex items-center gap-2 ${status.includes("Connected") ? "text-success" : "text-danger"}`}>
              <span className={`w-2 h-2 rounded-full ${status.includes("Connected") ? "bg-success animate-pulse" : "bg-danger"}`}></span>
              {status}
            </span>
          </div>

          {backendData && (
            <div className="mt-4 p-4 bg-bg-primary rounded border border-border-subtle">
              <p className="text-xs text-text-muted mb-2 uppercase tracking-wide">API Response:</p>
              <pre className="text-success font-mono text-xs overflow-auto scrollbar-thin">
                {JSON.stringify(backendData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 z-10">
        <Link href="/dashboard">
          <Button variant="primary" className="text-lg px-8 py-3">
            Enter Command Center →
          </Button>
        </Link>
        <Link href="http://localhost:8000/docs" target="_blank">
          <Button variant="secondary" className="text-lg px-8 py-3">
            📚 API Docs
          </Button>
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full z-10 mt-16">
        <div className="card-hover text-center">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
          <p className="text-sm text-text-secondary">
            Advanced threat detection with Gemini AI integration
          </p>
        </div>
        <div className="card-hover text-center">
          <div className="text-4xl mb-3">🕸️</div>
          <h3 className="text-lg font-semibold mb-2">Graph Analysis</h3>
          <p className="text-sm text-text-secondary">
            Network visualization with Neo4j graph database
          </p>
        </div>
        <div className="card-hover text-center">
          <div className="text-4xl mb-3">🔗</div>
          <h3 className="text-lg font-semibold mb-2">Blockchain Audit</h3>
          <p className="text-sm text-text-secondary">
            Immutable audit trails for compliance and security
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-text-muted text-sm z-10">
        <p>Built for National Security Operations</p>
        <p className="mt-2">FastAPI • Next.js • PostgreSQL • Neo4j • Redis</p>
      </div>
    </main>
  );
}

