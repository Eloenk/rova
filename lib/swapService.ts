import "server-only";

import { AppKit, SwapChain } from "@circle-fin/app-kit";
import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";
import { arcScan } from "./config";

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

const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%

// ── Singletons (same pattern as Circle's reference app) ─────────────────────
let cachedKit: AppKit | null = null;
let cachedAdapter: ReturnType<typeof createCircleWalletsAdapter> | null = null;

function getKit(): AppKit {
  if (!cachedKit) cachedKit = new AppKit();
  return cachedKit;
}

function getAdapter(): ReturnType<typeof createCircleWalletsAdapter> {
  if (cachedAdapter) return cachedAdapter;
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  if (!apiKey || !entitySecret) {
    throw new Error("CIRCLE_API_KEY / CIRCLE_ENTITY_SECRET not configured");
  }
  cachedAdapter = createCircleWalletsAdapter({ apiKey, entitySecret });
  return cachedAdapter;
}

/**
 * Resolve the SwapChain from NEXT_PUBLIC_ARC_CHAIN env var.
 * Circle's official pattern: SwapChain[NEXT_PUBLIC_ARC_CHAIN]
 */
function getSwapChain(): SwapChain {
  const chainKey = (process.env.NEXT_PUBLIC_ARC_CHAIN || "Arc_Testnet") as keyof typeof SwapChain;
  const resolved = SwapChain[chainKey];
  if (!resolved) {
    throw new Error(
      `NEXT_PUBLIC_ARC_CHAIN must be a SwapChain identifier (got "${chainKey}"). ` +
      `Valid values: ${Object.keys(SwapChain).join(", ")}`
    );
  }
  return resolved;
}

function getKitKey(): string {
  const kitKey = process.env.KIT_KEY || process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY || "";
  if (!kitKey) {
    throw new Error("KIT_KEY not configured — required for AppKit swap");
  }
  return kitKey;
}

/**
 * Get a live price quote via kit.estimateSwap() — never a hardcoded rate.
 */
export async function getSwapQuote(
  opts: Omit<SwapOptions, "walletAddress"> & { walletAddress?: string }
): Promise<SwapQuote> {
  const slippageBps = opts.maxSlippageBps ?? DEFAULT_SLIPPAGE_BPS;
  const walletAddress = opts.walletAddress ?? "0x0000000000000000000000000000000000000000";

  const result = await getKit().estimateSwap({
    from: { adapter: getAdapter(), chain: getSwapChain(), address: walletAddress },
    tokenIn: opts.sellCurrency,
    tokenOut: opts.buyCurrency,
    amountIn: String(opts.amount),
    config: { kitKey: getKitKey() },
  });

  const estimatedBuyAmount = Number(result.estimatedOutput.amount);
  const exchangeRate = opts.amount > 0 ? estimatedBuyAmount / opts.amount : 0;
  const minBuyAmount = estimatedBuyAmount * (1 - slippageBps / 10000);

  return {
    sellCurrency: opts.sellCurrency,
    buyCurrency: opts.buyCurrency,
    sellAmount: opts.amount,
    estimatedBuyAmount: Number(estimatedBuyAmount.toFixed(6)),
    exchangeRate: Number(exchangeRate.toFixed(6)),
    slippageBps,
    minBuyAmount: Number(minBuyAmount.toFixed(6)),
  };
}

/**
 * Execute a swap via kit.swap() — Circle's native AppKit execution.
 */
export async function executeSwap(
  opts: SwapOptions
): Promise<{ txHash: string; success: boolean; arcScanUrl: string; quote: SwapQuote }> {
  if (opts.sellCurrency === opts.buyCurrency) {
    throw new Error("sellCurrency and buyCurrency must differ");
  }
  if (opts.amount <= 0) {
    throw new Error("amount must be positive");
  }

  const quote = await getSwapQuote(opts);
  const slippageBps = opts.maxSlippageBps ?? DEFAULT_SLIPPAGE_BPS;

  console.log(
    `[SwapService] Executing swap: ${opts.amount} ${opts.sellCurrency} -> ~${quote.estimatedBuyAmount} ${opts.buyCurrency} (min ${quote.minBuyAmount})`
  );

  const params = {
    from: { adapter: getAdapter(), chain: getSwapChain(), address: opts.walletAddress },
    tokenIn: opts.sellCurrency,
    tokenOut: opts.buyCurrency,
    amountIn: String(opts.amount),
  };

  const baseConfig = {
    kitKey: getKitKey(),
    slippageBps,
  };

  let result;
  try {
    result = await getKit().swap({ ...params, config: baseConfig });
  } catch (err) {
    // Counterfactual Circle smart wallets cannot produce EIP-1271 signatures
    // until they are deployed on-chain. Fall back to an on-chain approval,
    // which deploys the wallet as a side effect of the first transaction.
    if (isUndeployedWalletError(err)) {
      result = await getKit().swap({
        ...params,
        config: { ...baseConfig, allowanceStrategy: "approve" },
      });
    } else {
      console.error("[SwapService] kit.swap() failed:", String(err));
      throw err;
    }
  }

  const actualOut = Number(result.amountOut);
  if (actualOut < quote.minBuyAmount) {
    throw new Error(
      `Swap executed below slippage floor: got ${actualOut} ${opts.buyCurrency}, min was ${quote.minBuyAmount}`
    );
  }

  return {
    txHash: result.txHash,
    success: true,
    arcScanUrl: result.explorerUrl ?? arcScan.tx(result.txHash),
    quote,
  };
}

function isUndeployedWalletError(err: unknown): boolean {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "";
  return /undeployed wallet/i.test(message);
}
