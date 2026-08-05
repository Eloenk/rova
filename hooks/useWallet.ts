'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { arcTestnet } from '@/lib/arcChain';
import { TOKENS, ARC_TESTNET } from '@/lib/config';

export function useWallet() {
  const { address: web3Address, isConnected: isWeb3Connected, chain } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const [apiUsdc, setApiUsdc] = useState<string | null>(null);
  const [apiEurc, setApiEurc] = useState<string | null>(null);
  const [apiAddress, setApiAddress] = useState<string | null>(null);

  const isEmailSession = typeof window !== 'undefined' && Boolean(
    localStorage.getItem('rova_user_email') || (typeof document !== 'undefined' && document.cookie.includes('rova_user_email='))
  );

  const { data: usdcBal, refetch: refetchWagmiBalance } = useBalance({
    address: web3Address,
    token: TOKENS.USDC.address,
    chainId: arcTestnet.id,
    query: { enabled: !!web3Address && !isEmailSession },
  });

  const { data: eurcBal } = useBalance({
    address: web3Address,
    token: TOKENS.EURC.address,
    chainId: arcTestnet.id,
    query: { enabled: !!web3Address && !isEmailSession },
  });

  const fetchServerBalance = useCallback(async () => {
    try {
      const storedAddr = typeof window !== 'undefined' ? localStorage.getItem('rova_user_wallet') : null;
      const targetAddr = isEmailSession
        ? storedAddr
        : (isWeb3Connected ? web3Address : storedAddr);

      if (!targetAddr) {
        setApiUsdc('0.00');
        setApiEurc('0.00');
        setApiAddress(null);
        return;
      }

      const res = await fetch(`/api/user/balance?address=${targetAddr}`);
      const data = await res.json();
      if (data.ok) {
        setApiUsdc(data.usdcBalance);
        setApiEurc(data.eurcBalance);
        setApiAddress(data.address || targetAddr);
      }
    } catch (e) {
      console.warn('[useWallet] Server balance fetch error:', e);
    }
  }, [web3Address, isWeb3Connected, isEmailSession]);

  useEffect(() => {
    fetchServerBalance();
    const interval = setInterval(() => {
      fetchServerBalance();
      if (web3Address && !isEmailSession) {
        refetchWagmiBalance();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchServerBalance, web3Address, isEmailSession, refetchWagmiBalance]);

  const storedWallet = typeof window !== 'undefined' ? localStorage.getItem('rova_user_wallet') : null;

  const isConnected = isEmailSession ? Boolean(storedWallet || apiAddress) : isWeb3Connected;

  const address = isEmailSession
    ? (storedWallet || apiAddress || null)
    : (isWeb3Connected ? (web3Address || null) : null);

  const refetchBalance = () => {
    if (web3Address && !isEmailSession) {
      refetchWagmiBalance();
    }
    fetchServerBalance();
  };

  const finalUsdc = isEmailSession
    ? (apiUsdc ?? '0.00')
    : (isWeb3Connected ? (apiUsdc ?? (usdcBal ? parseFloat(usdcBal.formatted).toFixed(2) : '0.00')) : '0.00');

  const finalEurc = isEmailSession
    ? (apiEurc ?? '0.00')
    : (isWeb3Connected ? (apiEurc ?? (eurcBal ? parseFloat(eurcBal.formatted).toFixed(2) : '0.00')) : '0.00');

  const isOnArc = chain?.id === arcTestnet.id || isEmailSession;
  const wrongChain = isWeb3Connected && !isOnArc;

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
    usdcBalance: finalUsdc,
    eurcBalance: finalEurc,
    connectInjected,
    connectWalletConnect,
    openConnectModal,
    disconnect,
    switchToArc,
    refetchBalance,
    arcChainId: ARC_TESTNET.chainId,
  };
}

