import { executeAndConfirm, sendUsdcOnArc } from './circle';
import { ARC_TESTNET, TOKENS, arcScan } from './config';

export type VaultStrategy = 'circle_wallet' | 'smart_contract';

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
  const envStrategy = process.env.ROVA_VAULT_STRATEGY?.toLowerCase();
  if (envStrategy === 'smart_contract') return 'smart_contract';
  return 'circle_wallet';
}

/**
 * Deposits savings according to configured Vault Strategy
 */
export async function depositSavingsVault(opts: DepositSavingsOpts) {
  const strategy = getVaultStrategy();
  const tokenKey = opts.token || 'USDC';
  const tokenAddress = TOKENS[tokenKey].address;
  const lockDuration = opts.lockDurationSeconds || 30 * 86400; // Default 30 days timelock limit

  console.log(`[Savings Vault] Depositing ${opts.amountUsdc} ${tokenKey} via strategy: ${strategy}`);

  if (strategy === 'smart_contract') {
    const vaultContractAddress = process.env.NEXT_PUBLIC_ROVA_SAVINGS_VAULT_ADDRESS || process.env.ROVA_SAVINGS_VAULT_ADDRESS;
    if (!vaultContractAddress) {
      console.warn('[Savings Vault] ROVA_SAVINGS_VAULT_ADDRESS not set in .env — defaulting to Circle Sub-Wallet');
    } else {
      const amountInt = Math.round(opts.amountUsdc * 10 ** TOKENS[tokenKey].decimals);

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
  }

  // Strategy: Circle Sub-Wallet Vault
  const destinationWallet = opts.savingsSubWalletAddress || opts.userWalletAddress;
  const { txHash, arcScanUrl } = await sendUsdcOnArc(opts.userWalletAddress, destinationWallet, opts.amountUsdc);

  return {
    strategy: 'circle_wallet' as const,
    txHash,
    arcScanUrl,
    destination: destinationWallet,
  };
}
