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

const FLOW_PLAN_SCHEMA = {
  type: "object",
  properties: {
    splits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          recipient: { type: "string" },
          address: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string", enum: ["USDC", "EURC", "USYC"] },
          fxRate: { type: "number" },
          fxSymbol: { type: "string" },
          arcProtocol: {
            type: "string",
            enum: ["Arc Native", "CCTP V2", "Circle Gateway", "Arc StableFX", "Arc Yield (USYC)", "Node Staking", "Agent Reserve", "ERC-8183 Job"]
          },
          jobMetadata: {
            type: "object",
            properties: {
              provider: { type: "string" },
              evaluator: { type: "string" },
              description: { type: "string" },
              expiryDays: { type: "number" }
            },
            required: ["provider", "description"]
          }
        },
        required: ["recipient", "address", "amount", "currency", "fxRate", "fxSymbol", "arcProtocol"]
      }
    },
    routes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          via: { type: "string" },
          bridgeType: { type: "string", enum: ["cctp", "gateway", "native", "stablefx", "yield", "staking"] }
        },
        required: ["from", "to", "via", "bridgeType"]
      }
    },
    gasEstimate: {
      type: "object",
      properties: {
        totalTxCount: { type: "number" },
        totalGasUsdc: { type: "number" }
      },
      required: ["totalTxCount", "totalGasUsdc"]
    },
    reasoning: { type: "string" },
    confidence: { type: "number" },
    risk: { type: "string", enum: ["low", "medium", "high"] },
    totalAmount: { type: "number" },
    reserveAmount: { type: "number" },
    strategy: { type: "string" }
  },
  required: ["splits", "routes", "gasEstimate", "reasoning", "confidence", "risk", "totalAmount", "reserveAmount", "strategy"]
};

const anthropicTool = {
  name: "format_flow_plan",
  description: "Constructs the structured execution plan from the user's money movement intent.",
  input_schema: FLOW_PLAN_SCHEMA as any
};

export async function callAI(intent: string, forceProvider?: AIProvider): Promise<AIResult> {
  // 1. Try Anthropic (Primary)
  if (!forceProvider || forceProvider === 'anthropic') {
    const anthropic = getAnthropic();
    if (anthropic) {
      try {
        const msg = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
          system: ROVA_SYSTEM_PROMPT,
          messages: [{ role: "user", content: `User Intent: ${intent}` }],
          tools: [anthropicTool],
          tool_choice: { type: 'tool', name: 'format_flow_plan' }
        });
        
        const toolUseBlock = msg.content.find(c => c.type === 'tool_use') as any;
        if (toolUseBlock) {
          const text = JSON.stringify(toolUseBlock.input);
          return { text, provider: 'anthropic' };
        }
      } catch (e: any) {
        console.error('[AI Provider] Anthropic failed:', e.message);
        if (forceProvider === 'anthropic') throw e;
      }
    }
  }

  // 2. Try Gemini (Fallback)
  const gemini = getGemini();
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({
        model: ROVA_MODEL,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: FLOW_PLAN_SCHEMA as any
        }
      });
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
