'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { FlowPlan, ApiResponse, ExecutionResult } from '@/lib/types';
import { useFlowHistory } from './flowHistoryStore';
import { safeClone, safeString } from '@/lib/json';

export type FlowStatus = 'idle' | 'planning' | 'planned' | 'executing' | 'recording' | 'confirmed' | 'error';

interface State {
  status:          FlowStatus;
  plan:            FlowPlan | null;
  executionResult: ExecutionResult | null;
  reputationTx:    string | null;
  error:           string | null;
  processingMs:    number | null;
  intentHash:      string | null;
  intent:          string | null;
  agentId:         string | null;
  reputation:      number | null;
  isValidated:     boolean;
}

const INIT: State = { 
  status:'idle', 
  plan:null, 
  executionResult:null, 
  reputationTx:null, 
  error:null, 
  processingMs:null, 
  intentHash:null, 
  intent:null,
  agentId: process.env.NEXT_PUBLIC_ROVA_AGENT_ID || null,
  reputation: 85,
  isValidated: true
};

function repScore(plan: FlowPlan) {
  return Math.max(1, Math.min(100, plan.confidence + (plan.risk === 'low' ? 0 : plan.risk === 'medium' ? -5 : -15)));
}

export function useRova() {
  const [state, setState] = useState<State>(INIT);
  const ref = useRef<State>(INIT);
  ref.current = state;

  const { addEntry, updateEntry } = useFlowHistory();
  const patch = (p: Partial<State>) => setState(prev => ({ ...prev, ...p }));

  const planIntent = useCallback(async (intentInput: any) => {
    // Double-Locked Sentry: Ensure only plain text ever enters the state
    const intent = safeString(intentInput).trim();
    if (!intent) return null;

    patch({ status:'planning', error:null, plan:null, executionResult:null, reputationTx:null, intent });
    try {
      const res = await fetch('/api/ai', { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ intent }) 
      });
      const data: ApiResponse = await res.json();
      if (!data.ok) { patch({ status:'error', error: safeString(data.error.message) }); return null; }
      
      const cleanPlan = safeClone(data.plan);
      
      addEntry({ 
        id: safeString(data.meta.intentHash), 
        intent: intent, 
        plan: cleanPlan, 
        status:'planned', 
        executionResult:null, 
        createdAt: new Date().toISOString(), 
        totalAmount: Number(cleanPlan.totalAmount), 
        risk: cleanPlan.risk, 
        processingMs: Number(data.meta.processingMs) 
      });
      patch({ status:'planned', plan:cleanPlan, processingMs:data.meta.processingMs, intentHash:data.meta.intentHash });
      return cleanPlan;
    } catch (err) {
      console.error('[Rova] Critical Intent Error:', err);
      const msg = err instanceof Error ? err.message : 'Plan generation failed';
      patch({ status:'error', error: safeString(msg) });
      return null;
    }
  }, [addEntry]);

  const executePlan = useCallback(async (walletAddress?: string) => {
    const { plan, intentHash } = ref.current;
    if (!plan || !intentHash) return;
    patch({ status:'executing', error:null });
    try {
      const res = await fetch('/api/execute', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ plan, intentHash, walletAddress: walletAddress ?? null }) });
      const data = await res.json();
      if (!data.ok) { updateEntry(intentHash, { status:'failed' }); patch({ status:'error', error: data.error?.message ?? 'Execution failed' }); return; }
      const exec: ExecutionResult = data.result;
      updateEntry(intentHash, { status:'executed', executionResult:exec, executedAt:new Date().toISOString() });
      patch({ status:'recording', executionResult:exec });
      try {
        const rr = await fetch('/api/agent/reputation', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ score:repScore(plan), tag:'successful_flow_execution', intentHash, totalAmount:plan.totalAmount }) });
        const rd = await rr.json();
        if (rd.ok) { updateEntry(intentHash, { reputation:{ score:repScore(plan), txHash:rd.txHash, arcScanUrl:rd.arcScanUrl } }); patch({ status:'confirmed', reputationTx:rd.txHash }); }
        else patch({ status:'confirmed' });
      } catch { patch({ status:'confirmed' }); }
    } catch (err) { patch({ status:'error', error: err instanceof Error ? err.message : 'Network error' }); }
  }, [updateEntry]);

  const syncAgentStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/status');
      const data = await res.json();
      if (data.ok) {
        patch({ 
          agentId: data.agentId, 
          reputation: data.reputationScore, 
          isValidated: data.isValidated 
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    syncAgentStatus();
  }, [syncAgentStatus]);

  // Convenience wrapper for callers (e.g. SendView) that just want "plan it,
  // then execute it" as a single call, rather than orchestrating both steps.
  const executeFlow = useCallback(async (intentInput: any, walletAddress?: string) => {
    const plan = await planIntent(intentInput);
    if (!plan) throw new Error(ref.current.error || 'Failed to plan intent');
    await executePlan(walletAddress);
    if (ref.current.status === 'error') throw new Error(ref.current.error || 'Execution failed');
  }, [planIntent, executePlan]);

  const isProcessing = state.status === 'planning' || state.status === 'executing' || state.status === 'recording';

  const reset = useCallback(() => setState(INIT), []);
  return { ...state, planIntent, executePlan, executeFlow, isProcessing, syncAgentStatus, reset };
}
