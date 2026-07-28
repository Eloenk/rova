'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Send, LayoutDashboard, BookOpen, Bot, X } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Command Hub',     icon: <LayoutDashboard size={18} strokeWidth={2.5} /> },
  { href: '/send',      label: 'Send & Swap',     icon: <Send size={18} strokeWidth={2.5} /> },
  { href: '/agent',     label: 'Agent',           icon: <Bot size={18} strokeWidth={2.5} /> },
  { href: '/history',   label: 'Recent Activity', icon: <BookOpen size={18} strokeWidth={2.5} /> },
];

export default function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();

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
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #BFFF00, #B4F4D7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={16} color="#0d1520" strokeWidth={3} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>ROVA</span>
          </Link>

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

        {/* Bottom inscription: Crisp all-white text, no box container, no bullet dot */}
        <div style={{ marginTop: 'auto', paddingLeft: '8px', paddingBottom: '4px' }}>
          <span style={{ fontSize: '12px', color: '#8b9ba8', fontWeight: 600, letterSpacing: '0.02em' }}>
            Arc Testnet • 5042002
          </span>
        </div>
      </aside>
    </>
  );
}
