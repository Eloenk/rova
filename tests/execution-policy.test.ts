import assert from 'node:assert/strict';
import test from 'node:test';
import { getFailsafePlan } from '../lib/failsafe';
import type { FlowPlan } from '../lib/types';
import { validateFlowPlan, validatePlanIntentBinding } from '../lib/validator';

function validPlan(overrides: Partial<FlowPlan> = {}): FlowPlan {
  return {
    splits: [{
      recipient: 'Recipient',
      address: '0x1111111111111111111111111111111111111111',
      amount: 10,
      currency: 'USDC',
      country: 'US',
      fxRate: 1,
      fxSymbol: '$',
      arcProtocol: 'Arc Native',
    }],
    routes: [],
    gasEstimate: { totalTxCount: 1, totalGasUsdc: 0.006 },
    reasoning: 'A deterministic transfer plan with an explicit recipient address.',
    confidence: 100,
    risk: 'low',
    reserveAmount: 0,
    totalAmount: 10,
    strategy: 'Arc transfer',
    ...overrides,
  };
}

test('rejects a zero-address native transfer', () => {
  const plan = validPlan({
    splits: [{
      ...validPlan().splits[0],
      address: '0x0000000000000000000000000000000000000000',
    }],
  });
  assert.equal(validateFlowPlan(plan).valid, false);
});

test('rejects unknown protocols instead of falling through to transfer', () => {
  const plan = validPlan({
    splits: [{ ...validPlan().splits[0], arcProtocol: 'Unreviewed Protocol' }],
  });
  assert.equal(validateFlowPlan(plan).valid, false);
});

test('rejects non-USDC native transfers', () => {
  const plan = validPlan({
    splits: [{ ...validPlan().splits[0], currency: 'EURC' }],
  });
  assert.equal(validateFlowPlan(plan).valid, false);
});

test('rejects oversized split collections', () => {
  const split = validPlan().splits[0];
  const splits = Array.from({ length: 11 }, (_, index) => ({
    ...split,
    address: `0x${(index + 1).toString(16).padStart(40, '0')}`,
  }));
  const plan = validPlan({ splits, totalAmount: 110 });
  assert.equal(validateFlowPlan(plan).valid, false);
});

test('does not fabricate a native-transfer recipient', () => {
  assert.equal(getFailsafePlan('send 10 USDC'), null);
});

test('builds a valid transfer only with an explicit address', () => {
  const plan = getFailsafePlan('send 10 USDC to 0x1111111111111111111111111111111111111111');
  assert.ok(plan);
  assert.equal(validateFlowPlan(plan).valid, true);
});

test('rejects an AI-selected transfer address absent from the user intent', () => {
  const plan = validPlan();
  assert.deepEqual(validatePlanIntentBinding(plan, 'send 10 USDC to my friend'), [
    'splits[0].address was not explicitly supplied by the user',
  ]);
});

test('accepts a transfer address copied exactly from the user intent', () => {
  const plan = validPlan();
  assert.deepEqual(
    validatePlanIntentBinding(plan, 'send 10 USDC to 0x1111111111111111111111111111111111111111'),
    [],
  );
});
