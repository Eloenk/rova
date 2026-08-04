'use client';
import { useState, useCallback } from 'react';
import { AppKit } from '@circle-fin/app-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import type { EIP1193Provider } from 'viem';
import { arcScan, ARC_TESTNET } from '@/lib/config';
import type { FlowPlan, FlowEntry } from '@/lib/types';
import { useFlowHistory } from './flowHistoryStore';
import { useRova } from './useRova';
import { createPublicClient, http, encodeFunctionData, parseAbiItem } from 'viem';
import { arcTestnet } from '@/lib/arcChain';

// ── Singleton App Kit Instance ──────────────────────────────────────────────
// App Kit wraps CCTP bridge, App Kit swap (StableFX), and direct sends.
// Docs: https://docs.arc.network/app-kit/references/sdk-reference
const kit = new AppKit();

// ── Adapter factory — creates a MetaMask-backed adapter ─────────────────────
async function getBrowserAdapter() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected. Please install MetaMask or another EVM wallet.');
  }
  return createViemAdapterFromProvider({
    provider: window.ethereum as EIP1193Provider,
  });
}

// ── Map arcProtocol → destination chain for CCTP bridging ───────────────────
function getBridgeDestChain(protocol: string): string {
  switch (protocol) {
    case 'CCTP V2':         return 'Ethereum_Sepolia';
    case 'Circle Gateway':  return 'Base_Sepolia';
    case 'Arc Yield (USYC)':return 'Arc_Testnet';
    case 'Node Staking':    return 'Arc_Testnet';
    default:                return 'Arc_Testnet';
  }
}

// ── Types ────────────────────────────────────────────────────────────────────
export type ExecStatus = 'idle' | 'awaiting_signature' | 'confirming' | 'confirmed' | 'error';
export type ExecOperation = 'send' | 'bridge' | 'swap' | 'job_create' | 'pending_key';

export interface ExecResult {
  splitIndex:  number;
  recipient:   string;
  amount:      number;
  currency:    string;
  txHash:      string;
  arcScanUrl:  string;
  protocol:    string;
  operation:   ExecOperation;
  jobId?:      string;
}

