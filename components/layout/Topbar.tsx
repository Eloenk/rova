'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRova } from '@/hooks/useRova';
import { useWallet } from '@/hooks/useWallet';
import { Menu, X } from 'lucide-react';

const META: Record<string, { title: string; sub: string }> = {
  '/':          { title: 'Rova',         sub: 'AI-powered money movement on Arc' },
  '/dashboard': { title: 'Command Hub',  sub: 'Your stablecoin activity on Arc' },
  '/send':      { title: 'Send & Swap',  sub: 'Transfer, bridge, or swap stablecoins' },
  '/agent':     { title: 'Agent',        sub: 'Autonomous agent triggers and watchers' },
  '/history':   { title: 'Ledger',       sub: 'Transaction history with Arc Memos' },
};

export default function Topbar({
  onToggleMobileMenu,
  isMobileOpen,
}: {
  onToggleMobileMenu?: () => void;
  isMobileOpen?: boolean;
}) {
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
      height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '0 20px', flexShrink: 0,
      borderLeft: 'none', borderRight: 'none', borderTop: 'none',
      background: 'rgba(13, 20, 36, 0.6)', zIndex: 30,
      width: '100%',
    }}>
      {/* Left section: Hamburger toggle (mobile) + Brand/Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            aria-label="Toggle Navigation Menu"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              color: '#fff', cursor: 'pointer', flexShrink: 0,
            }}
            className="md:hidden"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{meta.title}</span>
          <span className="hidden md:inline-block" style={{ width: 1, height: 16, background: 'var(--border2)', flexShrink: 0 }} />
          <span className="hidden lg:inline-block" style={{ fontSize: 12, color: 'var(--subtle)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{meta.sub}</span>
        </div>
      </div>

      {/* Right section: Badges + Connect */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>


        <div className="hidden md:block" style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--subtle)' }}>
          <span style={{ color: 'var(--muted)' }}>REP:</span> <span style={{ color: '#fff' }}>{reputation ?? 0}%</span>
        </div>

        <div className="hidden lg:block" style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--subtle)' }}>
          #{blk.toLocaleString()}
        </div>

        {!isConnected ? (
          <button onClick={() => connectInjected()} disabled={isConnecting} style={{ padding: '6px 14px', borderRadius: 8, background: '#BFFF00', color: '#000', fontWeight: 800, fontSize: 11, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {isConnecting ? 'CONNECTING...' : 'CONNECT'}
          </button>
        ) : (
          <button onClick={() => disconnect()} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'var(--mint)', background: 'rgba(180, 244, 215, 0.08)', border: '1px solid rgba(180, 244, 215, 0.2)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {shortAddress}
          </button>
        )}
      </div>
    </header>
  );
}
