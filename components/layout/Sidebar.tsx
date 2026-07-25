'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { Send, LayoutDashboard, BookOpen, Bot, X } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Command Hub',  icon: <LayoutDashboard size={18} strokeWidth={2.5} /> },
  { href: '/send',      label: 'Send & Swap',  icon: <Send size={18} strokeWidth={2.5} /> },
  { href: '/agent',     label: 'Agent',        icon: <Bot size={18} strokeWidth={2.5} /> },
  { href: '/history',   label: 'Ledger',       icon: <BookOpen size={18} strokeWidth={2.5} /> },
];

export default function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const { isConnected, shortAddress, usdcBalance, connectInjected, isConnecting, disconnect } = useWallet();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)', zIndex: 40,
          }}
          className="md:hidden"
        />
      )}

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
        transition: 'transform 0.3s ease-in-out',
        zIndex: 50,
      }} className={`
        fixed md:relative top-0 left-0 bottom-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo & Close button on mobile */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #BFFF00, #B4F4D7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={16} color="#0d1520" strokeWidth={3} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>ROVA</span>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
              className="md:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onCloseMobile}
                style={{
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
                }}
              >
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
                onClick={() => { connectInjected(); onCloseMobile?.(); }}
                disabled={isConnecting}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px',
                  background: 'var(--lime)', color: '#000', fontWeight: 800,
                  border: 'none', cursor: 'pointer', fontSize: '13px',
                }}
              >
                {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
              </button>
              <Link
                href="/dashboard"
                onClick={onCloseMobile}
                style={{
                  width: '100%', padding: '11px', borderRadius: '12px',
                  background: 'transparent', border: '1px solid rgba(180,244,215,0.2)',
                  color: 'var(--mint)', fontWeight: 700, fontSize: '13px',
                  textDecoration: 'none', textAlign: 'center', display: 'block',
                }}
              >
                USE CIRCLE WALLET
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


        </div>
      </aside>
    </>
  );
}
