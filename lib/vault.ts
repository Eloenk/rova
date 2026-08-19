import { executeAndConfirm } from './circle';
import { TOKENS, arcScan } from './config';

export type VaultStrategy = 'smart_contract';

export interface DepositSavingsOpts {
  userWalletAddress: string;
  savingsSubWalletAddress?: string;
  amountUsdc: number;
  token?: 'USDC' | 'EURC';
  lockDurationSeconds?: number;
}

/**
 * Reads vault strategy from environment / config.yaml
 */
export function getVaultStrategy(): VaultStrategy {
  return 'smart_contract';
}

/**
 * Deposits savings according to configured Vault Strategy (RovaSavingsVault smart contract)
 */
export async function depositSavingsVault(opts: DepositSavingsOpts) {
  const tokenKey = opts.token || 'USDC';
  const tokenAddress = TOKENS[tokenKey].address;
  const lockDuration = opts.lockDurationSeconds || 30 * 86400; // Default 30 days timelock limit

  const vaultContractAddress =
    process.env.NEXT_PUBLIC_ROVA_SAVINGS_VAULT_ADDRESS ||
    process.env.ROVA_SAVINGS_VAULT_ADDRESS ||
    '0x9330DA5152Cc676a029cfaCCcA3948e11EDE9BfB';

  const amountInt = Math.round(opts.amountUsdc * 10 ** TOKENS[tokenKey].decimals);

  console.log(`[Savings Vault] Depositing ${opts.amountUsdc} ${tokenKey} into smart contract vault: ${vaultContractAddress}`);

  // Step 1: Approve vault contract
  await executeAndConfirm({
    walletAddress:        opts.userWalletAddress,
    contractAddress:      tokenAddress,
    abiFunctionSignature: 'approve(address,uint256)',
    abiParameters:        [vaultContractAddress, String(amountInt)],
  });

  // Step 2: Deposit into RovaSavingsVault contract
  const txHash = await executeAndConfirm({
    walletAddress:        opts.userWalletAddress,
    contractAddress:      vaultContractAddress,
    abiFunctionSignature: 'depositSavings(address,uint256,uint256)',
    abiParameters:        [tokenAddress, String(amountInt), String(lockDuration)],
  });

  return {
    strategy: 'smart_contract' as const,
    txHash,
    arcScanUrl: arcScan.tx(txHash),
    destination: vaultContractAddress,
  };
}

/**
 * Fetches all user savings deposits from RovaSavingsVault smart contract
 */
export async function getUserVaultDeposits(userWalletAddress: string) {
  const { createPublicClient, http, parseAbi } = await import('viem');
  const { arcTestnet } = await import('./arcChain');

  const vaultContractAddress =
    process.env.NEXT_PUBLIC_ROVA_SAVINGS_VAULT_ADDRESS ||
    process.env.ROVA_SAVINGS_VAULT_ADDRESS ||
    '0x9330DA5152Cc676a029cfaCCcA3948e11EDE9BfB';

  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
  const vaultAbi = parseAbi([
    'function getUserDepositIds(address) view returns (uint256[])',
    'function getDeposit(uint256) view returns ((uint256 depositId, address user, address tokenAddress, uint256 amount, uint256 depositedAt, uint256 lockUntil, bool redeemed))',
  ]);

  const depositIds = (await publicClient.readContract({
    address: vaultContractAddress as `0x${string}`,
    abi: vaultAbi,
    functionName: 'getUserDepositIds',
    args: [userWalletAddress as `0x${string}`],
  })) as bigint[];

  if (!depositIds || depositIds.length === 0) {
    return [];
  }

  const deposits = await Promise.all(
    depositIds.map(async (id) => {
      const dep = await publicClient.readContract({
        address: vaultContractAddress as `0x${string}`,
        abi: vaultAbi,
        functionName: 'getDeposit',
        args: [id],
      });
      const nowSec = Math.floor(Date.now() / 1000);
      return {
        depositId: Number(dep.depositId),
        user: dep.user,
        tokenAddress: dep.tokenAddress,
        amountUsdc: Number(dep.amount) / 1e6,
        depositedAt: Number(dep.depositedAt),
        lockUntil: Number(dep.lockUntil),
        redeemed: dep.redeemed,
        isUnlocked: nowSec >= Number(dep.lockUntil),
      };
    })
  );

  return deposits;
}

/**
 * Redeems an unlocked deposit from RovaSavingsVault smart contract
 */
export async function redeemSavingsVault(userWalletAddress: string, depositId: number) {
  const vaultContractAddress =
    process.env.NEXT_PUBLIC_ROVA_SAVINGS_VAULT_ADDRESS ||
    process.env.ROVA_SAVINGS_VAULT_ADDRESS ||
    '0x9330DA5152Cc676a029cfaCCcA3948e11EDE9BfB';

  console.log(`[Savings Vault] Executing redeem for depositId #${depositId} for ${userWalletAddress}`);

  const txHash = await executeAndConfirm({
    walletAddress: userWalletAddress,
    contractAddress: vaultContractAddress,
    abiFunctionSignature: 'redeemSavings(uint256)',
    abiParameters: [String(depositId)],
  });

  return {
    txHash,
    arcScanUrl: arcScan.tx(txHash),
  };
}
