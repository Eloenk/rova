'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { Send, LayoutDashboard, BookOpen, Bot } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Command Hub',  icon: <LayoutDashboard size={18} strokeWidth={2.5} /> },
  { href: '/send',      label: 'Send & Swap',  icon: <Send size={18} strokeWidth={2.5} /> },
  { href: '/agent',     label: 'Agent',        icon: <Bot size={18} strokeWidth={2.5} /> },
  { href: '/history',   label: 'Ledger',       icon: <BookOpen size={18} strokeWidth={2.5} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isConnected, shortAddress, usdcBalance, connectInjected, isConnecting, disconnect } = useWallet();

  return (
    <aside style={{
      width: '240px',
      height: '100%',
      borderRight: '1px solid var(--border)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      background: 'var(--sidebar)',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #BFFF00, #B4F4D7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={16} color="#0d1520" strokeWidth={3} />
        </div>
        <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>ROVA</span>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {NAV.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '12px',
              textDecoration: 'none',
              color: isActive ? 'var(--mint)' : 'var(--muted)',
              background: isActive ? 'rgba(180, 244, 215, 0.08)' : 'transparent',
              border: isActive ? '1px solid rgba(180, 244, 215, 0.15)' : '1px solid transparent',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s',
            }}>
              {icon}
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: wallet */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!isConnected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => connectInjected()}
              disabled={isConnecting}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px',
                background: 'var(--lime)', color: '#000', fontWeight: 800,
                border: 'none', cursor: 'pointer', fontSize: '13px',
              }}
            >
              {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
            </button>
            <Link href="/dashboard" style={{
              width: '100%', padding: '11px', borderRadius: '12px',
              background: 'transparent', border: '1px solid rgba(180,244,215,0.2)',
              color: 'var(--mint)', fontWeight: 700, fontSize: '13px',
              textDecoration: 'none', textAlign: 'center', display: 'block',
            }}>
              USE EMAIL INSTEAD
            </Link>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px', cursor: 'pointer' }} onClick={() => disconnect()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="mono-tag" style={{ color: 'var(--mint)', fontSize: '10px' }}>Connected</span>
              <span style={{ fontSize: '10px', color: 'var(--subtle)' }}>{shortAddress}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '11px', color: 'var(--subtle)' }}>USDC Balance</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>${usdcBalance ?? '0.00'}</span>
            </div>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--mint)' }} />
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Arc Testnet</span>
            </div>
            <span className="mono-tag" style={{ fontSize: '10px', color: 'var(--subtle)' }}>14ms</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
