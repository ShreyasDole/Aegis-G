import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ClientLayout } from '@/components/layout/ClientLayout';

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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg-base text-white/60" suppressHydrationWarning>
        {process.env.NODE_ENV === 'development' && (
          <Script src="/dev-extension-shim.js" strategy="beforeInteractive" />
        )}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}


