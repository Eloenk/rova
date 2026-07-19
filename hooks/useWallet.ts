'use client';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi';
import { arcTestnet } from '@/lib/arcChain';
import { TOKENS, ARC_TESTNET } from '@/lib/config';

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const { data: usdcBal, refetch: refetchBalance } = useBalance({
    address,
    token:   TOKENS.USDC.address,
    chainId: arcTestnet.id,
    query:   { enabled: isConnected },
  });

  const isOnArc    = chain?.id === arcTestnet.id;
  const wrongChain = isConnected && !isOnArc;

  const connectInjected = () => {
    const c = connectors.find(c => c.id === 'injected');
    if (c) connect({ connector: c, chainId: arcTestnet.id });
  };

  // WalletConnect removed to avoid SSR localStorage conflict.
  // Only injected (MetaMask) wallet is supported.
  const connectWalletConnect = () => { connectInjected(); };

  const switchToArc = () => switchChain?.({ chainId: arcTestnet.id });

  return {
    address,
    shortAddress: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null,
    isConnected,
    isConnecting,
    isOnArc,
    wrongChain,
    usdcBalance: usdcBal ? parseFloat(usdcBal.formatted).toFixed(2) : null,
    connectInjected,
    connectWalletConnect,
    disconnect,
    switchToArc,
    refetchBalance,
    arcChainId: ARC_TESTNET.chainId,
  };
}
