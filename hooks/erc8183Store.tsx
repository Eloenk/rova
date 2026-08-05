'use client';
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';
import type { FlowJob } from '@/lib/types';

// Wallet-scoped ERC-8183 job history, same isolation pattern as flowHistoryStore.tsx —
// each wallet only ever sees its own jobs, unconnected users see an empty slate.
function storageKey(address?: string | null) {
  if (!address) return null;
  return `rova_erc8183_jobs_v1_${address.toLowerCase()}`;
}

interface Erc8183ContextType {
  jobs: FlowJob[];
  addJob: (job: FlowJob) => void;
  updateJob: (id: string, patch: Partial<FlowJob>) => void;
  clearJobs: () => void;
}

const Erc8183Context = createContext<Erc8183ContextType | undefined>(undefined);

export function Erc8183Provider({ children }: { children: ReactNode }) {
  const { address } = useWallet();
  const [jobs, setJobs] = useState<FlowJob[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    const key = storageKey(address);
    if (!key) { setJobs([]); setLoadedFor(null); return; }
    if (loadedFor === address) return;

    try {
      const saved = localStorage.getItem(key);
      setJobs(saved ? JSON.parse(saved) : []);
      setLoadedFor(address ?? null);
    } catch {
      console.error('[Rova] ERC-8183 job history corrupted. Starting fresh.');
      localStorage.removeItem(key);
      setJobs([]);
      setLoadedFor(address ?? null);
    }
  }, [address, loadedFor]);

  useEffect(() => {
    const key = storageKey(address);
    if (!key || loadedFor !== address) return;
    try { localStorage.setItem(key, JSON.stringify(jobs)); } catch {
      console.error('[Rova] Failed to persist ERC-8183 job history.');
    }
  }, [jobs, address, loadedFor]);

  const addJob = useCallback((job: FlowJob) => {
    setJobs(prev => [job, ...prev.slice(0, 49)]);
  }, []);

  const updateJob = useCallback((id: string, patch: Partial<FlowJob>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j));
  }, []);

  return (
    <Erc8183Context.Provider value={{ jobs, addJob, updateJob, clearJobs: () => setJobs([]) }}>
      {children}
    </Erc8183Context.Provider>
  );
}

export function useErc8183() {
  const ctx = useContext(Erc8183Context);
  if (ctx === undefined) throw new Error('useErc8183 must be used within an Erc8183Provider');
  return ctx;
}
