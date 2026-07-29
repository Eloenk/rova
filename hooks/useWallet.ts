'use client';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { arcTestnet } from '@/lib/arcChain';
import { TOKENS, ARC_TESTNET } from '@/lib/config';

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const { data: usdcBal, refetch: refetchBalance } = useBalance({
    address,
    token:   TOKENS.USDC.address,
    chainId: arcTestnet.id,
    query:   { enabled: !!address },
  });

  const { data: eurcBal } = useBalance({
    address,
    token:   TOKENS.EURC.address,
    chainId: arcTestnet.id,
    query:   { enabled: !!address },
  });

  const isOnArc    = chain?.id === arcTestnet.id;
  const wrongChain = isConnected && !isOnArc;

  const connectInjected = () => {
    if (openConnectModal) {
      openConnectModal();
    } else {
      const c = connectors.find(c => c.id === 'injected' || c.id === 'metaMask') || connectors[0];
      if (c) {
        connect({ connector: c, chainId: arcTestnet.id });
      }
    }
  };

  const connectWalletConnect = () => {
    connectInjected();
  };

  const switchToArc = () => switchChain?.({ chainId: arcTestnet.id });

  return {
    address,
    shortAddress: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null,
    isConnected,
    isConnecting,
    isOnArc,
    wrongChain,
    usdcBalance: usdcBal ? parseFloat(usdcBal.formatted).toFixed(2) : null,
    eurcBalance: eurcBal ? parseFloat(eurcBal.formatted).toFixed(2) : null,
    connectInjected,
    connectWalletConnect,
    openConnectModal,
    disconnect,
    switchToArc,
    refetchBalance,
    arcChainId: ARC_TESTNET.chainId,
  };
}
