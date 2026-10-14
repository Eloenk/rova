import type { FxPair } from './rates';
import { getIndicativeRate } from './rates';

export const QUOTE_PROVIDERS = ['provider-a', 'provider-b', 'provider-c'] as const;
export type QuoteProviderId = typeof QUOTE_PROVIDERS[number];

const providerBias: Record<QuoteProviderId, number> = {
  'provider-a': 0,
  'provider-b': 0,
  'provider-c': 0,
};

function driftProvider(id: QuoteProviderId) {
  providerBias[id] = +(providerBias[id] + (Math.random() - 0.5) * 0.003).toFixed(6);
  providerBias[id] = Math.max(-0.006, Math.min(0.006, providerBias[id]));
  return providerBias[id];
}

export function quoteFor(id: QuoteProviderId, midRate: number): number {
  return +(midRate * (1 + driftProvider(id))).toFixed(6);
}

export interface ShoppedQuote {
  provider: QuoteProviderId;
  rate: number;
  paidUsdc: number;
  txRef: string;
}

export async function shopRates(pair: FxPair, _baseUrl: string): Promise<ShoppedQuote[]> {
  const midRate = getIndicativeRate(pair);
  return Promise.all(
    QUOTE_PROVIDERS.map(async provider => ({
      provider,
      rate: quoteFor(provider, midRate),
      paidUsdc: 0,
      txRef: `quote-simulation-${provider}-${Date.now()}`,
    })),
  );
}

export function pickBest(quotes: ShoppedQuote[], wantHighRate: boolean): ShoppedQuote {
  if (quotes.length === 0) throw new Error('No quotes were returned');
  return quotes.reduce((best, quote) => {
    const better = wantHighRate ? quote.rate > best.rate : quote.rate < best.rate;
    return better ? quote : best;
  });
}
