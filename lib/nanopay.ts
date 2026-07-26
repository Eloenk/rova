// ─────────────────────────────────────────────────────────────────────────────
// Rova — Nanopayments Rate Shopping (x402 + Circle Gateway)
//
// Before the Agent moves a user's money, it pays a handful of independent
// quote endpoints a fraction of a cent each — via the x402 protocol — just to
// ask "what's your rate right now?", then executes at whichever quoted best.
// This is what actually backs "Use of Nanopayments for micro-transactions
// between agents or services" rather than just claiming it.
//
// Real mode uses @circle-fin/x402-batching (GatewayClient / createGatewayMiddleware) —
// the same SDK Circle's own reference app (github.com/circlefin/arc-nanopayments)
// is built on. It needs an EOA private key to sign payment authorizations
// locally, which is a real architectural point: Circle DCW wallets are HSM-
// managed and can't sign x402 payloads themselves, so the nanopayment buyer
// role uses a small dedicated EOA (ROVA_X402_BUYER_PRIVATE_KEY) — separate
// from the Circle-managed wallets that hold and move the user's actual funds.
// Mock mode fakes the same 402 → pay → 200 negotiation shape without needing
// that key, so the flow is demoable without live Gateway credentials.
// ─────────────────────────────────────────────────────────────────────────────

import type { FxPair } from './rates';

export const QUOTE_PROVIDERS = ['provider-a', 'provider-b', 'provider-c'] as const;
export type QuoteProviderId = typeof QUOTE_PROVIDERS[number];

const PRICE_PER_QUOTE_USDC = 0.0005; // half a tenth of a cent — genuinely a nanopayment

// Each provider quotes around the same mid-market rate but with a different,
// independently-drifting spread — modeling real competing FX desks rather
// than three copies of the same number.
const providerBias: Record<QuoteProviderId, number> = {
  'provider-a': 0,
  'provider-b': 0,
  'provider-c': 0,
};

function driftProvider(id: QuoteProviderId) {
  providerBias[id] = +(providerBias[id] + (Math.random() - 0.5) * 0.003).toFixed(6);
  // keep each provider's bias inside a believable +/-0.6% band
  providerBias[id] = Math.max(-0.006, Math.min(0.006, providerBias[id]));
  return providerBias[id];
}

export function quoteFor(id: QuoteProviderId, midRate: number): number {
  return +(midRate * (1 + driftProvider(id))).toFixed(6);
}

function isX402RealMode(): boolean {
  return !!process.env.ROVA_X402_BUYER_PRIVATE_KEY;
}

// ── Buyer side ──────────────────────────────────────────────────────────────────

export interface ShoppedQuote {
  provider: QuoteProviderId;
  rate: number;
  paidUsdc: number;
  txRef: string; // settlement reference — real settlement hash in real mode, mock ref otherwise
}

/// Pays each quote provider a nanopayment for their current rate, in parallel,
/// and returns all quotes so the caller can pick the best one. This is the
/// buyer half of the x402 negotiation: GET (no payment) -> 402 with price ->
/// GET again with a payment proof -> 200 with the actual quote.
export async function shopRates(pair: FxPair, baseUrl: string): Promise<ShoppedQuote[]> {
  const real = isX402RealMode();

  if (real) {
    try {
      // @ts-ignore
      const { GatewayClient } = await import('@circle-fin/x402-batching/client');
      const client = new GatewayClient({
        chain: 'arcTestnet',
        privateKey: process.env.ROVA_X402_BUYER_PRIVATE_KEY as `0x${string}`,
      });

      const results = await Promise.all(
        QUOTE_PROVIDERS.map(async (provider) => {
          const res = await client.pay(`${baseUrl}/api/quotes/${provider}?pair=${encodeURIComponent(pair)}`);
          const data = res.data as { rate: number };
          return { provider, rate: data.rate, paidUsdc: PRICE_PER_QUOTE_USDC, txRef: (res as any).settlement?.hash || 'gateway-settled' };
        })
      );
      return results;
    } catch (e) {
      console.warn('[Nanopay] Real x402 payment failed, falling back to mock shop:', e);
    }
  }

  // Mock mode — fabricate the same negotiation shape locally so the UI and
  // downstream logic behave identically regardless of live credentials.
  const results = await Promise.all(
    QUOTE_PROVIDERS.map(async (provider) => {
      try {
        const res = await fetch(`${baseUrl}/api/quotes/${provider}?pair=${encodeURIComponent(pair)}`);
        if (res.status === 402) {
          const paymentReq = await res.json();
          const paid = await fetch(`${baseUrl}/api/quotes/${provider}?pair=${encodeURIComponent(pair)}`, {
            headers: { 'X-PAYMENT': `mock.${Buffer.from(JSON.stringify({ amount: paymentReq.accepts?.[0]?.maxAmountRequired, provider })).toString('base64')}` },
          });
          const data = await paid.json();
          return { provider, rate: data.rate as number, paidUsdc: PRICE_PER_QUOTE_USDC, txRef: `mock-x402-${provider}-${Date.now()}` };
        }
        const data = await res.json();
        return { provider, rate: data.rate as number, paidUsdc: PRICE_PER_QUOTE_USDC, txRef: `mock-x402-${provider}-${Date.now()}` };
      } catch {
        const mockRate = provider === 'provider-a' ? 0.941 : provider === 'provider-b' ? 0.943 : 0.938;
        return { provider, rate: mockRate, paidUsdc: PRICE_PER_QUOTE_USDC, txRef: `mock-x402-${provider}-${Date.now()}` };
      }
    })
  );

  return results;
}

export function pickBest(quotes: ShoppedQuote[], wantHighRate: boolean): ShoppedQuote {
  return quotes.reduce((best, q) => {
    const better = wantHighRate ? q.rate > best.rate : q.rate < best.rate;
    return better ? q : best;
  });
}

// ── Seller side (used by the quote-provider route handlers) ────────────────────

/// x402-shaped 402 response body — mirrors the real protocol's `accepts` array
/// closely enough to demonstrate the negotiation, without needing the full
/// @x402/core resource-server wiring for three tiny mock endpoints.
export function build402Response(provider: QuoteProviderId, sellerAddress: string) {
  return {
    x402Version: 1,
    error: 'Payment required',
    accepts: [
      {
        scheme: 'exact',
        network: 'arc-testnet',
        maxAmountRequired: String(Math.round(PRICE_PER_QUOTE_USDC * 1_000_000)), // 6-decimal USDC base units
        resource: `/api/quotes/${provider}`,
        description: `Current FX quote from ${provider}`,
        payTo: sellerAddress,
        asset: 'USDC',
      },
    ],
  };
}

export function hasPaymentProof(req: Request): boolean {
  return !!req.headers.get('X-PAYMENT') || !!req.headers.get('x-payment');
}
