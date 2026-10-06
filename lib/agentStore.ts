import 'server-only';

import { randomUUID } from 'crypto';
import type { FxPair } from './rates';
import type { FlowPlan } from './types';
import { getSupabaseClient } from './supabase';

export type TriggerType = 'rate_gte' | 'rate_lte' | 'by_date';
export type CustodyMode = 'managed' | 'self_custody';
export type RecipientType = 'email' | 'wallet';
export type RuleStatus = 'active' | 'ready_to_execute' | 'fired' | 'cancelled' | 'expired';

export interface AgentRule {
  id: string;
  createdAt: string;
  status: RuleStatus;
  ownerEmail: string;
  recipientLabel: string;
  recipientIdentifier: string;
  recipientType: RecipientType;
  amount: number;
  pair: FxPair;
  triggerType: TriggerType;
  triggerValue: number;
  byDate?: string;
  toleranceBps: number;
  custodyMode: CustodyMode;
  sourceWallet: string;
  notifyPhone?: string;
  sourceChannel?: 'web' | 'whatsapp';
}

export interface QuoteShopResult {
  providersChecked: number;
  bestProvider: string;
  bestRate: number;
  totalPaidUsdc: number;
  quotes: { provider: string; rate: number; paidUsdc: number }[];
}

export interface AgentExecution {
  id: string;
  ownerEmail: string;
  ruleId?: string;
  standingIntentId?: string;
  firedAt: string;
  rateAtExecution?: number;
  mode: 'mock' | 'real';
  txHash: string;
  arcScanUrl: string;
  feeJobId?: string;
  feeAmountUsdc: number;
  reputationTxHash?: string;
  memo: string;
  quoteShop?: QuoteShopResult;
}

export type RecurringInterval = 'daily' | 'weekly' | 'monthly';

export type StandingTrigger =
  | { type: 'recurring'; interval: RecurringInterval }
  | { type: 'on_receive'; minAmountUsdc: number };

export interface StandingIntent {
  id: string;
  createdAt: string;
  status: 'active' | 'ready_to_execute' | 'cancelled';
  ownerEmail: string;
  intentText: string;
  plan: FlowPlan;
  trigger: StandingTrigger;
  custodyMode: CustodyMode;
  sourceWallet: string;
  lastRunAt?: string;
  lastKnownBalance?: number;
  runCount: number;
  notifyPhone?: string;
  sourceChannel?: 'web' | 'whatsapp';
}

type RuleRow = {
  id: string;
  created_at: string;
  status: RuleStatus;
  owner_email: string;
  recipient_label: string;
  recipient_identifier: string;
  recipient_type: RecipientType;
  amount: number | string;
  pair: FxPair;
  trigger_type: TriggerType;
  trigger_value: number | string;
  by_date: string | null;
  tolerance_bps: number;
  custody_mode: CustodyMode;
  source_wallet: string;
  notify_phone: string | null;
  source_channel: 'web' | 'whatsapp' | null;
};

type StandingIntentRow = {
  id: string;
  created_at: string;
  status: StandingIntent['status'];
  owner_email: string;
  intent_text: string;
  plan: FlowPlan;
  trigger: StandingTrigger;
  custody_mode: CustodyMode;
  source_wallet: string;
  last_run_at: string | null;
  last_known_balance: number | string | null;
  run_count: number;
  notify_phone: string | null;
  source_channel: 'web' | 'whatsapp' | null;
};

type ExecutionRow = {
  id: string;
  owner_email: string;
  rule_id: string | null;
  standing_intent_id: string | null;
  fired_at: string;
  rate_at_execution: number | string | null;
  mode: 'mock' | 'real';
  tx_hash: string;
  arc_scan_url: string;
  fee_job_id: string | null;
  fee_amount_usdc: number | string;
  reputation_tx_hash: string | null;
  memo: string;
  quote_shop: QuoteShopResult | null;
};

function database() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Agent persistence requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  return client as any;
}

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(`Agent persistence error: ${error.message}`);
  if (data === null) throw new Error('Agent persistence returned no data');
  return data;
}

