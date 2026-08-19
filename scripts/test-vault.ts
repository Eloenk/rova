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

async function runVaultTimelockTest() {
  const { executeAndConfirm } = await import('../lib/circle');
  const { TOKENS, arcScan } = await import('../lib/config');
  const { createPublicClient, http, parseAbi } = await import('viem');
  const { arcTestnet } = await import('../lib/arcChain');

  const ownerWallet = process.env.ROVA_OWNER_WALLET || process.env.CIRCLE_WALLET_ID;
  const vaultAddress = process.env.NEXT_PUBLIC_ROVA_SAVINGS_VAULT_ADDRESS || process.env.ROVA_SAVINGS_VAULT_ADDRESS || '0x9330DA5152Cc676a029cfaCCcA3948e11EDE9BfB';
  const usdcAddress = TOKENS.USDC.address;

  if (!ownerWallet) {
    throw new Error('ROVA_OWNER_WALLET or CIRCLE_WALLET_ID not configured in environment');
  }

  const amountUsdc = parseFloat(process.argv[2]) || 1.0;
  const lockDurationSeconds = parseInt(process.argv[3], 10) || 300; // 5 minutes (300 seconds)
  const amountInt = Math.round(amountUsdc * 10 ** TOKENS.USDC.decimals);

  console.log('==================================================================');
  console.log('         ROVA SAVINGS VAULT SMART CONTRACT TIMELOCK TESTER         ');
  console.log('==================================================================');
  console.log(`Wallet Address:   ${ownerWallet}`);
  console.log(`Vault Contract:   ${vaultAddress}`);
  console.log(`Deposit Amount:   ${amountUsdc} USDC (${amountInt} base units)`);
  console.log(`Lock Duration:    ${lockDurationSeconds} seconds (${Math.round(lockDurationSeconds / 60)} minutes)`);
  console.log('------------------------------------------------------------------');

  try {
    // ── Step 1: Approve USDC ───────────────────────────────────────────────────
    console.log('\n[1/4] Approving USDC allowance for RovaSavingsVault...');
    const approveTx = await executeAndConfirm({
      walletAddress: ownerWallet,
      contractAddress: usdcAddress,
      abiFunctionSignature: 'approve(address,uint256)',
      abiParameters: [vaultAddress, String(amountInt)],
    });
    console.log(`  ✅ USDC Approved! TxHash: ${approveTx}`);
    console.log(`     ArcScan: ${arcScan.tx(approveTx)}`);

    // ── Step 2: Deposit into RovaSavingsVault ──────────────────────────────────
    console.log('\n[2/4] Depositing savings into RovaSavingsVault...');
    const depositTx = await executeAndConfirm({
      walletAddress: ownerWallet,
      contractAddress: vaultAddress,
      abiFunctionSignature: 'depositSavings(address,uint256,uint256)',
      abiParameters: [usdcAddress, String(amountInt), String(lockDurationSeconds)],
    });
    console.log(`  ✅ Deposit Successful! TxHash: ${depositTx}`);
    console.log(`     ArcScan: ${arcScan.tx(depositTx)}`);

    // ── Step 3: Fetch latest depositId for user ────────────────────────────────
    console.log('\n[3/4] Querying deposit ID from on-chain vault state...');
    const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
    const vaultAbi = parseAbi([
      'function getUserDepositIds(address) view returns (uint256[])',
      'function getDeposit(uint256) view returns ((uint256 depositId, address user, address tokenAddress, uint256 amount, uint256 depositedAt, uint256 lockUntil, bool redeemed))',
    ]);

    const depositIds = (await publicClient.readContract({
      address: vaultAddress as `0x${string}`,
      abi: vaultAbi,
      functionName: 'getUserDepositIds',
      args: [ownerWallet as `0x${string}`],
    })) as bigint[];

    if (!depositIds || depositIds.length === 0) {
      throw new Error('Failed to find deposit ID for wallet after tx confirmation');
    }

    const latestDepositId = depositIds[depositIds.length - 1];
    const depositInfo = await publicClient.readContract({
      address: vaultAddress as `0x${string}`,
      abi: vaultAbi,
      functionName: 'getDeposit',
      args: [latestDepositId],
    });

    console.log(`  Deposit ID:     ${latestDepositId}`);
    console.log(`  Lock Until:     ${new Date(Number(depositInfo.lockUntil) * 1000).toLocaleString()}`);

    // ── Step 4: Wait for timelock to expire ────────────────────────────────────
    const nowSec = Math.floor(Date.now() / 1000);
    const secondsRemaining = Math.max(0, Number(depositInfo.lockUntil) - nowSec);

    if (secondsRemaining > 0) {
      console.log(`\n⏳ Timelocked! Waiting ${secondsRemaining} seconds for 5-minute lock to expire...`);
      for (let sec = secondsRemaining; sec > 0; sec--) {
        process.stdout.write(`\r   Unlocking in: ${sec}s... `);
        await new Promise((r) => setTimeout(r, 1000));
      }
      console.log('\n  ⏰ Timelock expired! Proceeding to unlock...');
    }

    // ── Step 5: Redeem Savings ─────────────────────────────────────────────────
    console.log('\n[4/4] Redeeming unlocked savings back to owner wallet...');
    const redeemTx = await executeAndConfirm({
      walletAddress: ownerWallet,
      contractAddress: vaultAddress,
      abiFunctionSignature: 'redeemSavings(uint256)',
      abiParameters: [String(latestDepositId)],
    });

    console.log('==================================================================');
    console.log('  🎉 TIMELOCK VAULT TEST FULLY SUCCESSFUL!');
    console.log(`  Redeem TxHash: ${redeemTx}`);
    console.log(`  ArcScan:       ${arcScan.tx(redeemTx)}`);
    console.log('==================================================================');
  } catch (err) {
    console.error('\n❌ VAULT TIMELOCK TEST FAILED:', err);
    process.exit(1);
  }
}

runVaultTimelockTest();
