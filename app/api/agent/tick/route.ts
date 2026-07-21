import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveRules, updateRuleStatus, recordExecution,
  getActiveStandingIntents, updateStandingIntent,
} from '@/lib/agentStore';
import { getIndicativeRate } from '@/lib/rates';
import { fireRule } from '@/lib/agentExecutor';
import { executeFlowPlan } from '@/lib/flowExecutor';
import type { AgentRule, StandingIntent } from '@/lib/agentStore';

const RECURRING_MS: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

function isRateTriggered(rule: AgentRule, rate: number): boolean {
  if (rule.triggerType === 'rate_gte') return rate >= rule.triggerValue;
  if (rule.triggerType === 'rate_lte') return rate <= rule.triggerValue;
  if (rule.triggerType === 'by_date') return rule.byDate ? Date.now() >= new Date(rule.byDate).getTime() : false;
  return false;
}

function withinTolerance(rule: AgentRule, indicative: number, firm: number): boolean {
  if (rule.triggerType === 'by_date') return true;
  const drift = Math.abs(firm - indicative) / indicative;
  return drift <= rule.toleranceBps / 10000;
}

async function getWalletBalance(walletAddress: string): Promise<number | null> {
  const mock =
    process.env.ROVA_MOCK_MODE === 'true' ||
    !process.env.CIRCLE_API_KEY ||
    !process.env.CIRCLE_ENTITY_SECRET;
  if (mock) return null; // on-receive detection needs a real chain read; skipped in mock mode
  try {
    const { getAgentBalance } = await import('@/lib/circle');
    return await getAgentBalance(walletAddress, 'USDC');
  } catch (e) {
    console.warn('[Agent] Balance check failed:', e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const baseUrl = req.nextUrl.origin;
  const fired: any[] = [];
  const skipped: any[] = [];
  const readyForApproval: any[] = [];

  // ── FX-rate / by-date rules ──────────────────────────────────────────────────
  for (const rule of getActiveRules()) {
    const indicative = getIndicativeRate(rule.pair);
    if (!isRateTriggered(rule, indicative)) continue;

    const firm = getIndicativeRate(rule.pair);
    if (!withinTolerance(rule, indicative, firm)) {
      skipped.push({ ruleId: rule.id, reason: 'moved beyond tolerance band, re-armed' });
      continue;
    }

    // Self-custody rules can't be signed unattended — mark ready and wait for
    // the user to approve with their own wallet.
    if (rule.custodyMode === 'self_custody') {
      updateRuleStatus(rule.id, 'ready_to_execute');
      readyForApproval.push({ ruleId: rule.id, kind: 'rate_rule' });
      continue;
    }

    const memo = rule.triggerType === 'by_date'
      ? `auto-exec: deadline ${rule.byDate} reached`
      : `auto-exec: rate ${firm} ${rule.triggerType === 'rate_gte' ? '>=' : '<='} target ${rule.triggerValue}`;

    try {
      const result = await fireRule(rule, baseUrl, memo);
      updateRuleStatus(rule.id, 'fired');
      const exec = recordExecution({
        ruleId: rule.id,
        firedAt: new Date().toISOString(),
        rateAtExecution: result.quoteShop.bestRate,
        mode: result.mode,
        txHash: result.txHash,
        arcScanUrl: result.arcScanUrl,
        feeJobId: result.feeJobId,
        feeAmountUsdc: 0.05,
        reputationTxHash: result.reputationTxHash,
        memo,
        quoteShop: result.quoteShop,
      });
      fired.push(exec);
    } catch (e) {
      skipped.push({ ruleId: rule.id, reason: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Standing intents (Command Hub automations) ──────────────────────────────
  for (const intent of getActiveStandingIntents()) {
    let due = false;

    if (intent.trigger.type === 'recurring') {
      const intervalMs = RECURRING_MS[intent.trigger.interval];
      const last = intent.lastRunAt ? new Date(intent.lastRunAt).getTime() : new Date(intent.createdAt).getTime();
      due = Date.now() - last >= intervalMs;
    } else if (intent.trigger.type === 'on_receive') {
      const balance = await getWalletBalance(intent.sourceWallet);
      if (balance !== null) {
        const last = intent.lastKnownBalance ?? balance;
        const delta = balance - last;
        if (delta >= intent.trigger.minAmountUsdc) due = true;
        updateStandingIntent(intent.id, { lastKnownBalance: balance });
      }
    }

    if (!due) continue;

    if (intent.custodyMode === 'self_custody') {
      updateStandingIntent(intent.id, { status: 'ready_to_execute' });
      readyForApproval.push({ standingIntentId: intent.id, kind: 'standing_intent' });
      continue;
    }

    try {
      const intentHash = `standing-${intent.id}-${Date.now()}`;
      const result = await executeFlowPlan(intent.plan, intentHash, intent.sourceWallet);
      updateStandingIntent(intent.id, { lastRunAt: new Date().toISOString(), runCount: intent.runCount + 1 });
      const memo = intent.trigger.type === 'recurring'
        ? `auto-exec: recurring (${intent.trigger.interval}) — "${intent.intentText}"`
        : `auto-exec: incoming payment detected — "${intent.intentText}"`;
      const exec = recordExecution({
        standingIntentId: intent.id,
        firedAt: new Date().toISOString(),
        mode: result.mode,
        txHash: result.txHashes[0] || 'n/a',
        arcScanUrl: result.txHashes[0] ? `https://testnet.arcscan.app/tx/${result.txHashes[0]}` : '',
        feeAmountUsdc: 0,
        memo,
      });
      fired.push(exec);
    } catch (e) {
      skipped.push({ standingIntentId: intent.id, reason: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ ok: true, fired, skipped, readyForApproval });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
