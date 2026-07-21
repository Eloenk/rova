// ─────────────────────────────────────────────────────────────────────────────
// Rova — Agent Store
//
// Two kinds of automation live here:
//   AgentRule       — a single-transfer rule with a rate or date trigger
//                      (the original "Agent" tab feature)
//   StandingIntent  — an arbitrary Command Hub plan ("send 100 split between
//                      supplier and savings") saved to re-run on a recurring
//                      schedule or whenever an incoming payment is detected
//
// Both share the same watcher tick and the same custody model:
//   managed      — recipient/source is a Circle-managed wallet (email
//                   onboarding). The Agent can sign and fire fully
//                   autonomously, no human present.
//   self_custody — source is the user's own connected wallet (MetaMask via
//                   wagmi). Circle never holds that key, so the Agent can't
//                   sign unattended — it detects the trigger, marks the rule
//                   "ready_to_execute", and waits for the user to approve
//                   with one tap in the UI. This is a real custody boundary,
//                   not a simplification — the point is the rule engine
//                   still does 100% of the watching either way.
// ─────────────────────────────────────────────────────────────────────────────

import type { FxPair } from './rates';
import type { FlowPlan } from './types';

export type TriggerType = 'rate_gte' | 'rate_lte' | 'by_date';
export type CustodyMode = 'managed' | 'self_custody';
export type RecipientType = 'email' | 'wallet';
export type RuleStatus = 'active' | 'ready_to_execute' | 'fired' | 'cancelled' | 'expired';

export interface AgentRule {
  id: string;
  createdAt: string;
  status: RuleStatus;

  recipientLabel: string;
  recipientIdentifier: string;   // raw input — email or 0x address
  recipientType: RecipientType;
  amount: number;
  pair: FxPair;

  triggerType: TriggerType;
  triggerValue: number;
  byDate?: string;
  toleranceBps: number;

  custodyMode: CustodyMode;
  sourceWallet: string;          // Circle-managed wallet OR the user's connected address
}

export interface AgentExecution {
  id: string;
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

export interface QuoteShopResult {
  providersChecked: number;
  bestProvider: string;
  bestRate: number;
  totalPaidUsdc: number;
  quotes: { provider: string; rate: number; paidUsdc: number }[];
}

// ── Standing Intents (Command Hub automation) ──────────────────────────────────

export type RecurringInterval = 'daily' | 'weekly' | 'monthly';

export type StandingTrigger =
  | { type: 'recurring'; interval: RecurringInterval }
  | { type: 'on_receive'; minAmountUsdc: number };

export interface StandingIntent {
  id: string;
  createdAt: string;
  status: 'active' | 'ready_to_execute' | 'cancelled';
  intentText: string;
  plan: FlowPlan;
  trigger: StandingTrigger;
  custodyMode: CustodyMode;
  sourceWallet: string;
  lastRunAt?: string;
  lastKnownBalance?: number; // for on_receive — balance as of the last check
  runCount: number;
}

const rules = new Map<string, AgentRule>();
const standingIntents = new Map<string, StandingIntent>();
const executions: AgentExecution[] = [];

let counter = 0;
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter}`;
}

// ── AgentRule CRUD ──────────────────────────────────────────────────────────────

export function createRule(input: Omit<AgentRule, 'id' | 'createdAt' | 'status'>): AgentRule {
  const rule: AgentRule = { ...input, id: nextId('rule'), createdAt: new Date().toISOString(), status: 'active' };
  rules.set(rule.id, rule);
  return rule;
}

export function listRules(): AgentRule[] {
  return Array.from(rules.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRule(id: string): AgentRule | undefined {
  return rules.get(id);
}

export function updateRuleStatus(id: string, status: RuleStatus): AgentRule | undefined {
  const r = rules.get(id);
  if (!r) return undefined;
  r.status = status;
  rules.set(id, r);
  return r;
}

export function deleteRule(id: string): boolean {
  return rules.delete(id);
}

export function getActiveRules(): AgentRule[] {
  return listRules().filter(r => r.status === 'active');
}

export function getRulesReadyToExecute(): AgentRule[] {
  return listRules().filter(r => r.status === 'ready_to_execute');
}

// ── StandingIntent CRUD ─────────────────────────────────────────────────────────

export function createStandingIntent(input: Omit<StandingIntent, 'id' | 'createdAt' | 'status' | 'runCount'>): StandingIntent {
  const intent: StandingIntent = {
    ...input,
    id: nextId('intent'),
    createdAt: new Date().toISOString(),
    status: 'active',
    runCount: 0,
  };
  standingIntents.set(intent.id, intent);
  return intent;
}

export function listStandingIntents(): StandingIntent[] {
  return Array.from(standingIntents.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getStandingIntent(id: string): StandingIntent | undefined {
  return standingIntents.get(id);
}

export function updateStandingIntent(id: string, patch: Partial<StandingIntent>): StandingIntent | undefined {
  const i = standingIntents.get(id);
  if (!i) return undefined;
  const updated = { ...i, ...patch };
  standingIntents.set(id, updated);
  return updated;
}

export function deleteStandingIntent(id: string): boolean {
  return standingIntents.delete(id);
}

export function getActiveStandingIntents(): StandingIntent[] {
  return listStandingIntents().filter(i => i.status === 'active');
}

export function getStandingIntentsReadyToExecute(): StandingIntent[] {
  return listStandingIntents().filter(i => i.status === 'ready_to_execute');
}

// ── Executions log ──────────────────────────────────────────────────────────────

export function recordExecution(exec: Omit<AgentExecution, 'id'>): AgentExecution {
  const full: AgentExecution = { ...exec, id: nextId('exec') };
  executions.unshift(full);
  return full;
}

export function listExecutions(): AgentExecution[] {
  return executions;
}
