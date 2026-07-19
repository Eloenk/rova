'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRova } from '@/hooks/useRova';
import { useWallet } from '@/hooks/useWallet';

const META: Record<string, { title: string; sub: string }> = {
  '/':          { title: 'Rova',         sub: 'AI-powered money movement on Arc' },
  '/dashboard': { title: 'Command Hub',  sub: 'Your stablecoin activity on Arc' },
  '/send':      { title: 'Send & Swap',  sub: 'Transfer, bridge, or swap stablecoins' },
  '/history':   { title: 'Ledger',       sub: 'Transaction history with Arc Memos' },
};

export default function Topbar() {
  const pathname = usePathname();
  const meta = META[pathname] ?? META['/dashboard'];
  const [blk, setBlk] = useState(5_821_443);
  const { reputation } = useRova();
  const { isConnected, shortAddress, connectInjected, isConnecting, disconnect } = useWallet();

  useEffect(() => {
    const id = setInterval(() => setBlk(b => b + Math.floor(Math.random() * 3 + 1)), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="glass-panel" style={{
      height: 52, display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 24px', flexShrink: 0,
      borderLeft: 'none', borderRight: 'none', borderTop: 'none',
      background: 'rgba(13, 20, 36, 0.4)', zIndex: 10,
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{meta.title}</span>
      <span style={{ width: 1, height: 16, background: 'var(--border2)', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--subtle)' }}>{meta.sub}</span>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#fff' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint)', display: 'inline-block', animation: 'pulseGlow 2s ease-in-out infinite' }} />
          Arc Testnet
        </div>

        <div style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--subtle)' }}>
          <span style={{ color: 'var(--muted)' }}>REP:</span> <span style={{ color: '#fff' }}>{reputation ?? 0}%</span>
        </div>

        <div style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--subtle)', marginRight: 8 }}>
          #{blk.toLocaleString()}
        </div>

        {!isConnected ? (
          <button onClick={() => connectInjected()} disabled={isConnecting} style={{ padding: '6px 16px', borderRadius: 8, background: '#BFFF00', color: '#000', fontWeight: 800, fontSize: 11, border: 'none', cursor: 'pointer' }}>
            {isConnecting ? 'CONNECTING...' : 'CONNECT'}
          </button>
        ) : (
          <button onClick={() => disconnect()} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'var(--mint)', background: 'rgba(180, 244, 215, 0.08)', border: '1px solid rgba(180, 244, 215, 0.2)', cursor: 'pointer' }}>
            {shortAddress}
          </button>
        )}
      </div>
    </header>
  );
}
