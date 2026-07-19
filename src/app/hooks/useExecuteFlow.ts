import { useState, useCallback } from 'react';

interface ExecuteResult {
  splitIndex: number;
  txHash: string;
  arcScanUrl: string;
  amount: number;
  currency: string;
  recipient: string;
}

type ExecStatus = 'idle' | 'awaiting_signature' | 'confirming' | 'confirmed' | 'error';

export function useExecuteFlow() {
  const [status, setStatus] = useState<ExecStatus>('idle');
  const [results, setResults] = useState<ExecuteResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const execute = useCallback(async (plan: any) => {
    setStatus('awaiting_signature');
    setError(null);
    setResults([]);

    try {
      // Simulate transaction execution
      for (let i = 0; i < plan.splits.length; i++) {
        setCurrentIndex(i);
        
        // Simulate waiting for signature
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setStatus('confirming');
        
        // Simulate blockchain confirmation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const split = plan.splits[i];
        const mockResult: ExecuteResult = {
          splitIndex: i,
          txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
          arcScanUrl: `https://arcscan.io/tx/0x${Math.random().toString(16).slice(2, 66)}`,
          amount: split.amount,
          currency: split.currency,
          recipient: split.recipient
        };
        
        setResults(prev => [...prev, mockResult]);
      }
      
      setStatus('confirmed');
    } catch (err) {
      setError('Transaction failed. Please try again.');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResults([]);
    setError(null);
    setCurrentIndex(0);
  }, []);

  return {
    execute,
    status,
    results,
    error,
    currentIndex,
    reset
  };
}
