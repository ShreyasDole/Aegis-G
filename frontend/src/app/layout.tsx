import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';

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
        <AuthGuard>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthGuard>
      </body>
    </html>
  );
}


