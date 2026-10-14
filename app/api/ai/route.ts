import { NextRequest, NextResponse } from 'next/server';
import { validateFlowPlan, validatePlanIntentBinding } from '@/lib/validator';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { sha256 } from '@/lib/crypto';
import type { ApiResponse } from '@/lib/types';
import { callAI, AIProvider } from '@/lib/ai-provider';
import { getFailsafePlan } from '@/lib/failsafe';
import { AuthenticatedSession, requireMutationSession } from '@/lib/auth';
import { createExecutionPlan } from '@/lib/executionPlans';
import { isManualExecutionSupported } from '@/lib/executionCapabilities';
import type { FlowPlan } from '@/lib/types';

function err(status: number, code: string, message: string, detail?: string): NextResponse<ApiResponse> {
  return NextResponse.json({ ok: false, error: { code, message, ...(detail ? { detail } : {}) } }, { status });
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function planResponse(
  plan: FlowPlan,
  session: AuthenticatedSession,
  model: string,
  processingMs: number,
  intentHash: string,
): Promise<NextResponse<ApiResponse>> {
  let executionPlan: { id: string; expiresAt: string } | undefined;
  if (plan.totalAmount > 0 && session.walletAddress && isManualExecutionSupported(plan)) {
    try {
      executionPlan = await createExecutionPlan({
        ownerEmail: session.email,
        walletAddress: session.walletAddress,
        intentHash,
        plan,
      });
    } catch {
      console.error('[AI Route] Unable to persist executable plan');
    }
  }

  return NextResponse.json({
    ok: true,
    plan,
    meta: {
      model,
      processingMs,
      intentHash,
      arcChainId: 5042002,
      executable: Boolean(executionPlan),
      ...(executionPlan ? { executionPlanId: executionPlan.id, expiresAt: executionPlan.expiresAt } : {}),
    },
  });
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const guard = await requireMutationSession(req);
  if ('response' in guard) return guard.response as NextResponse<ApiResponse>;
  const start = Date.now();
  const { allowed } = checkRateLimit(`ai:${guard.session.email}:${getClientIp(req)}`);
  if (!allowed) return err(429, 'RATE_LIMITED', 'Too many requests. Wait a moment.');

  let body: { intent?: string };
  try { body = await req.json(); } catch { return err(400, 'BAD_REQUEST', 'Invalid JSON body'); }

  const intent = body?.intent?.trim();
  if (!intent) return err(400, 'MISSING_INTENT', 'Intent is required');
  if (/\b(yield|stake|staking|usyc|automate|automation|recurring|standing rule|erc-?8183)\b/i.test(intent)) {
    return err(409, 'CAPABILITY_UNAVAILABLE', 'Yield, staking, new autonomous policies, and ERC-8183 jobs are not enabled in this release.');
  }
  
  const intentHash = await sha256(intent);

  // 1. FAST-PATH: Try Deterministic Failsafe First
  const failsafe = getFailsafePlan(intent);
  if (failsafe) {
    if (failsafe.totalAmount > 0) {
      const validation = validateFlowPlan(failsafe);
      if (!validation.valid) {
        return err(400, 'UNSAFE_PLAN', 'The requested action is missing safe execution details.');
      }
      if (validatePlanIntentBinding(failsafe, intent).length > 0) {
        return err(400, 'UNBOUND_RECIPIENT', 'Every transfer recipient must be explicitly supplied by the user.');
      }
    }
    return planResponse(failsafe, guard.session, 'failsafe', Date.now() - start, intentHash);
  }
  
  // 2. NEURAL-PATH: Try AI Orchestrator with Retries
  let rawText: string;
  let providerToUse: AIProvider = 'anthropic';
  
  try {
    // Attempt with retries and exponential backoff
    let result: { text: string; provider: AIProvider } | null = null;
    for (let i = 0; i < 3; i++) {
        try {
            result = await callAI(intent);
            break;
        } catch (e: any) {
            const msg = e.message || '';
            const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('balance');
            if (isQuota && i < 2) {
                const delay = 2000 * Math.pow(2, i);
                console.warn(`[AI Route] Quota/Balance issue. Retry in ${delay}ms...`);
                await sleep(delay);
                continue;
            }
            throw e;
        }
    }

    if (!result) throw new Error('AI Generation timed out or failed.');
    rawText = result.text.trim();
    providerToUse = result.provider;

  } catch (e: any) {
    const msg = e.message || String(e);
    console.error('[AI Route] Planning provider failed');

    if (msg.includes('balance') || msg.includes('credit')) {
        return err(503, 'AI_PROVIDER_UNAVAILABLE', 'The planning service is temporarily unavailable.');
    }
    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      return err(429, 'AI_QUOTA_EXCEEDED', 'All AI providers are currently busy. Please wait a moment.');
    }
    return err(502, 'PLANNING_FAILED', 'The planning service could not produce a safe plan.');
  }

  // 3. VALIDATION: Parse and Validate
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawText;
    const parsed = JSON.parse(jsonStr.trim());
    
    const { valid, errors, plan } = validateFlowPlan(parsed);
    if (!valid || !plan) return err(502, 'INVALID_PLAN_SCHEMA', 'AI brain returned malformed logic', errors.join('; '));
    const bindingErrors = validatePlanIntentBinding(plan, intent);
    if (bindingErrors.length > 0) {
      return err(400, 'UNBOUND_RECIPIENT', 'Every transfer recipient must be explicitly supplied by the user.');
    }

    return planResponse(plan, guard.session, providerToUse, Date.now() - start, intentHash);
  } catch {
    return err(502, 'PARSE_ERROR', 'AI response could not be understood as a financial plan.');
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST /api/ai' } }, { status: 405 });
}
