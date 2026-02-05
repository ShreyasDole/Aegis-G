import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { AIManager } from '@/components/ai/AIManager';

export const metadata: Metadata = {
  title: 'Aegis-G Command Center',
  description: 'AI-Powered Cybersecurity Command Center for National Security Operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg-primary text-text-primary">
        <Navbar />
        <main className="pt-16">
          {children}
        </main>
        <AIManager />
      </body>
    </html>
  );
}


