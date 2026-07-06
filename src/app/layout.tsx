import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { AppStateProvider } from '../components/AppStateContext';
import ModalDialog from '../components/ModalDialog';

const inter = Inter({ subsets: ['latin'] });

// Root layout that wraps every page with shared app state and auth modals.
export const metadata: Metadata = {
  title: 'My Campus Route - UGA Traffic Monitoring',
  description:
    'Real-time traffic analysis around UGA campus. Plan routes, avoid congestion, track buses, get alerts with My Campus Route.',
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
          <ModalDialog />
        </AppStateProvider>
      </body>
    </html>
  );
}
