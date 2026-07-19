import type { FlowPlan } from './types';

const ADDRESS_RE  = /^0x[0-9a-fA-F]{4,40}$/;
const RISK_SET    = new Set(['low', 'medium', 'high']);
const BRIDGE_SET  = new Set(['cctp', 'gateway', 'native', 'stablefx', null]);
const PROTO_SET   = new Set(['Arc Native', 'CCTP V2', 'Circle Gateway', 'Arc StableFX', 'Agent Reserve']);
const ARC_GAS     = 0.006;

export interface ValidationResult { valid: boolean; errors: string[]; plan?: FlowPlan; }

function checkSplit(s: Record<string, unknown>, i: number): string[] {
  const e: string[] = [];
  if (typeof s.recipient   !== 'string' || !s.recipient.trim())         e.push(`splits[${i}].recipient required`);
  if (typeof s.address     !== 'string' || !ADDRESS_RE.test(s.address)) e.push(`splits[${i}].address must be 0x...`);
  if (typeof s.amount      !== 'number' || s.amount < 0)                e.push(`splits[${i}].amount must be >= 0`);
  if (!['USDC','EURC'].includes(s.currency as string))                  e.push(`splits[${i}].currency must be USDC or EURC`);
  if (typeof s.fxRate      !== 'number' || s.fxRate <= 0)               e.push(`splits[${i}].fxRate must be > 0`);
  if (typeof s.fxSymbol    !== 'string' || !s.fxSymbol.trim())          e.push(`splits[${i}].fxSymbol required`);
  if (typeof s.arcProtocol !== 'string' || !PROTO_SET.has(s.arcProtocol as string)) {
    e.push(`splits[${i}].arcProtocol must be one of: ${[...PROTO_SET].join(', ')}`);
  }
  return e;
}

function checkRoute(r: Record<string, unknown>, i: number): string[] {
  const e: string[] = [];
  if (typeof r.from !== 'string' || !r.from.trim())    e.push(`routes[${i}].from required`);
  if (typeof r.to   !== 'string' || !r.to.trim())      e.push(`routes[${i}].to required`);
  if (typeof r.via  !== 'string' || !r.via.trim())     e.push(`routes[${i}].via required`);
  if (typeof r.fee  !== 'number' || r.fee < 0)         e.push(`routes[${i}].fee must be >= 0`);
  if (!BRIDGE_SET.has(r.bridgeType as string | null))  e.push(`routes[${i}].bridgeType invalid`);
  if (r.cctpDomain !== null && typeof r.cctpDomain !== 'number') e.push(`routes[${i}].cctpDomain must be number or null`);
  return e;
}

function checkGas(g: unknown): string[] {
  if (!g || typeof g !== 'object') return ['gasEstimate must be an object'];
  const obj = g as Record<string, unknown>;
  const e: string[] = [];
  if (typeof obj.totalTxCount !== 'number' || obj.totalTxCount < 1) e.push('gasEstimate.totalTxCount must be >= 1');
  if (typeof obj.totalGasUsdc !== 'number' || obj.totalGasUsdc < 0) e.push('gasEstimate.totalGasUsdc must be >= 0');
  if (typeof obj.totalTxCount === 'number' && typeof obj.totalGasUsdc === 'number') {
    const expected = obj.totalTxCount * ARC_GAS;
    if (Math.abs(obj.totalGasUsdc - expected) > 0.02) {
      e.push(`gasEstimate.totalGasUsdc should be ~${expected.toFixed(3)} (${obj.totalTxCount} × $${ARC_GAS})`);
    }
  }
  return e;
}

export function validateFlowPlan(raw: unknown): ValidationResult {
  const e: string[] = [];
  if (typeof raw !== 'object' || raw === null) return { valid: false, errors: ['Response is not a JSON object'] };

  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.splits) || !obj.splits.length)  e.push('splits must be a non-empty array');
  else (obj.splits as Record<string, unknown>[]).forEach((s, i) => e.push(...checkSplit(s, i)));

  if (!Array.isArray(obj.routes)) e.push('routes must be an array');
  else (obj.routes as Record<string, unknown>[]).forEach((r, i) => e.push(...checkRoute(r, i)));

  e.push(...checkGas(obj.gasEstimate));

  if (typeof obj.reasoning   !== 'string' || obj.reasoning.trim().length < 20) e.push('reasoning must be >= 20 chars');
  if (typeof obj.confidence  !== 'number' || obj.confidence < 0 || obj.confidence > 100) e.push('confidence must be 0-100');
  if (!RISK_SET.has(obj.risk as string)) e.push('risk must be low/medium/high');
  if (typeof obj.reserveAmount !== 'number' || obj.reserveAmount < 0) e.push('reserveAmount must be >= 0');
  if (typeof obj.totalAmount   !== 'number' || obj.totalAmount <= 0)  e.push('totalAmount must be > 0');
  if (typeof obj.strategy      !== 'string' || !obj.strategy.trim())  e.push('strategy required');

  if (Array.isArray(obj.splits) && typeof obj.reserveAmount === 'number' && typeof obj.totalAmount === 'number') {
    const splitSum = (obj.splits as Record<string, unknown>[]).reduce((acc, s) => acc + (typeof s.amount === 'number' ? s.amount : 0), 0);
    const expected = obj.totalAmount - obj.reserveAmount;
    if (Math.abs(splitSum - expected) > 1) {
      e.push(`Amount invariant: sum(splits)=${splitSum.toFixed(2)} ≠ totalAmount-reserveAmount=${expected.toFixed(2)}`);
    }
  }

  if (e.length) return { valid: false, errors: e };
  return { valid: true, errors: [], plan: obj as unknown as FlowPlan };
}