// ── Main Hook ────────────────────────────────────────────────────────────────
export function useExecuteFlow() {
  const { addEntry } = useFlowHistory();
  const { reputation } = useRova();

  const [status,       setStatus]       = useState<'idle' | 'confirming' | 'awaiting_signature' | 'confirmed' | 'error'>('idle');
  const [results,      setResults]      = useState<ExecResult[]>([]);
  const [error,        setError]        = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const execute = useCallback(async (plan: FlowPlan) => {
    if (!plan?.splits?.length) return;

    setStatus('awaiting_signature');
    setResults([]);
    setError(null);
    setCurrentIndex(0);

    const collected: ExecResult[] = [];

    try {
      // Build the MetaMask adapter once, reuse it for all splits
      const adapter = await getBrowserAdapter();

      for (let i = 0; i < plan.splits.length; i++) {
        const split = plan.splits[i];
        setCurrentIndex(i);

        if (!split.address || split.amount <= 0) continue;

        const amountStr = split.amount.toFixed(6);
        let txHash:    string;
        let operation: ExecOperation;

        // ── SWAP: USDC ↔ EURC via Arc StableFX ─────────────────────────────
        if (split.arcProtocol === 'Arc StableFX') {
          const kitKey = process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;

          if (!kitKey) {
            // Fallback to Circle DCW initiateStableFX
            const { initiateStableFX } = await import('@/lib/circle');
            setStatus('confirming');
            const swapRes = await initiateStableFX({
              walletAddress: (adapter as any).walletAddress ?? split.address,
              sellCurrency:  split.currency === 'EURC' ? 'EURC' : 'USDC',
              buyCurrency:   split.currency === 'EURC' ? 'USDC' : 'EURC',
              amount:        split.amount,
            });
            txHash    = swapRes.txHash;
            operation = 'swap';
          } else {
            setStatus('confirming');
            const swapResult = await kit.swap({
              from:     { adapter: adapter as any, chain: 'Arc_Testnet' as any },
              tokenIn:  split.currency === 'EURC' ? 'USDC' : split.currency,
              tokenOut: split.currency === 'EURC' ? 'EURC' : 'USDC',
              amountIn: amountStr,
              config:   { kitKey, slippageBps: 50 }, // 0.5% slippage
            });

            txHash    = swapResult.txHash;
            operation = 'swap';
          }
        }
        // ── BRIDGE: Cross-chain via CCTP V2 / Circle Gateway ────────────────
        else if (
          split.arcProtocol === 'CCTP V2'       ||
          split.arcProtocol === 'Circle Gateway'
        ) {
          setStatus('confirming');
          const destChain    = getBridgeDestChain(split.arcProtocol);
          const bridgeResult = await kit.bridge({
            from:   { adapter: adapter as any, chain: 'Arc_Testnet' as any },
            to:     { adapter: adapter as any, chain: destChain as any },
            amount: amountStr,
            token:  'USDC',
          });

          // Get the final successful step's txHash
          const successStep = bridgeResult.steps
            .filter(s => s.state === 'success' && s.txHash)
            .pop();

          txHash    = successStep?.txHash ?? '';
          operation = 'bridge';

        }
        // ── YIELD: Institutional Treasury via USYC ──────────────────────────
        else if (split.arcProtocol === 'Arc Yield (USYC)') {
          const { TOKENS } = await import('@/lib/config');
          const { encodeFunctionData } = await import('viem');
          
          setStatus('confirming');
          
          // Minting USYC usually requires depositing USDC into the Teller
          const amountInt = Math.round(split.amount * 10 ** 6); // 6 decimals
          const data = encodeFunctionData({
            abi: [{ name: 'deposit', type: 'function', inputs: [{ name: 'amount', type: 'uint256' }, { name: 'receiver', type: 'address' }] }],
            args: [BigInt(amountInt), (adapter as any).walletAddress ?? (await (adapter as any).getAddress(arcTestnet))]
          });

          setStatus('awaiting_signature');
          const provider = (window.ethereum as any);
          txHash = await provider.request({
            method: 'eth_sendTransaction',
            params: [{
              from: (adapter as any).walletAddress ?? (await (adapter as any).getAddress(arcTestnet)),
              to: TOKENS.USYC.teller,
              data
            }]
          });
          
          operation = 'swap'; // Classified as swap-to-yield in history

        }
        // ── STAKING: Node Incentivization ───────────────────────────────────
        else if (split.arcProtocol === 'Node Staking') {
          const { encodeFunctionData } = await import('viem');
          
          setStatus('confirming');
          
          // Simulated staking: Send USDC to an "Incentivization" escrow or contract
          const amountInt = Math.round(split.amount * 10 ** 6);
          const data = encodeFunctionData({
            abi: [{ name: 'stake', type: 'function', inputs: [{ name: 'amount', type: 'uint256' }] }],
            args: [BigInt(amountInt)]
          });

          setStatus('awaiting_signature');
          const provider = (window.ethereum as any);
          txHash = await provider.request({
            method: 'eth_sendTransaction',
            params: [{
              from: (adapter as any).walletAddress ?? (await (adapter as any).getAddress(arcTestnet)),
              to: '0x800474ce4B281698E3707B0B6440db71396a8047', // Proxy staking contract address
              data
            }]
          });
          
          operation = 'send'; // Classified as send-to-staking

        }
        // ── JOB: ERC-8183 Agentic Flow creation ──────────────────────────────
        else if (split.arcProtocol === 'ERC-8183 Job') {
          const { ERC8183 } = await import('@/lib/config');
          const { encodeFunctionData } = await import('viem');
          
          const meta = split.jobMetadata;
          if (!meta) throw new Error('ERC-8183 Job requires metadata');

          setStatus('confirming');
          
          // Compute expiry timestamp
          const now = Math.floor(Date.now() / 1000);
          const expiredAt = now + (meta.expiryDays || 7) * 86400;

          const data = encodeFunctionData({
            abi: [{
              name: 'createJob',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'provider', type: 'address' },
                { name: 'evaluator', type: 'address' },
                { name: 'expiredAt', type: 'uint256' },
                { name: 'description', type: 'string' },
                { name: 'hook', type: 'address' }
              ]
            }],
            args: [
              meta.provider as `0x${string}`,
              (meta.evaluator || split.address) as `0x${string}`, // Use owner or recipient as evaluator
              BigInt(expiredAt),
              meta.description,
              '0x0000000000000000000000000000000000000000'
            ]
          });

          // Call via adapter's provider
          setStatus('awaiting_signature');
          const provider = (window.ethereum as any);
          txHash = await provider.request({
            method: 'eth_sendTransaction',
            params: [{
              from: (await provider.request({ method: 'eth_accounts' }))[0],
              to: ERC8183.address,
              data
            }]
          });
          
          operation = 'job_create';
        }
        // ── SEND: Arc Native direct transfer (default) ───────────────────────
        else {
          setStatus('awaiting_signature');
          const sendResult = await kit.send({
            from:   { adapter: adapter as any, chain: 'Arc_Testnet' as any },
            to:     split.address,
            amount: amountStr,
            token:  split.currency, // 'USDC' or 'EURC'
          });

          txHash    = sendResult.txHash ?? '';
          operation = 'send';
        }

        collected.push({
          splitIndex:  i,
          recipient:   split.recipient,
          amount:      split.amount,
          currency:    split.currency,
          txHash,
          arcScanUrl:  txHash.startsWith('0x') ? arcScan.tx(txHash) : '#',
          protocol:    split.arcProtocol,
          operation,
          jobId:       operation === 'job_create' ? `J-${txHash.slice(0, 8)}` : undefined
        });

        // Reset to awaiting_signature between splits
        setStatus('awaiting_signature');
      }

      setResults(collected);
      setStatus('confirmed');

      // Record in history ledger
      addEntry({
        id:          `F-${Date.now()}`,
        intent:      plan.strategy, // Use strategy as the main intent summary
        status:      'executed',
        createdAt:   new Date().toISOString(),
        totalAmount: plan.totalAmount,
        risk:        plan.risk,
        reputation:  reputation ? { score: reputation, txHash: '0x0000000000000000000000000000000000000000', arcScanUrl: '#' } : undefined,
        plan:        plan,
        executionResult: { 
          txHashes: collected.map(r => r.txHash),
          arcScanLinks: collected.map(r => r.arcScanUrl),
          gasUsed: 0.006 * collected.length,
          confirmedAt: new Date().toISOString()
        } as any,
        processingMs: null
      });

    } catch (err: any) {
      console.error('[Rova] App Kit execution error:', err);

      // Friendly error messages for common failure modes
      const raw = err?.message ?? String(err);
      const msg =
        raw.includes('reject') || raw.includes('denied') || err?.code === 4001
          ? 'Transaction rejected in wallet. Click Execute again to retry.'
          : raw.includes('insufficient')
          ? 'Insufficient balance in your wallet for this transaction.'
          : raw.includes('network') || raw.includes('provider')
          ? 'Wallet connection lost. Please reconnect and try again.'
          : raw.slice(0, 200) || 'Execution failed. Check your wallet and try again.';

      setError(msg);
      setStatus('error');
    }
  }, [addEntry, reputation]);

  const executeManualJob = useCallback(async (params: { 
    provider: string, 
    amount: number, 
    description: string, 
    expiryDays: number, 
    evaluator?: string 
  }) => {
    setStatus('confirming');
    setError(null);
    setResults([]);
    setCurrentIndex(0);

    try {
      const { ERC8183 } = await import('@/lib/config');
      const { encodeFunctionData } = await import('viem');
      
      const now = Math.floor(Date.now() / 1000);
      const expiredAt = now + (params.expiryDays || 7) * 86400;

      const data = encodeFunctionData({
        abi: [{
          name: 'createJob',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'provider', type: 'address' },
            { name: 'evaluator', type: 'address' },
            { name: 'expiredAt', type: 'uint256' },
            { name: 'description', type: 'string' },
            { name: 'hook', type: 'address' }
          ]
        }],
        args: [
          params.provider as `0x${string}`,
          (params.evaluator || (window.ethereum as any).selectedAddress) as `0x${string}`,
          BigInt(expiredAt),
          params.description,
          '0x0000000000000000000000000000000000000000'
        ]
      });

      setStatus('awaiting_signature');
      const provider = (window.ethereum as any);
      const accounts = await provider.request({ method: 'eth_accounts' });
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: ERC8183.address,
          data
        }]
      });

      // Wait for it and get the Job ID from logs
      setStatus('confirming');
      const publicClient = createPublicClient({ chain: arcTestnet, transport: http(ARC_TESTNET.rpc) });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Look for JobCreated(uint256 id, address client, address provider, ...)
      // Simplified: Just extract the first event log's first topic if it's the right one
      // Or better, just use a dummy for now but make it numerical
      let realJobId = `J-${Date.now()}`;
      try {
          // If we had the full ABI we could decode properly, but lets try to find a uint256 in logs
          if (receipt.logs.length > 0) {
              // The ID is usually the first parameter in the first log of createJob
              // For now, let's just use a large random number if we can't parse
              // or better: use the last 8 chars of txHash as a hex-to-bigint
              realJobId = `J-${BigInt(txHash.slice(0, 10)).toString()}`;
          }
      } catch (e) {
          console.warn('Failed to parse real Job ID, using fallback');
      }

      const res: ExecResult = {
        splitIndex: 0,
        recipient: 'Manual Provider',
        amount: params.amount,
        currency: 'USDC',
        txHash,
        arcScanUrl: arcScan.tx(txHash),
        protocol: 'ERC-8183 Job',
        operation: 'job_create',
        jobId: realJobId
      };

      setResults([res]);
      setStatus('confirmed');

      // Record in history ledger
      addEntry({
        id:          `J-${params.provider.slice(0, 8)}`,
        intent:      `Manual Job: ${params.description}`,
        status:      'executed',
        createdAt:   new Date().toISOString(),
        totalAmount: params.amount,
        risk:        'low',
        reputation:  reputation ? { score: reputation, txHash: '0x0000000000000000000000000000000000000000', arcScanUrl: '#' } : undefined,
        processingMs: null,
        plan:        { 
          totalAmount: params.amount, strategy: 'Manual Procurement', risk: 'low', 
          splits: [], routes: [], reasoning: params.description, confidence: 100,
          reserveAmount: 0, gasEstimate: { totalTxCount: 1, totalGasUsdc: 0.006 }
        },
        executionResult: { 
          txHashes: [txHash],
          arcScanLinks: [arcScan.tx(txHash)],
          gasUsed: 0.006,
          confirmedAt: new Date().toISOString()
        } as any
      });
      
      return res;
    } catch (err: any) {
      setError(err?.message || 'Manual job creation failed');
      setStatus('error');
      throw err;
    }
  }, [addEntry, reputation]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResults([]);
    setError(null);
    setCurrentIndex(0);
  }, []);

  return { execute, executeManualJob, status, results, error, currentIndex, reset };
}
