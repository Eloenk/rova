import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
export const dynamic = 'force-dynamic';
import { Web3Providers } from '@/app/providers';
import AppShell from '@/components/AppShell';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Rova — AI-Powered Money Movement on Arc',
  description: 'Send, bridge, and swap stablecoins on Arc using plain English. Powered by Circle Wallets, Claude AI, StableFX, CCTP V2, and App Kits.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Web3Providers>
          <GlobalErrorBoundary>
            <AppShell>
              {children}
            </AppShell>
          </GlobalErrorBoundary>
        </Web3Providers>
      </body>
    </html>
  );
}
