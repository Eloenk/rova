'use client';

import { useFlowHistory } from '@/hooks/flowHistoryStore';
import { useEffect, useState } from 'react';
import { Zap, Clock, ArrowUpRight, Moon, Send, Repeat, Globe } from 'lucide-react';
import { arcScan } from '@/lib/config';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  send:   <Send size={15} className="text-accent-mint" />,
  bridge: <Globe size={15} className="text-blue-400" />,
  swap:   <Repeat size={15} className="text-accent-primary" />,
};

function detectAction(intent: string) {
  const i = intent.toLowerCase();
  if (i.includes('bridge')) return 'bridge';
  if (i.includes('swap'))   return 'swap';
  return 'send';
}

export default function HistoryView() {
  const { entries, clearHistory } = useFlowHistory();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => { setHasMounted(true); }, []);
  if (!hasMounted) return null;

  return (
    <div className="py-8 px-4 sm:px-8 max-w-[860px] mx-auto animate-fade-up font-sans">
      {/* Header */}
      <header className="flex justify-between items-end mb-8">
        <div>
          <span className="text-[11px] font-mono font-bold tracking-widest text-accent-mint uppercase block mb-1">
            Operational Log
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
            Recent Activity
          </h1>
          <p className="text-text-secondary text-sm sm:text-base mt-1">
            Every transaction, with Arc Transaction Memos attached.
          </p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-text-tertiary bg-transparent border border-border rounded-lg px-3.5 py-2 cursor-pointer font-semibold hover:text-text-primary hover:bg-surface-raised transition-all"
          >
            Clear Log
          </button>
        )}
      </header>

      {/* Summary Stat Grid */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Transactions', value: entries.length },
            { label: 'Total Volume', value: `$${entries.reduce((a, e) => a + parseFloat(String(e.totalAmount || 0)), 0).toLocaleString()} USDC` },
            { label: 'Success Rate', value: `${Math.round((entries.filter(e => e.status === 'executed').length / entries.length) * 100)}%` },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 rounded-xl bg-surface border border-border">
              <p className="text-[10px] font-mono font-bold text-text-tertiary uppercase tracking-wider mb-1">{label}</p>
              <p className="text-xl font-bold font-mono text-text-primary">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Transaction List */}
      {entries.length === 0 ? (
        <div className="p-16 rounded-xl bg-surface border border-border text-center space-y-2">
          <Moon size={32} className="text-text-tertiary mx-auto mb-2" />
          <p className="text-base text-text-primary font-semibold">No transactions yet.</p>
          <p className="text-xs text-text-secondary">Transactions you make will appear here with Arc Transaction Memos.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map(e => {
            const actionType = detectAction(e.intent);
            const txHash = e.executionResult?.txHashes?.[0];
            return (
              <div key={e.id} className="p-4 sm:p-5 rounded-xl bg-surface border border-border flex items-center gap-4 hover:bg-surface-raised transition-all">
                {/* Action Icon */}
                <div className="w-10 h-10 rounded-lg bg-surface-raised border border-border flex items-center justify-center shrink-0">
                  {ACTION_ICONS[actionType]}
                </div>

                {/* Intent & Memo details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-text-primary truncate mb-1">{e.intent}</p>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-text-secondary">
                    {txHash ? (
                      <a href={arcScan.tx(txHash)} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-text-secondary hover:text-text-primary flex items-center gap-1 truncate max-w-[360px]" title={arcScan.tx(txHash)}>
                        <span>{arcScan.tx(txHash)}</span>
                        <ArrowUpRight size={11} className="shrink-0" />
                      </a>
                    ) : (
                      <span className="font-mono text-[11px] text-text-tertiary">{e.id.slice(0, 18)}...</span>
                    )}
                    {e.memo && (
                      <span className="text-[10px] text-text-tertiary px-2 py-0.5 rounded bg-surface-raised border border-border">
                        Memo: {e.memo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount & Status Badge */}
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-bold text-text-primary mb-1">
                    ${e.totalAmount}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    {e.status === 'executed' ? (
                      <Zap size={11} className="text-accent-mint" />
                    ) : e.status === 'failed' ? (
                      <Clock size={11} className="text-red-400" />
                    ) : (
                      <Clock size={11} className="text-text-tertiary" />
                    )}
                    <span className={`text-[10px] font-mono font-bold ${
                      e.status === 'executed'
                        ? 'text-accent-mint'
                        : e.status === 'failed'
                        ? 'text-red-400'
                        : 'text-text-tertiary'
                    }`}>
                      {e.status === 'executed' ? 'SETTLED' : e.status === 'failed' ? 'FAILED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-text-tertiary text-center mt-8 leading-relaxed">
        All transactions are recorded on Arc with <span className="text-accent-mint font-semibold">Transaction Memos</span> for full traceability.
      </p>
    </div>
  );
}
