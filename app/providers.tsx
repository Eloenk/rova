'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';

import { FlowHistoryProvider } from '@/hooks/flowHistoryStore';
import { Erc8183Provider } from '@/hooks/erc8183Store';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: 2 } } });

export function Web3Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <QueryClientProvider client={qc}>
      <FlowHistoryProvider>
        <Erc8183Provider>
          <div style={{ visibility: mounted ? 'visible' : 'hidden', height: '100%' }}>
            {children}
          </div>
        </Erc8183Provider>
      </FlowHistoryProvider>
    </QueryClientProvider>
  );
}
