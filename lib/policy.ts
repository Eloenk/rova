import 'server-only';

export type ExecutionKind = 'manual' | 'autonomous';

function readPositiveLimit(variableName: string, fallback: number): number {
  const configured = Number(process.env[variableName]);
  return Number.isFinite(configured) && configured > 0 ? configured : fallback;
}

export function assertPermittedAmount(amount: number, kind: ExecutionKind): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a positive finite number');
  }

  const limit = kind === 'autonomous'
    ? readPositiveLimit('ROVA_MAX_AUTONOMOUS_AMOUNT_USDC', 100)
    : readPositiveLimit('ROVA_MAX_MANUAL_AMOUNT_USDC', 1_000);
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
