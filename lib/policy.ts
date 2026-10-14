import 'server-only';

import { serverEnv } from './env/server';

export type ExecutionKind = 'manual' | 'autonomous';

export function assertPermittedAmount(amount: number, kind: ExecutionKind): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a positive finite number');
  }

  const limit = kind === 'autonomous'
    ? serverEnv.autonomousAmountLimitUsdc
    : serverEnv.manualAmountLimitUsdc;
  if (amount > limit) {
    throw new Error(`${kind === 'autonomous' ? 'Autonomous' : 'Manual'} execution is limited to ${limit} USDC`);
  }
}

export function assertPermittedPlan(plan: { splits?: Array<{ amount?: number }> }, kind: ExecutionKind): void {
  const splits = plan.splits || [];
  if (!splits.length) throw new Error('Execution plan must contain at least one split');

  const total = splits.reduce((sum, split) => sum + Number(split.amount || 0), 0);
  assertPermittedAmount(total, kind);
}
