import { NextResponse } from 'next/server';
import { getActiveRules, updateRuleStatus, recordExecution } from '@/lib/agentStore';
import { getIndicativeRate } from '@/lib/rates';
import { fireRule } from '@/lib/agentExecutor';
import type { AgentRule } from '@/lib/agentStore';

function isTriggered(rule: AgentRule, rate: number): boolean {
  if (rule.triggerType === 'rate_gte') return rate >= rule.triggerValue;
  if (rule.triggerType === 'rate_lte') return rate <= rule.triggerValue;
  if (rule.triggerType === 'by_date') return rule.byDate ? Date.now() >= new Date(rule.byDate).getTime() : false;
  return false;
}

// Re-check against a second "firm" read before committing — if the rate moved
// against the user beyond the tolerance band between the trigger check and
// execution, abort this tick and let the rule re-arm rather than executing
// at a worse price than intended.
function withinTolerance(rule: AgentRule, indicative: number, firm: number): boolean {
  if (rule.triggerType === 'by_date') return true; // date triggers ignore price tolerance
  const drift = Math.abs(firm - indicative) / indicative;
  return drift <= rule.toleranceBps / 10000;
}

export async function POST() {
  const active = await getActiveRules();
  const fired: any[] = [];
  const skipped: any[] = [];

  for (const rule of active) {
    const indicative = getIndicativeRate(rule.pair);
    if (!isTriggered(rule, indicative)) continue;

    // Firm quote re-check (small extra jitter simulates the real
    // indicative -> firm quote gap on StableFX)
    const firm = getIndicativeRate(rule.pair);
    if (!withinTolerance(rule, indicative, firm)) {
      skipped.push({ ruleId: rule.id, reason: 'moved beyond tolerance band, re-armed', indicative, firm });
      continue;
    }

    const memo = rule.triggerType === 'by_date'
      ? `auto-exec: deadline ${rule.byDate} reached`
      : `auto-exec: rate ${firm} ${rule.triggerType === 'rate_gte' ? '>=' : '<='} target ${rule.triggerValue}`;

    try {
      const result = await fireRule(rule, firm, memo);
      await updateRuleStatus(rule.id, 'fired');
      const exec = await recordExecution({
        ruleId: rule.id,
        firedAt: new Date().toISOString(),
        rateAtExecution: firm,
        mode: result.mode,
        txHash: result.txHash,
        arcScanUrl: result.arcScanUrl,
        feeJobId: result.feeJobId,
        feeAmountUsdc: 0.05,
        reputationTxHash: result.reputationTxHash,
        memo,
      });
      fired.push(exec);
    } catch (e) {
      skipped.push({ ruleId: rule.id, reason: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ ok: true, checked: active.length, fired, skipped });
}

// Also allow GET so a cron provider (e.g. Vercel Cron) that only supports GET
// invocations can hit this route directly.
export async function GET() {
  return POST();
}
