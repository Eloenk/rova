import type { FxPair } from './rates';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export type TriggerType = 'rate_gte' | 'rate_lte' | 'by_date';

export interface AgentRule {
  id: string;
  createdAt: string;
  status: 'active' | 'fired' | 'cancelled' | 'expired';

  // What to move
  recipientLabel: string;
  recipientAddress: string;
  amount: number;
  pair: FxPair;

  // When to fire
  triggerType: TriggerType;
  triggerValue: number;       // target rate for rate_gte / rate_lte
  byDate?: string;            // ISO date, used for by_date (or as a hard deadline alongside a rate trigger)

  // Tolerance band
  toleranceBps: number; // basis points, default 10 (=0.10%)
}

export interface AgentExecution {
  id: string;
  ruleId: string;
  firedAt: string;
  rateAtExecution: number;
  mode: 'mock' | 'real';
  txHash: string;
  arcScanUrl: string;
  feeJobId?: string;
  feeAmountUsdc: number;
  reputationTxHash?: string;
  memo: string;
}

// In-memory fallback
const rulesMap = new Map<string, AgentRule>();
const executionsArray: AgentExecution[] = [];

let counter = 0;
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter}`;
}

export async function createRule(input: Omit<AgentRule, 'id' | 'createdAt' | 'status'>): Promise<AgentRule> {
  const rule: AgentRule = {
    ...input,
    id: nextId('rule'),
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient() as any;
    if (supabase) {
      const { error } = await supabase.from('rova_rules').insert({
        id: rule.id,
        created_at: rule.createdAt,
        status: rule.status,
        recipient_label: rule.recipientLabel,
        recipient_address: rule.recipientAddress,
        amount: rule.amount,
        pair: rule.pair,
        trigger_type: rule.triggerType,
        trigger_value: rule.triggerValue,
        by_date: rule.byDate || null,
        tolerance_bps: rule.toleranceBps,
      });
      if (error) {
        console.error('[agentStore] Supabase createRule error:', error);
      } else {
        return rule;
      }
    }
  }

  // Fallback / In-Memory
  rulesMap.set(rule.id, rule);
  return rule;
}

export async function listRules(): Promise<AgentRule[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient() as any;
    if (supabase) {
      const { data, error } = await supabase
        .from('rova_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[agentStore] Supabase listRules error:', error);
      } else if (data) {
        return data.map((r: any) => ({
          id: r.id,
          createdAt: r.created_at,
          status: r.status,
          recipientLabel: r.recipient_label,
          recipientAddress: r.recipient_address,
          amount: Number(r.amount),
          pair: r.pair as FxPair,
          triggerType: r.trigger_type as TriggerType,
          triggerValue: Number(r.trigger_value),
          byDate: r.by_date || undefined,
          toleranceBps: r.tolerance_bps,
        }));
      }
    }
  }

  // Fallback
  return Array.from(rulesMap.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getRule(id: string): Promise<AgentRule | undefined> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient() as any;
    if (supabase) {
      const { data, error } = await supabase
        .from('rova_rules')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error('[agentStore] Supabase getRule error:', error);
      } else if (data) {
        return {
          id: data.id,
          createdAt: data.created_at,
          status: data.status,
          recipientLabel: data.recipient_label,
          recipientAddress: data.recipient_address,
          amount: Number(data.amount),
          pair: data.pair as FxPair,
          triggerType: data.trigger_type as TriggerType,
          triggerValue: Number(data.trigger_value),
          byDate: data.by_date || undefined,
          toleranceBps: data.tolerance_bps,
        };
      }
    }
  }

  // Fallback
  return rulesMap.get(id);
}

export async function updateRuleStatus(id: string, status: AgentRule['status']): Promise<AgentRule | undefined> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient() as any;
    if (supabase) {
      const { data, error } = await supabase
        .from('rova_rules')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('[agentStore] Supabase updateRuleStatus error:', error);
      } else if (data) {
        return {
          id: data.id,
          createdAt: data.created_at,
          status: data.status,
          recipientLabel: data.recipient_label,
          recipientAddress: data.recipient_address,
          amount: Number(data.amount),
          pair: data.pair as FxPair,
          triggerType: data.trigger_type as TriggerType,
          triggerValue: Number(data.trigger_value),
          byDate: data.by_date || undefined,
          toleranceBps: data.tolerance_bps,
        };
      }
    }
  }

  // Fallback
  const r = rulesMap.get(id);
  if (!r) return undefined;
  r.status = status;
  rulesMap.set(id, r);
  return r;
}

export async function deleteRule(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient() as any;
    if (supabase) {
      const { error } = await supabase
        .from('rova_rules')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('[agentStore] Supabase deleteRule error:', error);
        return false;
      }
      return true;
    }
  }

  // Fallback
  return rulesMap.delete(id);
}

export async function getActiveRules(): Promise<AgentRule[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient() as any;
    if (supabase) {
      const { data, error } = await supabase
        .from('rova_rules')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[agentStore] Supabase getActiveRules error:', error);
      } else if (data) {
        return data.map((r: any) => ({
          id: r.id,
          createdAt: r.created_at,
          status: r.status,
          recipientLabel: r.recipient_label,
          recipientAddress: r.recipient_address,
          amount: Number(r.amount),
          pair: r.pair as FxPair,
          triggerType: r.trigger_type as TriggerType,
          triggerValue: Number(r.trigger_value),
          byDate: r.by_date || undefined,
          toleranceBps: r.tolerance_bps,
        }));
      }
    }
  }

  // Fallback
  return (await listRules()).filter(r => r.status === 'active');
}

export async function recordExecution(exec: Omit<AgentExecution, 'id'>): Promise<AgentExecution> {
  const full: AgentExecution = { ...exec, id: nextId('exec') };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient() as any;
    if (supabase) {
      const { error } = await supabase.from('rova_executions').insert({
        id: full.id,
        rule_id: full.ruleId,
        fired_at: full.firedAt,
        rate_at_execution: full.rateAtExecution,
        mode: full.mode,
        tx_hash: full.txHash,
        arc_scan_url: full.arcScanUrl,
        fee_job_id: full.feeJobId || null,
        fee_amount_usdc: full.feeAmountUsdc,
        reputation_tx_hash: full.reputationTxHash || null,
        memo: full.memo,
      });
      if (error) {
        console.error('[agentStore] Supabase recordExecution error:', error);
      } else {
        return full;
      }
    }
  }

  // Fallback
  executionsArray.unshift(full);
  return full;
}

export async function listExecutions(): Promise<AgentExecution[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient() as any;
    if (supabase) {
      const { data, error } = await supabase
        .from('rova_executions')
        .select('*')
        .order('fired_at', { ascending: false });
      if (error) {
        console.error('[agentStore] Supabase listExecutions error:', error);
      } else if (data) {
        return data.map((e: any) => ({
          id: e.id,
          ruleId: e.rule_id,
          firedAt: e.fired_at,
          rateAtExecution: Number(e.rate_at_execution),
          mode: e.mode as 'mock' | 'real',
          txHash: e.tx_hash,
          arcScanUrl: e.arc_scan_url,
          feeJobId: e.fee_job_id || undefined,
          feeAmountUsdc: Number(e.fee_amount_usdc),
          reputationTxHash: e.reputation_tx_hash || undefined,
          memo: e.memo,
        }));
      }
    }
  }

  // Fallback
  return executionsArray;
}
