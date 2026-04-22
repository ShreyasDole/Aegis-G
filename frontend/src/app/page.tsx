"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("Connecting...");
  const [backendData, setBackendData] = useState<any>(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
      return;
    }

    fetch('/api/')
      .then(res => res.json())
      .then(data => {
        setStatus('Connected');
        setBackendData(data);
      })
      .catch(err => {
        setStatus('Connection Failed');
        console.error(err);
      });
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-bg-primary relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Content */}
      <div className="z-10 max-w-4xl w-full text-center mb-12">
        <div className="font-display text-6xl font-bold tracking-wider mb-4 text-primary">
          AEGIS-G
        </div>
        <div className="h-1 w-24 bg-primary mx-auto mb-6"></div>
        <p className="text-xl text-text-primary mb-2">
          AI-Powered Cybersecurity Command Center
        </p>
        <p className="text-text-secondary">
          National Security Operations Platform
        </p>
      </div>

      {/* System Diagnostic Card */}
      <Card className="max-w-2xl w-full z-10 mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-6">
          System Diagnostic
        </h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-bg-primary rounded border-l-2 border-success">
            <span className="text-text-secondary text-sm">Frontend Status:</span>
            <span className="text-success font-semibold flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              Online
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-bg-primary rounded border-l-2 border-l-primary">
            <span className="text-text-secondary text-sm">Backend Connection:</span>
            <span className={`font-semibold flex items-center gap-2 text-sm ${status.includes("Connected") ? "text-success" : "text-danger"}`}>
              <span className={`w-2 h-2 rounded-full ${status.includes("Connected") ? "bg-success animate-pulse" : "bg-danger"}`}></span>
              {status}
            </span>
          </div>

          {backendData && (
            <div className="mt-4 p-4 bg-bg-primary rounded border border-border-subtle">
              <p className="text-xs text-text-muted mb-2 uppercase tracking-wide font-semibold">API Response:</p>
              <pre className="text-success font-mono text-xs overflow-auto scrollbar-thin">
                {JSON.stringify(backendData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 z-10 mb-16">
        <Link href="/login">
          <Button variant="primary" className="text-base px-8 py-3">
            Sign In to Command Center
          </Button>
        </Link>
        <Link href="/api/docs" target="_blank">
          <Button variant="secondary" className="text-base px-8 py-3">
            API Documentation
          </Button>
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full z-10">
        <Card hover className="text-center border-l-4 border-l-primary">
          <div className="text-3xl font-bold text-primary mb-3">AI</div>
          <h3 className="text-base font-semibold mb-2 uppercase tracking-wider">AI-Powered Analysis</h3>
          <p className="text-sm text-text-secondary">
            Advanced threat detection with Gemini AI integration
          </p>
        </Card>
        <Card hover className="text-center border-l-4 border-l-success">
          <div className="text-3xl font-bold text-success mb-3">GRAPH</div>
          <h3 className="text-base font-semibold mb-2 uppercase tracking-wider">Graph Analysis</h3>
          <p className="text-sm text-text-secondary">
            Network visualization with Neo4j graph database
          </p>
        </Card>
        <Card hover className="text-center border-l-4 border-l-warning">
          <div className="text-3xl font-bold text-warning mb-3">CHAIN</div>
          <h3 className="text-base font-semibold mb-2 uppercase tracking-wider">Blockchain Audit</h3>
          <p className="text-sm text-text-secondary">
            Immutable audit trails for compliance and security
          </p>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-text-muted text-sm z-10">
        <p className="font-semibold mb-2">Built for National Security Operations</p>
        <p>FastAPI • Next.js • PostgreSQL • Neo4j • Redis</p>
      </div>
    </main>
  );
}
