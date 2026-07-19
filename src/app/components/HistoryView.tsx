import { useFlowHistory } from '../hooks/flowHistory';
import { useState, useEffect } from 'react';

export default function Ledger() {
  const { entries } = useFlowHistory();
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  if (!hasMounted) return null;

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-up">
      
      {/* Header */}
      <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className="mono-tag" style={{ color: 'var(--mint)', marginBottom: '8px', display: 'block' }}>Immutable Audit Log</span>
          <h1 style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }} className="text-gradient">
            Execution Ledger
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>TOTAL OPERATIONS</p>
          <p style={{ color: '#fff', fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{entries.length}</p>
        </div>
      </header>

      {/* Table-like List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 120px', gap: '20px', padding: '0 24px 12px', borderBottom: '1px solid var(--border)', color: 'var(--subtle)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <div>Transaction Intent / ID</div>
          <div style={{ textAlign: 'right' }}>Capital Volume</div>
          <div style={{ textAlign: 'center' }}>Network Status</div>
          <div style={{ textAlign: 'right' }}>Timestamp</div>
        </div>

        {entries.length === 0 ? (
          <div className="glass-panel" style={{ padding: '80px', borderRadius: '32px', textAlign: 'center', border: '1px dashed var(--border)' }}>
            <p style={{ color: 'var(--subtle)', fontSize: '14px' }}>Ledger is currently empty. Initiate an architected flow to record data.</p>
          </div>
        ) : (
          entries.map(e => (
            <div key={e.id} className="cyber-button" style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 120px', gap: '20px', padding: '20px 24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', alignItems: 'center' }}>
              
              {/* Intent Info */}
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{e.intent}</p>
                <p className="mono-tag" style={{ fontSize: '10px', color: 'var(--muted)' }}>0x{e.id.slice(0, 32)}...</p>
              </div>

              {/* Amount */}
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}>${e.totalAmount}</p>
                <p style={{ fontSize: '10px', color: 'var(--subtle)', fontWeight: 600 }}>USDC</p>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ 
                  padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em',
                  background: e.status === 'executed' ? 'rgba(180,244,215,0.1)' : 'rgba(255,255,255,0.05)',
                  color: e.status === 'executed' ? 'var(--mint)' : 'var(--muted)',
                  border: e.status === 'executed' ? '1px solid rgba(180,244,215,0.2)' : '1px solid transparent'
                }}>
                  {e.status.toUpperCase()}
                </div>
              </div>

              {/* Date */}
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>{new Date(e.createdAt).toLocaleDateString()}</p>
                <p style={{ fontSize: '10px', color: 'var(--subtle)', fontFamily: 'var(--font-mono)' }}>{new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
