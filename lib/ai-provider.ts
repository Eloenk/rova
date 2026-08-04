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
    provider: 'gemini' | 'anthropic' | 'agentrouter' | 'auto';
    model: string;
    temperature: number;
    max_tokens: number;
  };
  database?: {
    supabase_enabled: boolean;
  };
}

const defaultConfig: RovaAIConfig = {
  ai: {
    provider: 'gemini',
    model: ROVA_MODEL || 'gemini-2.0-flash',
    temperature: TEMPERATURE || 0.1,
    max_tokens: MAX_TOKENS || 8192,
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
        };
      }
    }
  } catch (err) {
    console.warn('[AI Provider] Error loading config.yaml, using defaults:', err);
  }
  return defaultConfig;
}

export function getIsMockMode(): boolean {
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

export type AIProvider = 'anthropic' | 'gemini' | 'openai' | 'agentrouter';

interface AIResult {
  text: string;
  provider: AIProvider;
}

async function callAgentRouter(intent: string, model: string, config: RovaAIConfig): Promise<AIResult> {
  const key = process.env.AGENTROUTER_API_KEY;
  const baseUrl = process.env.AGENTROUTER_BASE_URL || 'https://agentrouter.org/v1/chat/completions';
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (key) {
    headers['Authorization'] = `Bearer ${key}`;
  }

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || 'agent-router',
      messages: [
        { role: 'system', content: ROVA_SYSTEM_PROMPT },
        { role: 'user', content: `User Intent: ${intent}\n\nReturn EXACT minified JSON only.` },
      ],
      temperature: config.ai.temperature,
      max_tokens: config.ai.max_tokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AgentRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) {
    throw new Error('AgentRouter returned empty content');
  }

  return { text, provider: 'agentrouter' };
}

export async function callAI(intent: string, forceProvider?: AIProvider): Promise<AIResult> {
  const config = getRovaConfig();
  const targetProvider = forceProvider || (config.ai.provider === 'auto' ? 'anthropic' : config.ai.provider);
  const targetModel = config.ai.model || (targetProvider === 'anthropic' ? 'claude-3-5-sonnet-20240620' : ROVA_MODEL);

  // 1. Try AgentRouter if explicitly requested
  if (targetProvider === 'agentrouter') {
    return await callAgentRouter(intent, targetModel, config);
  }

  // 2. Try Anthropic if specified or selected
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
      }
    }
  }

  // 3. Try Gemini (SDK first, then direct REST API with X-goog-api-key)
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (apiKey) {
    const modelToUse = targetProvider === 'gemini' ? (targetModel || 'gemini-flash-latest') : 'gemini-flash-latest';
    const gemini = getGemini();
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({
          model: modelToUse,
          generationConfig: {
            temperature: config.ai.temperature,
            maxOutputTokens: config.ai.max_tokens,
          },
        });
        const result = await model.generateContent(`${ROVA_SYSTEM_PROMPT}\n\nUser Intent: ${intent}`);
        const text = result.response.text();
        if (text) return { text, provider: 'gemini' };
      } catch (e: any) {
        console.warn('[AI Provider] Gemini SDK failed, falling back to direct REST API:', e.message);
      }
    }

    try {
      const restRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${ROVA_SYSTEM_PROMPT}\n\nUser Intent: ${intent}` }] }],
        }),
      });
      if (restRes.ok) {
        const data = await restRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, provider: 'gemini' };
      }
    } catch (e: any) {
      console.error('[AI Provider] Gemini direct REST API failed:', e.message);
    }
  }

  // 4. Try AgentRouter in auto mode fallback
  if (process.env.AGENTROUTER_API_KEY || config.ai.provider === 'auto') {
    try {
      return await callAgentRouter(intent, targetModel, config);
    } catch (e: any) {
      console.error('[AI Provider] AgentRouter fallback failed:', e.message);
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
