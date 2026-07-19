import { useState, useCallback } from 'react';

interface FlowEntry {
  id: string;
  intent: string;
  totalAmount: number;
  status: 'planned' | 'executed' | 'failed';
  createdAt: string;
  executedAt?: string;
  executionResult?: {
    txHashes: string[];
    arcScanLinks: string[];
    gasUsed: number;
    confirmedAt: string;
  };
}

export function useFlowHistory() {
  const [entries, setEntries] = useState<FlowEntry[]>([
    {
      id: '0xabc123def456789',
      intent: 'Send 100 USDC to Alice via Arc Native',
      totalAmount: 100,
      status: 'executed',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      executedAt: new Date(Date.now() - 86400000 + 60000).toISOString()
    },
    {
      id: '0xdef789ghi012345',
      intent: 'Swap 50 USDC to ETH using StableFX',
      totalAmount: 50,
      status: 'executed',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      executedAt: new Date(Date.now() - 172800000 + 120000).toISOString()
    }
  ]);

  const addEntry = useCallback((entry: FlowEntry) => {
    setEntries(prev => [entry, ...prev]);
  }, []);

  const updateEntry = useCallback((id: string, updates: Partial<FlowEntry>) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
  }, []);

  const totalExecuted = useCallback(() => {
    return entries.filter(e => e.status === 'executed').length;
  }, [entries]);

  const totalVolumeUsdc = useCallback(() => {
    return entries
      .filter(e => e.status === 'executed')
      .reduce((sum, e) => sum + e.totalAmount, 0);
  }, [entries]);

  return {
    entries,
    addEntry,
    updateEntry,
    totalExecuted,
    totalVolumeUsdc
  };
}
