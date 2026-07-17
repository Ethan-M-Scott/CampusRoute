import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { AppStateProvider } from '../components/AppStateContext';
import ModalDialog from '../components/ModalDialog';

const inter = Inter({ subsets: ['latin'] });

// Root layout that wraps every page with shared app state and auth modals.
export const metadata: Metadata = {
  title: 'My Campus Route - Campus Traffic Monitoring',
  description:
    'Real-time campus route planning, traffic tracking, bus updates, and alerts for My Campus Route.',
  openGraph: {
    title: 'My Campus Route - Campus Traffic Monitoring',
    description:
      'Real-time campus route planning, traffic tracking, bus updates, and alerts for My Campus Route.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Campus Route - Campus Traffic Monitoring',
    description:
      'Real-time campus route planning, traffic tracking, bus updates, and alerts for My Campus Route.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppStateProvider>
          {children}
          <Suspense fallback={null}>
            <ModalDialog />
          </Suspense>
        </AppStateProvider>
      </body>
    </html>
  );
}
