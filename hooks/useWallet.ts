'use client';
import { useState, useEffect, useCallback } from 'react';
import { ARC_TESTNET } from '@/lib/config';

export function useWallet() {
  const [apiUsdc, setApiUsdc] = useState<string | null>(null);
  const [apiEurc, setApiEurc] = useState<string | null>(null);
  const [apiAddress, setApiAddress] = useState<string | null>(null);

  const storedWallet = typeof window !== 'undefined' ? localStorage.getItem('rova_user_wallet') : null;
  const storedEmail = typeof window !== 'undefined'
    ? localStorage.getItem('rova_user_email')
    : null;

  const isEmailSession = typeof window !== 'undefined' && Boolean(
    storedEmail || (typeof document !== 'undefined' && document.cookie.includes('rova_user_email='))
  );

  const fetchServerBalance = useCallback(async () => {
    try {
      const targetAddr = storedWallet || apiAddress;

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
  }, [storedWallet, apiAddress]);

  useEffect(() => {
    fetchServerBalance();
    const interval = setInterval(() => {
      fetchServerBalance();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchServerBalance]);

  const isConnected = isEmailSession && Boolean(storedWallet || apiAddress);
  const address = isConnected ? (storedWallet || apiAddress || null) : null;

  const refetchBalance = () => {
    fetchServerBalance();
  };

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = 'rova_user_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'rova_user_wallet=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    setApiUsdc(null);
    setApiEurc(null);
    setApiAddress(null);
  }, []);

  return {
    address,
    shortAddress: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null,
    isConnected,
    isConnecting: false,
    isOnArc: true,
    wrongChain: false,
    usdcBalance: isConnected ? (apiUsdc ?? '0.00') : '0.00',
    eurcBalance: isConnected ? (apiEurc ?? '0.00') : '0.00',
    connectInjected: () => {},
    connectWalletConnect: () => {},
    openConnectModal: () => {},
    disconnect: logout,
    logout,
    switchToArc: () => {},
    refetchBalance,
    arcChainId: ARC_TESTNET.chainId,
  };
}
