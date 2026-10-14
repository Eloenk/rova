import type { FlowPlan } from './types';

const MANUAL_EXECUTION_PROTOCOLS = new Set(['Arc Native', 'Arc StableFX']);

export function unsupportedManualProtocols(plan: Pick<FlowPlan, 'splits'>): string[] {
  return [...new Set(
    plan.splits
      .map(split => split.arcProtocol)
      .filter(protocol => !MANUAL_EXECUTION_PROTOCOLS.has(protocol)),
  )];
}

export function isManualExecutionSupported(plan: Pick<FlowPlan, 'splits'>): boolean {
  return plan.splits.length > 0 && unsupportedManualProtocols(plan).length === 0;
}
