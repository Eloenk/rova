import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Helper to safely access ethereum object
const getEthereum = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try to access window.ethereum safely
    return window.ethereum;
  } catch (error) {
    console.warn('Cannot access window.ethereum:', error);
    return null;
  }
};

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const connectInjected = useCallback(async () => {
    const ethereum = getEthereum();
    
    if (!ethereum) {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      setIsConnecting(true);
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts[0]) {
        setAddress(accounts[0]);
        setIsConnected(true);
        // Mock USDC balance for demo
        setUsdcBalance((Math.random() * 10000).toFixed(2));
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const connectWalletConnect = useCallback(async () => {
    // Placeholder for WalletConnect integration
    console.log('WalletConnect not implemented yet');
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    setUsdcBalance('0.00');
  }, []);

  // Listen for account changes
  useEffect(() => {
    const ethereum = getEthereum();
    
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    };

    try {
      ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        try {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
        } catch (error) {
          // Ignore cleanup errors
          console.warn('Error removing ethereum listener:', error);
        }
      };
    } catch (error) {
      console.warn('Error setting up ethereum listeners:', error);
    }
  }, [disconnect]);

  return {
    isConnected,
    address,
    shortAddress,
    usdcBalance,
    isConnecting,
    connectInjected,
    connectWalletConnect,
    disconnect
  };
}