function toRule(row: RuleRow): AgentRule {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    ownerEmail: row.owner_email,
    recipientLabel: row.recipient_label,
    recipientIdentifier: row.recipient_identifier,
    recipientType: row.recipient_type,
    amount: Number(row.amount),
    pair: row.pair,
    triggerType: row.trigger_type,
    triggerValue: Number(row.trigger_value),
    byDate: row.by_date || undefined,
    toleranceBps: row.tolerance_bps,
    custodyMode: row.custody_mode,
    sourceWallet: row.source_wallet,
    notifyPhone: row.notify_phone || undefined,
    sourceChannel: row.source_channel || undefined,
  };
}

function ruleRow(rule: AgentRule): RuleRow {
  return {
    id: rule.id,
    created_at: rule.createdAt,
    status: rule.status,
    owner_email: rule.ownerEmail,
    recipient_label: rule.recipientLabel,
    recipient_identifier: rule.recipientIdentifier,
    recipient_type: rule.recipientType,
    amount: rule.amount,
    pair: rule.pair,
    trigger_type: rule.triggerType,
    trigger_value: rule.triggerValue,
    by_date: rule.byDate || null,
    tolerance_bps: rule.toleranceBps,
    custody_mode: rule.custodyMode,
    source_wallet: rule.sourceWallet,
    notify_phone: rule.notifyPhone || null,
    source_channel: rule.sourceChannel || null,
  };
}

function toStandingIntent(row: StandingIntentRow): StandingIntent {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    ownerEmail: row.owner_email,
    intentText: row.intent_text,
    plan: row.plan,
    trigger: row.trigger,
    custodyMode: row.custody_mode,
    sourceWallet: row.source_wallet,
    lastRunAt: row.last_run_at || undefined,
    lastKnownBalance: row.last_known_balance === null ? undefined : Number(row.last_known_balance),
    runCount: row.run_count,
    notifyPhone: row.notify_phone || undefined,
    sourceChannel: row.source_channel || undefined,
  };
}

function standingIntentRow(intent: StandingIntent): StandingIntentRow {
  return {
    id: intent.id,
    created_at: intent.createdAt,
    status: intent.status,
    owner_email: intent.ownerEmail,
    intent_text: intent.intentText,
    plan: intent.plan,
    trigger: intent.trigger,
    custody_mode: intent.custodyMode,
    source_wallet: intent.sourceWallet,
    last_run_at: intent.lastRunAt || null,
    last_known_balance: intent.lastKnownBalance ?? null,
    run_count: intent.runCount,
    notify_phone: intent.notifyPhone || null,
    source_channel: intent.sourceChannel || null,
  };
}

function toExecution(row: ExecutionRow): AgentExecution {
  return {
    id: row.id,
    ownerEmail: row.owner_email,
    ruleId: row.rule_id || undefined,
    standingIntentId: row.standing_intent_id || undefined,
    firedAt: row.fired_at,
    rateAtExecution: row.rate_at_execution === null ? undefined : Number(row.rate_at_execution),
    mode: row.mode,
    txHash: row.tx_hash,
    arcScanUrl: row.arc_scan_url,
    feeJobId: row.fee_job_id || undefined,
    feeAmountUsdc: Number(row.fee_amount_usdc),
    reputationTxHash: row.reputation_tx_hash || undefined,
    memo: row.memo,
    quoteShop: row.quote_shop || undefined,
  };
}

