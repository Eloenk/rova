import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { ROVA_SYSTEM_PROMPT, ROVA_MODEL, MAX_TOKENS, TEMPERATURE } from './prompt';

let _genAI: GoogleGenerativeAI | null = null;
let _anthropic: Anthropic | null = null;

export interface RovaAIConfig {
  ai: {
    provider: 'gemini' | 'anthropic' | 'auto';
    model: string;
    temperature: number;
    max_tokens: number;
  };
  database?: {
    supabase_enabled: boolean;
  };
  execution?: {
    mock_mode?: boolean;
    fallback_to_mock?: boolean;
  };
}

const defaultConfig: RovaAIConfig = {
  ai: {
    provider: 'gemini',
    model: ROVA_MODEL || 'gemini-2.0-flash',
    temperature: TEMPERATURE || 0.1,
    max_tokens: MAX_TOKENS || 8192,
  },
  execution: {
    mock_mode: false,
    fallback_to_mock: false,
  },
};

export function getRovaConfig(): RovaAIConfig {
  try {
    const configPath = path.join(process.cwd(), 'config.yaml');
    if (fs.existsSync(configPath)) {
      const fileContents = fs.readFileSync(configPath, 'utf8');
      const parsed = yaml.load(fileContents) as RovaAIConfig;
      if (parsed && parsed.ai) {
        return {
          ai: {
            provider: parsed.ai.provider || defaultConfig.ai.provider,
            model: parsed.ai.model || defaultConfig.ai.model,
            temperature: parsed.ai.temperature ?? defaultConfig.ai.temperature,
            max_tokens: parsed.ai.max_tokens ?? defaultConfig.ai.max_tokens,
          },
          database: parsed.database,
          execution: parsed.execution || defaultConfig.execution,
        };
      }
    }
  } catch (err) {
    console.warn('[AI Provider] Error loading config.yaml, using defaults:', err);
  }
  return defaultConfig;
}

export function getIsMockMode(): boolean {
  const config = getRovaConfig();
  if (config.execution && typeof config.execution.mock_mode === 'boolean') {
    return config.execution.mock_mode;
  }
  return false;
}

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
  const config = getRovaConfig();
  const targetProvider = forceProvider || (config.ai.provider === 'auto' ? 'anthropic' : config.ai.provider);
  const targetModel = config.ai.model || (targetProvider === 'anthropic' ? 'claude-3-5-sonnet-20240620' : ROVA_MODEL);

  // 1. Try Anthropic if specified or selected
  if (targetProvider === 'anthropic' || (config.ai.provider === 'auto' && !forceProvider)) {
    const anthropic = getAnthropic();
    if (anthropic) {
      try {
        const msg = await anthropic.messages.create({
          model: targetModel,
          max_tokens: config.ai.max_tokens,
          temperature: config.ai.temperature,
          system: ROVA_SYSTEM_PROMPT,
          messages: [{ role: "user", content: `User Intent: ${intent}\n\nReturn EXACT minified JSON only.` }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        if (text) return { text, provider: 'anthropic' };
      } catch (e: any) {
        console.error('[AI Provider] Anthropic failed:', e.message);
        if (forceProvider === 'anthropic' || targetProvider === 'anthropic') {
          // If gemini key is available, fallback to gemini before erroring
          const gemini = getGemini();
          if (!gemini) throw e;
        }
      }
    }
  }

  // 2. Try Gemini
  const gemini = getGemini();
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({
        model: targetProvider === 'gemini' ? targetModel : ROVA_MODEL,
        generationConfig: {
          temperature: config.ai.temperature,
          maxOutputTokens: config.ai.max_tokens,
        },
      });
      const result = await model.generateContent(`${ROVA_SYSTEM_PROMPT}\n\nUser Intent: ${intent}`);
      const text = result.response.text();
      return { text, provider: 'gemini' };
    } catch (e: any) {
      console.error('[AI Provider] Gemini failed:', e.message);
      throw e;
    }
  }

  throw new Error('No AI Providers available or configured correctly in environment / config.yaml.');
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
