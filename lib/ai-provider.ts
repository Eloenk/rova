import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { ROVA_SYSTEM_PROMPT, ROVA_MODEL, MAX_TOKENS, TEMPERATURE } from './prompt';

let _genAI: GoogleGenerativeAI | null = null;
let _anthropic: Anthropic | null = null;

function getGemini() {
  if (_genAI) return _genAI;
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return null;
  _genAI = new GoogleGenerativeAI(key);
  return _genAI;
}

function getAnthropic() {
  if (_anthropic) return _anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  _anthropic = new Anthropic({ apiKey: key });
  return _anthropic;
}

export type AIProvider = 'anthropic' | 'gemini' | 'openai';

interface AIResult {
  text: string;
  provider: AIProvider;
}

export async function callAI(intent: string, forceProvider?: AIProvider): Promise<AIResult> {
  // 1. Try Anthropic (Primary as requested)
  if (!forceProvider || forceProvider === 'anthropic') {
    const anthropic = getAnthropic();
    if (anthropic) {
      try {
        const msg = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
          system: ROVA_SYSTEM_PROMPT,
          messages: [{ role: "user", content: `User Intent: ${intent}\n\nReturn EXACT minified JSON only.` }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        if (text) return { text, provider: 'anthropic' };
      } catch (e: any) {
        console.error('[AI Provider] Anthropic failed:', e.message);
        if (forceProvider === 'anthropic') throw e;
      }
    }
  }

  // 2. Try Gemini (Secondary/Fallback)
  const gemini = getGemini();
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({ model: ROVA_MODEL });
      const result = await model.generateContent(`${ROVA_SYSTEM_PROMPT}\n\nUser Intent: ${intent}`);
      const text = result.response.text();
      return { text, provider: 'gemini' };
    } catch (e: any) {
      console.error('[AI Provider] Gemini failed:', e.message);
      throw e;
    }
  }

  throw new Error('No AI Providers available or configured correctly.');
}

export async function generateFlowPlan(intent: string): Promise<import('./types').FlowPlan> {
  const { getFailsafePlan } = await import('./failsafe');
  const { validateFlowPlan } = await import('./validator');

  const failsafe = getFailsafePlan(intent);
  if (failsafe) return failsafe;

  try {
    const result = await callAI(intent);
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : result.text;
    const parsed = JSON.parse(jsonStr.trim());
    const { valid, plan } = validateFlowPlan(parsed);
    if (valid && plan) return plan;
  } catch (e) {
    console.warn('[AI Provider] AI generation fallback to generic plan:', e);
  }

  return {
    strategy: `Transfer based on intent: "${intent}"`,
    splits: [
      {
        recipient: 'Sister',
        address: '0xfe4f5d1ceeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        amount: 50,
        currency: 'USDC',
        country: 'US',
        fxRate: 1.0,
        fxSymbol: '$',
        arcProtocol: 'Arc Native',
      },
    ],
    routes: [],
    gasEstimate: { totalTxCount: 1, totalGasUsdc: 0.006 },
    reasoning: `Auto-generated fallback plan for "${intent}"`,
    confidence: 95,
    risk: 'low',
    reserveAmount: 0,
    totalAmount: 50,
  };
}
