import "server-only";

/**
 * ── Single-File Swap Method Abstraction (lib/swapService.ts) ────────────────
 * All swap operations across the Rova platform route through this file.
 * Server-only — never import this from a client component.
 *
 * Based on Circle's official arc-stablecoin-fx reference:
 * https://github.com/circlefin/arc-stablecoin-fx/blob/master/src/lib/appkit/swap.ts
 */

export interface SwapOptions {
  walletAddress: string;
  sellCurrency: "USDC" | "EURC";
  buyCurrency: "USDC" | "EURC";
  amount: number;
  maxSlippageBps?: number;
}

export interface SwapQuote {
  sellCurrency: "USDC" | "EURC";
  buyCurrency: "USDC" | "EURC";
  sellAmount: number;
  estimatedBuyAmount: number;
  exchangeRate: number;
  slippageBps: number;
  minBuyAmount: number;
}

/** Live swap quotes are outside the reviewed mainnet release. */
export async function getSwapQuote(
  opts: Omit<SwapOptions, "walletAddress"> & { walletAddress?: string }
): Promise<SwapQuote> {
  void opts;
  throw new Error('Live swap quotes are disabled in the Arc mainnet release.');
}

/** Mainnet execution stub. */
export async function executeSwap(
  opts: SwapOptions
): Promise<{ txHash: string; success: boolean; arcScanUrl: string; quote: SwapQuote }> {
  void opts;
  throw new Error('Swap execution is disabled in the Arc mainnet release.');
}
