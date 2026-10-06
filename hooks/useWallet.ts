'use client';

import { useState, useEffect, useCallback } from 'react';
import { ARC_TESTNET } from '@/lib/config';

interface SessionUser {
  email: string;
  walletAddress?: string;
}

export function useWallet() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [apiUsdc, setApiUsdc] = useState('0.00');
  const [apiEurc, setApiEurc] = useState('0.00');
  const [apiAddress, setApiAddress] = useState<string | null>(null);

  const fetchServerState = useCallback(async () => {
    try {
      const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });
      const sessionData = await sessionResponse.json();
      if (!sessionResponse.ok || !sessionData.ok) {
        setSessionUser(null);
        setApiAddress(null);
        setApiUsdc('0.00');
        setApiEurc('0.00');
        return;
      }

      setSessionUser(sessionData.user);
      const balanceResponse = await fetch('/api/user/balance', { cache: 'no-store' });
      const balanceData = await balanceResponse.json();
      if (balanceResponse.ok && balanceData.ok) {
        setApiUsdc(balanceData.usdcBalance);
        setApiEurc(balanceData.eurcBalance);
        setApiAddress(balanceData.address || sessionData.user.walletAddress || null);
      }
    } catch {
      setSessionUser(null);
    }
  }, []);

  useEffect(() => {
    fetchServerState();
    const interval = setInterval(fetchServerState, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchServerState]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setSessionUser(null);
      setApiUsdc('0.00');
      setApiEurc('0.00');
      setApiAddress(null);
    }
  }, []);

  const isConnected = Boolean(sessionUser);
  const address = apiAddress || sessionUser?.walletAddress || null;

  return {
    address,
    shortAddress: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null,
    isConnected,
    isConnecting: false,
    isOnArc: true,
    wrongChain: false,
    usdcBalance: isConnected ? apiUsdc : '0.00',
    eurcBalance: isConnected ? apiEurc : '0.00',
    connectInjected: () => {},
    connectWalletConnect: () => {},
    openConnectModal: () => {},
    disconnect: logout,
    logout,
    switchToArc: () => {},
    refetchBalance: fetchServerState,
    arcChainId: ARC_TESTNET.chainId,
  };
}
