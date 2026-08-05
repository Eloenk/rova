'use client';
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';
import type { FlowEntry } from '@/lib/types';

// ─── Per-wallet storage key ──────────────────────────────────────────────────
// Each wallet address gets its own isolated history.
// Unconnected users see an empty slate — never someone else's data.
const LEGACY_KEY = 'rova_history_v2'; // cleaned up on first load

function storageKey(address?: string | null) {
  if (!address) return null; // no wallet = no storage
  return `rova_history_v3_${address.toLowerCase()}`;
}

// Only store safe, primitive fields — never the full FlowPlan object.
type SafeEntry = Omit<FlowEntry, 'plan' | 'executionResult'> & {
  planSummary: { totalAmount: number; risk: string; splits: number; strategy: string };
  txParams?: { hash: string; link: string };
};

interface FlowHistoryContextType {
  entries: FlowEntry[];
  addEntry: (entry: FlowEntry) => void;
  updateEntry: (id: string, patch: Partial<FlowEntry>) => void;
  totalExecuted: () => number;
  totalVolumeUsdc: () => number;
  clearHistory: () => void;
}

const FlowHistoryContext = createContext<FlowHistoryContextType | undefined>(undefined);

function toSafeEntry(e: FlowEntry): SafeEntry {
  return {
    id:          String(e.id || ''),
    intent:      String(e.intent || ''),
    status:      e.status,
    createdAt:   String(e.createdAt || new Date().toISOString()),
    executedAt:  e.executedAt,
    totalAmount: Number(e.totalAmount) || 0,
    risk:        e.risk,
    processingMs: e.processingMs,
    reputation:   e.reputation,
    planSummary: {
      totalAmount: Number(e.plan?.totalAmount) || 0,
      risk:        String(e.plan?.risk || 'low'),
      splits:      Number(e.plan?.splits?.length) || 0,
      strategy:    String(e.plan?.strategy || 'Arc Native'),
    },
    txParams: e.executionResult?.txHashes?.[0] ? {
      hash: e.executionResult.txHashes[0],
      link: (e.executionResult as any).arcScanLinks?.[0] ?? '',
    } : undefined,
  };
}

function rebuildEntry(e: SafeEntry): FlowEntry {
  return {
    ...e,
    plan: {
      splits: [], routes: [], gasEstimate: { totalTxCount: 1, totalGasUsdc: 0.006 },
      reasoning: '', confidence: 100, risk: (e.planSummary?.risk as any) || 'low',
      reserveAmount: 0, totalAmount: e.planSummary?.totalAmount || 0,
      strategy: e.planSummary?.strategy || '',
    },
    executionResult: e.txParams ? {
      txHashes: [e.txParams.hash],
      arcScanLinks: [e.txParams.link],
      gasUsed: 0.006,
      confirmedAt: e.executedAt || new Date().toISOString(),
    } : null,
  };
}

export function FlowHistoryProvider({ children }: { children: ReactNode }) {
  const { address } = useWallet();
  const [entries, setEntries] = useState<FlowEntry[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // ── Clear legacy global storage on first run ─────────────────────────────
  useEffect(() => {
    try { localStorage.removeItem(LEGACY_KEY); } catch {}
  }, []);

  // ── Load wallet-scoped history whenever address changes ──────────────────
  useEffect(() => {
    const key = storageKey(address);

    if (!key) {
      // No wallet connected — show empty slate
      setEntries([]);
      setLoadedFor(null);
      return;
    }

    if (loadedFor === address) return; // already loaded for this wallet

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed: SafeEntry[] = JSON.parse(saved);
        setEntries(parsed.map(rebuildEntry));
      } else {
        setEntries([]); // fresh wallet — empty history
      }
      setLoadedFor(address ?? null);
    } catch {
      console.error('[Rova] History corrupted. Starting fresh for this wallet.');
      localStorage.removeItem(key);
      setEntries([]);
      setLoadedFor(address ?? null);
    }
  }, [address, loadedFor]);

  // ── Persist only when we have a connected wallet ─────────────────────────
  useEffect(() => {
    const key = storageKey(address);
    if (!key || loadedFor !== address) return; // don't persist during wallet switch
    try {
      localStorage.setItem(key, JSON.stringify(entries.map(toSafeEntry)));
    } catch {
      console.error('[Rova] Failed to persist history.');
    }
  }, [entries, address, loadedFor]);

  const addEntry = useCallback((entry: FlowEntry) => {
    setEntries(prev => [entry, ...prev.slice(0, 49)]);
  }, []);

  const updateEntry = useCallback((id: string, patch: Partial<FlowEntry>) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const totalExecuted = useCallback(() =>
    entries.filter(e => e.status === 'executed').length, [entries]);

  const totalVolumeUsdc = useCallback(() =>
    entries
      .filter(e => e.status === 'executed' && e.totalAmount)
      .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0),
    [entries]);

  return (
    <FlowHistoryContext.Provider value={{ entries, addEntry, updateEntry, totalExecuted, totalVolumeUsdc, clearHistory: () => setEntries([]) }}>
      {children}
    </FlowHistoryContext.Provider>
  );
}

export function useFlowHistory() {
  const context = useContext(FlowHistoryContext);
  if (context === undefined) {
    throw new Error('useFlowHistory must be used within a FlowHistoryProvider');
  }
  return context;
}
