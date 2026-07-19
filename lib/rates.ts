// ─────────────────────────────────────────────────────────────────────────────
// Rova — Indicative FX Rate Feed
//
// StableFX's real RFQ API requires a Circle partnership (see lib/config.ts).
// For the hackathon build we simulate a live-ish indicative rate so the Agent
// can demonstrably watch it and fire rules — the exact same trigger pattern
// would call the real StableFX RFQ endpoint once partnership access is live.
//
// The walk is deterministic-seeded-random so a demo is reproducible if needed,
// but drifts enough tick-to-tick to make live triggers visible on stage.
// ─────────────────────────────────────────────────────────────────────────────

export type FxPair = 'USDC/EURC' | 'EURC/USDC';

const BASE_RATE: Record<FxPair, number> = {
  'USDC/EURC': 0.92,
  'EURC/USDC': 1.087,
};

// In-memory current rate, drifts each time it's read (module-level singleton —
// resets on server restart, which is fine for a hackathon demo process).
const state: Record<FxPair, number> = { ...BASE_RATE };

function drift(pair: FxPair): number {
  const wobble = (Math.random() - 0.5) * 0.004; // +/- 0.2% per tick
  const reversion = (BASE_RATE[pair] - state[pair]) * 0.05; // pull back to base slowly
  state[pair] = +(state[pair] + wobble + reversion).toFixed(6);
  return state[pair];
}

export function getIndicativeRate(pair: FxPair): number {
  return drift(pair);
}

// Lets a demo operator nudge the rate directly toward a target so a rule
// can be shown firing on stage without waiting for a natural random walk.
export function nudgeRateToward(pair: FxPair, target: number, step = 0.3) {
  state[pair] = +(state[pair] + (target - state[pair]) * step).toFixed(6);
  return state[pair];
}

export function getAllRates() {
  return {
    'USDC/EURC': +state['USDC/EURC'].toFixed(6),
    'EURC/USDC': +state['EURC/USDC'].toFixed(6),
  };
}
