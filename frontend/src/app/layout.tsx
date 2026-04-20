import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'AEGIS-G — Modern Enterprise Security',
  description: 'Enterprise security operations dashboard with AI and graph intelligence',
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


