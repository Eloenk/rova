import dotenv from 'dotenv';
import path from 'path';
import Module from 'module';

// Mock 'server-only' package for CLI script context
const origLoad = (Module as any)._load;
(Module as any)._load = function (request: string, parent: any, isMain: boolean) {
  if (request === 'server-only') return {};
  return origLoad.apply(this, arguments);
};

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runTestSwap() {
  const { executeSwap } = await import('../lib/swapService');

  const ownerWallet = process.env.ROVA_OWNER_WALLET;
  if (!ownerWallet) {
    throw new Error('ROVA_OWNER_WALLET not found in environment');
  }

  const sellCurrency = (process.argv[2] as 'USDC' | 'EURC') || 'USDC';
  const buyCurrency = (process.argv[3] as 'USDC' | 'EURC') || 'EURC';
  const amount = parseFloat(process.argv[4]) || 10;

  console.log('==================================================================');
  console.log('              ROVA APPKIT NATIVE SWAP TESTER                      ');
  console.log('==================================================================');
  console.log(`Wallet Address: ${ownerWallet}`);
  console.log(`Swap Intent:    ${amount} ${sellCurrency} -> ${buyCurrency}`);
  console.log('------------------------------------------------------------------');

  try {
    const result = await executeSwap({
      walletAddress: ownerWallet,
      sellCurrency,
      buyCurrency,
      amount,
    });

    console.log('✅ SWAP SUCCESSFUL!');
    console.log(`   TxHash:     ${result.txHash}`);
    console.log(`   ArcScan:    ${result.arcScanUrl}`);
    console.log(`   Rate:       1 ${sellCurrency} = ${result.quote.exchangeRate} ${buyCurrency}`);
    console.log(`   Min Output: ${result.quote.minBuyAmount} ${buyCurrency}`);
  } catch (err) {
    console.error('❌ SWAP FAILED:', err);
    process.exit(1);
  }
}

runTestSwap();
