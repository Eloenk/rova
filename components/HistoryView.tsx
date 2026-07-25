'use client';
import { useFlowHistory } from '@/hooks/flowHistoryStore';
import { useEffect, useState } from 'react';
import { Zap, Clock, ArrowUpRight, Moon, Send, Repeat, Globe } from 'lucide-react';
import { arcScan } from '@/lib/config';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  send:   <Send size={15} color="var(--mint)" />,
  bridge: <Globe size={15} color="#60a5fa" />,
  swap:   <Repeat size={15} color="#BFFF00" />,
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
    <div style={{ padding: '32px 40px', maxWidth: '860px', margin: '0 auto' }} className="animate-fade-up">

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px' }}>
        <div>
          <span className="mono-tag" style={{ color: 'var(--mint)', marginBottom: '8px', display: 'block', fontSize: '11px' }}>Operational</span>
          <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em' }} className="text-gradient">Ledger</h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '6px' }}>Every transaction, with Arc Transaction Memos attached.</p>
        </div>
        {entries.length > 0 && (
          <button onClick={clearHistory} style={{ fontSize: '13px', color: 'var(--subtle)', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600 }}>
            Clear
          </button>
        )}
      </header>

      {/* Summary row */}
      {entries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total transactions', value: entries.length },
            { label: 'Total volume', value: `$${entries.reduce((a, e) => a + parseFloat(String(e.totalAmount || 0)), 0).toLocaleString()} USDC` },
            { label: 'Success rate', value: `${Math.round((entries.filter(e => e.status === 'executed').length / entries.length) * 100)}%` },
          ].map(({ label, value }) => (
            <div key={label} className="glass-panel" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <p className="mono-tag" style={{ color: 'var(--muted)', fontSize: '10px', marginBottom: '6px' }}>{label}</p>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Transaction list */}
      {entries.length === 0 ? (
        <div className="glass-panel" style={{ padding: '80px 40px', borderRadius: '24px', textAlign: 'center' }}>
          <Moon size={32} color="var(--subtle)" style={{ marginBottom: '16px' }} />
          <p style={{ fontSize: '16px', color: 'var(--muted)', marginBottom: '8px' }}>No transactions yet.</p>
          <p style={{ fontSize: '13px', color: 'var(--subtle)' }}>Transactions you make will appear here with Arc Transaction Memos.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {entries.map(e => {
            const actionType = detectAction(e.intent);
            const txHash = e.executionResult?.txHashes?.[0];
            return (
              <div key={e.id} className="glass-panel" style={{ padding: '20px 24px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Icon */}
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {ACTION_ICONS[actionType]}
                </div>

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.intent}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {txHash ? (
                      <a href={arcScan.tx(txHash)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span className="mono-tag">{txHash.slice(0, 18)}...</span>
                        <ArrowUpRight size={11} />
                      </a>
                    ) : (
                      <span className="mono-tag" style={{ fontSize: '11px', color: 'var(--subtle)' }}>{e.id.slice(0, 18)}...</span>
                    )}
                    {e.memo && (
                      <span style={{ fontSize: '11px', color: 'var(--subtle)', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                        📝 {e.memo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: e.status === 'executed' ? 'var(--mint)' : 'var(--muted)', marginBottom: '4px' }}>
                    ${e.totalAmount}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    {e.status === 'executed'
                      ? <Zap size={11} color="var(--mint)" />
                      : <Clock size={11} color="var(--subtle)" />
                    }
                    <span className="mono-tag" style={{ fontSize: '9px', color: e.status === 'executed' ? 'var(--mint)' : 'var(--subtle)' }}>
                      {e.status === 'executed' ? 'SETTLED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <p style={{ fontSize: '12px', color: 'var(--subtle)', textAlign: 'center', marginTop: '32px', lineHeight: 1.6 }}>
        All transactions are recorded on Arc with <span style={{ color: 'var(--mint)', fontWeight: 600 }}>Transaction Memos</span> for full traceability.
        {' '}<a href="https://docs.arc.io" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--subtle)', textDecoration: 'underline' }}>Learn more</a>
      </p>
    </div>
  );
}
