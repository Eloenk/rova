import { NextRequest, NextResponse } from 'next/server';
import { validateFlowPlan } from '@/lib/validator';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { sha256 } from '@/lib/crypto';
import type { ApiResponse } from '@/lib/types';
import { callAI, AIProvider } from '@/lib/ai-provider';
import { getFailsafePlan } from '@/lib/failsafe';

function err(status: number, code: string, message: string, detail?: string): NextResponse<ApiResponse> {
  return NextResponse.json({ ok: false, error: { code, message, ...(detail ? { detail } : {}) } }, { status });
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const start = Date.now();
  const { allowed } = checkRateLimit(getClientIp(req));
  if (!allowed) return err(429, 'RATE_LIMITED', 'Too many requests. Wait a moment.');

  let body: { intent?: string };
  try { body = await req.json(); } catch { return err(400, 'BAD_REQUEST', 'Invalid JSON body'); }

  const intent = body?.intent?.trim();
  if (!intent) return err(400, 'MISSING_INTENT', 'Intent is required');
  
  const intentHash = await sha256(intent);

  // 1. FAST-PATH: Try Deterministic Failsafe First
  const failsafe = getFailsafePlan(intent);
  if (failsafe) {
    console.log('[AI Route] Failsafe Triggered for Intent:', intent);
    return NextResponse.json({
      ok: true,
      plan: failsafe,
      meta: { model: 'failsafe', processingMs: Date.now() - start, intentHash, arcChainId: 5042002 },
    });
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
    console.error('[AI Final Failure]', msg);

    if (msg.includes('balance') || msg.includes('credit')) {
        return err(402, 'INSUFFICIENT_CREDITS', 'Your Anthropic key is low on credits. Please add credits or check your .env key.', msg);
    }
    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      return err(429, 'AI_QUOTA_EXCEEDED', 'All AI providers are currently busy. Please wait a moment.');
    }
    return err(502, 'BRAIN_FAILURE', 'All AI neurons failed to activate.', msg);
  }

  // 3. VALIDATION: Parse and Validate
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawText;
    const parsed = JSON.parse(jsonStr.trim());
    
    const { valid, errors, plan } = validateFlowPlan(parsed);
    if (!valid || !plan) return err(502, 'INVALID_PLAN_SCHEMA', 'AI brain returned malformed logic', errors.join('; '));

    return NextResponse.json({
      ok: true,
      plan,
      meta: { model: providerToUse, processingMs: Date.now() - start, intentHash, arcChainId: 5042002 },
    });
  } catch {
    return err(502, 'PARSE_ERROR', 'AI response could not be understood as a financial plan.');
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST /api/ai' } }, { status: 405 });
}
