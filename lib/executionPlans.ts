import 'server-only';

import { createHash, randomUUID } from 'crypto';
import type { FlowPlan } from './types';
import { getSupabaseClient } from './supabase';

const PLAN_TTL_MS = 10 * 60 * 1000;
const PLAN_ID_RE = /^plan_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ExecutionPlanRow {
  id: string;
  owner_email: string;
  wallet_address: string;
  intent_hash: string;
  plan: FlowPlan;
  status: 'planned' | 'executing' | 'executed' | 'failed' | 'expired';
  expires_at: string;
}

export interface ClaimedExecutionPlan {
  id: string;
  ownerEmail: string;
  walletAddress: string;
  intentHash: string;
  plan: FlowPlan;
  expiresAt: string;
}

export function isExecutionPlanId(value: unknown): value is string {
  return typeof value === 'string' && PLAN_ID_RE.test(value);
}

export function hashExecutionApproval(id: string, ownerEmail: string, code: string): string {
  return createHash('sha256')
    .update(`${id}:${ownerEmail.toLowerCase().trim()}:${code}`)
    .digest('hex');
}

function database() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Execution-plan persistence is not configured');
  }
  return client as any;
}

export async function createExecutionPlan(input: {
  ownerEmail: string;
  walletAddress: string;
  intentHash: string;
  plan: FlowPlan;
}): Promise<{ id: string; expiresAt: string }> {
  const id = `plan_${randomUUID()}`;
  const expiresAt = new Date(Date.now() + PLAN_TTL_MS).toISOString();
  const { error } = await database().from('execution_plans').insert({
    id,
    owner_email: input.ownerEmail,
    wallet_address: input.walletAddress.toLowerCase(),
    intent_hash: input.intentHash,
    plan: input.plan,
    status: 'planned',
    expires_at: expiresAt,
  });
  if (error) {
    throw new Error(`Unable to persist execution plan: ${error.message}`);
  }
  return { id, expiresAt };
}

export async function claimExecutionPlan(
  id: string,
  ownerEmail: string,
  walletAddress: string,
  approvalHash: string,
): Promise<ClaimedExecutionPlan> {
  const { data, error } = await database().rpc('claim_execution_plan', {
    requested_id: id,
    requested_owner_email: ownerEmail,
    requested_wallet_address: walletAddress,
    requested_approval_hash: approvalHash,
  });
  const row = (Array.isArray(data) ? data[0] : data) as ExecutionPlanRow | undefined;
  if (error || !row) {
    throw new Error('Execution plan is invalid, expired, or already used');
  }
  return {
    id: row.id,
    ownerEmail: row.owner_email,
    walletAddress: row.wallet_address,
    intentHash: row.intent_hash,
    plan: row.plan,
    expiresAt: row.expires_at,
  };
}

export async function setExecutionApproval(input: {
  id: string;
  ownerEmail: string;
  walletAddress: string;
  approvalHash: string | null;
  expiresAt: string | null;
}): Promise<boolean> {
  const { data, error } = await database()
    .from('execution_plans')
    .update({
      approval_code_hash: input.approvalHash,
      approval_expires_at: input.expiresAt,
      approval_attempts: 0,
    })
    .eq('id', input.id)
    .eq('owner_email', input.ownerEmail)
    .eq('wallet_address', input.walletAddress.toLowerCase())
    .eq('status', 'planned')
    .gt('expires_at', new Date().toISOString())
    .select('id')
    .maybeSingle();
  return !error && data?.id === input.id;
}

export async function finishExecutionPlan(
  id: string,
  status: 'executed' | 'failed',
  receipt?: Record<string, unknown>,
): Promise<void> {
  const { error } = await database()
    .from('execution_plans')
    .update({
      status,
      receipt: receipt || null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'executing');
  if (error) {
    console.error('[Execution Plan] Failed to persist terminal status');
  }
}
