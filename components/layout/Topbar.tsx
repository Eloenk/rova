'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  Menu, X, Copy, Check, MessageCircle, Send, Repeat,
  Monitor, Clock, Home, CheckCircle2, MoreHorizontal, Wallet, LogOut
} from 'lucide-react';

const META: Record<string, { title: string; sub: string }> = {
  '/':          { title: 'Rova',         sub: 'AI-powered money movement on Arc' },
  '/dashboard': { title: 'Command Hub',  sub: 'Your stablecoin activity on Arc' },
  '/send':      { title: 'Send & Swap',  sub: 'Transfer, bridge, or swap stablecoins' },
  '/agent':     { title: 'Agent',        sub: 'Autonomous agent triggers and watchers' },
  '/history':   { title: 'Recent Activity', sub: 'Transaction history with Arc Memos' },
};

export default function Topbar({
  onToggleMobileMenu,
  isMobileOpen,
}: {
  onToggleMobileMenu?: () => void;
  isMobileOpen?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const meta = META[pathname] ?? META['/dashboard'];
  const { isConnected, address, shortAddress, usdcBalance, eurcBalance, disconnect, connectInjected } = useWallet();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [copied, setCopied] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const walletBtnRef = useRef<HTMLButtonElement>(null);

  const userAddr = address || (typeof window !== 'undefined' ? localStorage.getItem('rova_user_address') : null) || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
  const displayShort = address
    ? shortAddress
    : (userAddr ? `${userAddr.slice(0, 6)}…${userAddr.slice(-4)}` : '0x71C7...976F');

  // Dynamic Token Amounts & Real USD Values
  const currentUsdc = isConnected ? (usdcBalance ?? '0.00') : '0.00';
  const currentEurc = isConnected ? (eurcBalance ?? '0.00') : '0.00';
  const currentUsyc = '0.00';

  const usdcUsd = parseFloat(currentUsdc) || 0;
  const eurcUsd = (parseFloat(currentEurc) || 0) * 1.08;
  const usycUsd = (parseFloat(currentUsyc) || 0) * 1.00;
  const totalUsd = (usdcUsd + eurcUsd + usycUsd).toFixed(2);

  // Click outside to close Phantom Wallet Popover Drawer
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node) &&
        walletBtnRef.current &&
        !walletBtnRef.current.contains(event.target as Node)
      ) {
        setShowDrawer(false);
      }
    }
    if (showDrawer) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDrawer]);

  const handleCopy = () => {
    navigator.clipboard.writeText(userAddr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header style={{
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '0 20px',
      flexShrink: 0,
      background: '#0d1520',
      borderBottom: '1px solid rgba(180, 244, 215, 0.12)',
      position: 'relative',
      zIndex: 40,
      width: '100%',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Left section: Hamburger toggle (mobile) + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            aria-label="Toggle Navigation Menu"
            style={{
              alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              color: '#fff', cursor: 'pointer', flexShrink: 0,
            }}
            className="mobile-menu-toggle"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{meta.title}</span>
          <span className="hidden md:inline-block" style={{ width: 1, height: 16, background: 'rgba(180, 244, 215, 0.2)', flexShrink: 0 }} />
          <span className="hidden lg:inline-block" style={{ fontSize: 12, color: '#8b9ba8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{meta.sub}</span>
        </div>
      </div>

      {/* Right section: WhatsApp Icon + Phantom Drawer Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button
          onClick={() => setShowWhatsAppModal(true)}
          title="Link WhatsApp AI Agent"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '7px 11px',
            borderRadius: '8px',
            background: 'rgba(37, 211, 102, 0.08)',
            border: '1px solid rgba(37, 211, 102, 0.25)',
            color: '#25D366',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            gap: '6px',
          }}
        >
          <MessageCircle size={15} color="#25D366" />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>

        {/* Phantom Wallet Pill Toggle Button */}
        <button
          ref={walletBtnRef}
          onClick={() => setShowDrawer(!showDrawer)}
          style={{
            padding: '7px 12px',
            borderRadius: '8px',
            background: '#131d2a',
            border: '1px solid rgba(180, 244, 215, 0.2)',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? '#25D366' : '#BFFF00',
            display: 'inline-block',
          }} />
          <span style={{ fontFamily: 'Inter, sans-serif' }}>{displayShort}</span>
        </button>

        {/* CUSTOM PHANTOM WALLET POPOVER DRAWER */}
        {showDrawer && (
          <div
            ref={drawerRef}
            style={{
              position: 'absolute',
              top: '60px',
              right: '20px',
              width: '350px',
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: '#ffffff',
              overflow: 'hidden',
            }}
          >
            {/* Top Bar: Pure Emoji, Wallet Type Title & Circle Address */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 16px 12px',
            }}>
              {/* Wallet Type & Circle Address */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px', lineHeight: 1 }}>👾</span>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }}>
                    {isConnected ? 'Custodian Wallet' : 'Circle Wallet'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500, fontFamily: 'monospace' }}>
                      {displayShort}
                    </span>
                    <button
                      onClick={handleCopy}
                      title="Copy Address"
                      style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0 }}
                    >
                      {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Utility Icons (Monitor & Close) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#a1a1aa' }}>
                <Monitor size={17} style={{ cursor: 'pointer' }} />
                <button
                  onClick={() => setShowDrawer(false)}
                  style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0 }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Main Content Body */}
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Huge Centered Hero Total Balance */}
              <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                <div style={{ fontSize: '40px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  ${totalUsd} <span style={{ fontSize: '18px', color: '#8b9ba8', fontWeight: 600 }}>USD</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#BFFF00' }}>Arc Testnet</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#BFFF00',
                    background: 'rgba(191, 255, 0, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '6px',
                  }}>
                    Live RPC
                  </span>
                </div>
              </div>

              {/* 3 Rounded Action Buttons Row (Send, Swap, Connect) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* Send */}
                <button
                  onClick={() => { router.push('/send'); setShowDrawer(false); }}
                  style={{
                    background: '#18181b',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '14px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#27272a')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#18181b')}
                >
                  <Send size={19} color="#ffffff" style={{ transform: 'rotate(-45deg)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>Send</span>
                </button>

                {/* Swap */}
                <button
                  onClick={() => { router.push('/send?tab=swap'); setShowDrawer(false); }}
                  style={{
                    background: '#18181b',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '14px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#27272a')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#18181b')}
                >
                  <Repeat size={19} color="#ffffff" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>Swap</span>
                </button>

                {/* Sign Out / Disconnect */}
                <button
                  onClick={() => {
                    disconnect();
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('rova_user_email');
                      document.cookie = 'rova_user_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    }
                    setShowDrawer(false);
                    router.push('/');
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '16px',
                    padding: '14px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
                >
                  <LogOut size={19} color="#ef4444" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>
                    {isConnected ? 'Disconnect' : 'Sign Out'}
                  </span>
                </button>
              </div>

              {/* Rova Banner Promotion Card */}
              {showBanner && (
                <div style={{
                  background: '#18181b',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  position: 'relative',
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#27272a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Monitor size={18} color="#22c55e" />
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff', lineHeight: 1.3, paddingRight: '16px' }}>
                    Meet Rova AI, your new home for automated stablecoin trading
                  </div>
                  <button
                    onClick={() => setShowBanner(false)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: '#71717a',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Tokens Section Header */}
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                  Tokens
                </span>
              </div>

              {/* Token Cards Feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* USDC */}
                <div style={{
                  background: '#18181b',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#27272a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#2563eb',
                    }}>
                      $
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>USDC</span>
                        <CheckCircle2 size={13} color="#2563eb" />
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#a1a1aa', fontWeight: 500, marginTop: '2px' }}>
                        {currentUsdc} USDC
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>${usdcUsd.toFixed(2)}</div>
                  </div>
                </div>

                {/* EURC */}
                <div style={{
                  background: '#18181b',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#27272a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#6366f1',
                    }}>
                      €
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>EURC</span>
                        <CheckCircle2 size={13} color="#6366f1" />
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#a1a1aa', fontWeight: 500, marginTop: '2px' }}>
                        {currentEurc} EURC
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>${eurcUsd.toFixed(2)}</div>
                  </div>
                </div>

                {/* USYC */}
                <div style={{
                  background: '#18181b',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#27272a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#22c55e',
                    }}>
                      Y
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>USYC</span>
                        <CheckCircle2 size={13} color="#22c55e" />
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#a1a1aa', fontWeight: 500, marginTop: '2px' }}>
                        {currentUsyc} USYC
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>${usycUsd.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom App Bar inside Popover */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '12px 16px',
              background: '#000000',
              borderTop: '1px solid #18181b',
            }}>
              <Home
                size={20}
                color={pathname === '/dashboard' || pathname === '/' ? '#BFFF00' : '#ffffff'}
                style={{ cursor: 'pointer', transition: 'color 0.15s ease' }}
                onClick={() => { router.push('/dashboard'); setShowDrawer(false); }}
              />
              <Repeat
                size={20}
                color={pathname === '/send' ? '#BFFF00' : '#ffffff'}
                style={{ cursor: 'pointer', transition: 'color 0.15s ease' }}
                onClick={() => { router.push('/send?tab=swap'); setShowDrawer(false); }}
              />
              <Clock
                size={20}
                color={pathname === '/history' ? '#BFFF00' : '#ffffff'}
                style={{ cursor: 'pointer', transition: 'color 0.15s ease' }}
                onClick={() => { router.push('/history'); setShowDrawer(false); }}
              />
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Deep-Link Verification Modal */}
      {showWhatsAppModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: '#0d1520',
            border: '1px solid rgba(37, 211, 102, 0.3)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowWhatsAppModal(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: '#8b9ba8',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(37, 211, 102, 0.12)',
                border: '1px solid rgba(37, 211, 102, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MessageCircle size={22} color="#25D366" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', margin: 0 }}>Link WhatsApp AI Agent</h3>
                <p style={{ fontSize: '12px', color: '#8b9ba8', margin: 0 }}>Deep-link verification (No 6-digit codes)</p>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: '#c2d1e0', lineHeight: 1.5, marginBottom: '20px' }}>
              Click the button below to open WhatsApp with your pre-filled verification token. Sending the message automatically links your phone number to your active Rova wallet.
            </p>

            <div style={{
              background: '#070c12',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#8b9ba8', display: 'block' }}>Verification Token</span>
                <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontWeight: 700 }}>LINK-8492</span>
              </div>
            </div>

            <a
              href="https://wa.me/14155552671?text=LINK-8492"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowWhatsAppModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: '#25D366',
                color: '#0d1520',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              <MessageCircle size={18} color="#0d1520" /> Open WhatsApp to Link
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