export async function createRule(input: Omit<AgentRule, 'id' | 'createdAt' | 'status'>): Promise<AgentRule> {
  const rule: AgentRule = {
    ...input,
    id: `rule_${randomUUID()}`,
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  const { data, error } = await database().from('agent_rules').insert(ruleRow(rule)).select().single();
  return toRule(requireData<RuleRow>(data, error));
}

export async function listRules(ownerEmail: string): Promise<AgentRule[]> {
  const { data, error } = await database().from('agent_rules').select('*').eq('owner_email', ownerEmail).order('created_at', { ascending: false });
  if (error) throw new Error(`Agent persistence error: ${error.message}`);
  return ((data || []) as RuleRow[]).map(toRule);
}

export async function getRule(id: string, ownerEmail: string): Promise<AgentRule | undefined> {
  const { data, error } = await database().from('agent_rules').select('*').eq('id', id).eq('owner_email', ownerEmail).maybeSingle();
  if (error) throw new Error(`Agent persistence error: ${error.message}`);
  return data ? toRule(data as RuleRow) : undefined;
}

export async function updateRuleStatus(id: string, ownerEmail: string, status: RuleStatus): Promise<AgentRule | undefined> {
  const { data, error } = await database().from('agent_rules').update({ status }).eq('id', id).eq('owner_email', ownerEmail).select().maybeSingle();
  if (error) throw new Error(`Agent persistence error: ${error.message}`);
  return data ? toRule(data as RuleRow) : undefined;
}

export async function deleteRule(id: string, ownerEmail: string): Promise<boolean> {
  const { data, error } = await database().from('agent_rules').delete().eq('id', id).eq('owner_email', ownerEmail).select('id');
  if (error) throw new Error(`Agent persistence error: ${error.message}`);
  return Array.isArray(data) && data.length === 1;
}

export async function createStandingIntent(input: Omit<StandingIntent, 'id' | 'createdAt' | 'status' | 'runCount'>): Promise<StandingIntent> {
  const intent: StandingIntent = {
    ...input,
    id: `intent_${randomUUID()}`,
    createdAt: new Date().toISOString(),
    status: 'active',
    runCount: 0,
  };
  const { data, error } = await database().from('standing_intents').insert(standingIntentRow(intent)).select().single();
  return toStandingIntent(requireData<StandingIntentRow>(data, error));
}

export async function listStandingIntents(ownerEmail: string): Promise<StandingIntent[]> {
  const { data, error } = await database().from('standing_intents').select('*').eq('owner_email', ownerEmail).order('created_at', { ascending: false });
  if (error) throw new Error(`Agent persistence error: ${error.message}`);
  return ((data || []) as StandingIntentRow[]).map(toStandingIntent);
}

export async function getStandingIntent(id: string, ownerEmail: string): Promise<StandingIntent | undefined> {
  const { data, error } = await database().from('standing_intents').select('*').eq('id', id).eq('owner_email', ownerEmail).maybeSingle();
  if (error) throw new Error(`Agent persistence error: ${error.message}`);
  return data ? toStandingIntent(data as StandingIntentRow) : undefined;
}

export async function updateStandingIntent(id: string, ownerEmail: string, patch: Pick<StandingIntent, 'status'>): Promise<StandingIntent | undefined> {
  const { data, error } = await database().from('standing_intents').update({ status: patch.status }).eq('id', id).eq('owner_email', ownerEmail).select().maybeSingle();
  if (error) throw new Error(`Agent persistence error: ${error.message}`);
  return data ? toStandingIntent(data as StandingIntentRow) : undefined;
}

export async function deleteStandingIntent(id: string, ownerEmail: string): Promise<boolean> {
  const { data, error } = await database().from('standing_intents').delete().eq('id', id).eq('owner_email', ownerEmail).select('id');
  if (error) throw new Error(`Agent persistence error: ${error.message}`);
  return Array.isArray(data) && data.length === 1;
}

export async function recordExecution(input: Omit<AgentExecution, 'id'>): Promise<AgentExecution> {
  const row = {
    id: `exec_${randomUUID()}`,
    owner_email: input.ownerEmail,
    rule_id: input.ruleId || null,
    standing_intent_id: input.standingIntentId || null,
    fired_at: input.firedAt,
    rate_at_execution: input.rateAtExecution ?? null,
    mode: input.mode,
    tx_hash: input.txHash,
    arc_scan_url: input.arcScanUrl,
    fee_job_id: input.feeJobId || null,
    fee_amount_usdc: input.feeAmountUsdc,
    reputation_tx_hash: input.reputationTxHash || null,
    memo: input.memo,
    quote_shop: input.quoteShop || null,
  };
  const { data, error } = await database().from('agent_executions').insert(row).select().single();
  return toExecution(requireData<ExecutionRow>(data, error));
}

export async function listExecutions(ownerEmail: string): Promise<AgentExecution[]> {
  const { data, error } = await database().from('agent_executions').select('*').eq('owner_email', ownerEmail).order('fired_at', { ascending: false });
  if (error) throw new Error(`Agent persistence error: ${error.message}`);
  return ((data || []) as ExecutionRow[]).map(toExecution);
}
