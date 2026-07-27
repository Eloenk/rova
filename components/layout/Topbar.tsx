'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Menu, X, Wallet as WalletIcon, Copy, Check, Plus, MessageCircle, Send, Repeat, DollarSign, CheckCircle2 } from 'lucide-react';

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
  const { isConnected, address, shortAddress, usdcBalance, disconnect } = useWallet();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddCustodian, setShowAddCustodian] = useState(false);
  const [custodianInput, setCustodianInput] = useState('');
  const [custodianList, setCustodianList] = useState<string[]>([]);

  const defaultAddr = address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
  const displayShort = address ? shortAddress : '0x71C7...976F';

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultAddr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAddCustodian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custodianInput.startsWith('0x') || custodianInput.length < 10) return;
    setCustodianList([...custodianList, custodianInput]);
    setCustodianInput('');
    setShowAddCustodian(false);
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
          <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{meta.title}</span>
          <span className="hidden md:inline-block" style={{ width: 1, height: 16, background: 'var(--border2)', flexShrink: 0 }} />
          <span className="hidden lg:inline-block" style={{ fontSize: 12, color: 'var(--subtle)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{meta.sub}</span>
        </div>
      </div>

      {/* Right section: WhatsApp Icon + USDC Balance Badge + Phantom Drawer Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button
          onClick={() => setShowWhatsAppModal(true)}
          title="Link WhatsApp AI Agent"
          style={{
            padding: '7px 10px',
            borderRadius: '8px',
            background: 'rgba(37, 211, 102, 0.08)',
            border: '1px solid rgba(37, 211, 102, 0.25)',
            color: '#25D366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <MessageCircle size={15} />
          <span className="hidden sm:inline-block">Link WhatsApp</span>
        </button>

        {/* USDC Balance Display in Topbar */}
        <div className="hidden md:flex" style={{
          padding: '6px 12px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: 12,
          fontWeight: 500,
          color: '#ffffff',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ color: '#8b9ba8', fontWeight: 400 }}>Balance:</span>
          <span>${isConnected ? (usdcBalance ?? '1,250.00') : '1,250.00'} USDC</span>
        </div>

        {/* Minimalist Topbar Wallet Button */}
        <button
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

        {/* Minimalist Drawer Popover (Slim Inter Typography, Emoji Logo, White Accents) */}
        {showDrawer && (
          <div style={{
            position: 'absolute',
            top: '64px',
            right: '20px',
            width: '320px',
            background: '#0d1520',
            border: '1px solid #1c1c1c',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            fontFamily: 'Inter, sans-serif',
          }}>
            {/* Header: Logo, Name, Address & Copy */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}>
                  👻
                </div>

                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#ffffff', lineHeight: 1.2 }}>
                    Phantom Wallet
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#8b9ba8', fontWeight: 400, marginTop: '2px' }}>
                    {displayShort}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopy}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? '#ffffff' : '#8b9ba8',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {copied ? <Check size={15} color="#ffffff" /> : <Copy size={15} />}
              </button>
            </div>

            {/* Total Balance Hero Card */}
            <div style={{
              background: '#070c12',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid #181818',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '11.5px', color: '#8b9ba8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 400 }}>
                Total Balance
              </div>
              <div style={{ fontSize: '24px', fontWeight: 500, color: '#ffffff', margin: '4px 0 2px' }}>
                ${isConnected ? (usdcBalance ?? '1,250.00') : '1,250.00'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#8b9ba8', fontWeight: 400 }}>
                USDC (Arc Testnet)
              </div>
            </div>

            {/* Action Row: Send and Swap with Pure White Icons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Send', icon: <Send size={15} color="#ffffff" />, action: () => router.push('/send') },
                { label: 'Swap', icon: <Repeat size={15} color="#ffffff" />, action: () => router.push('/send?tab=swap') },
              ].map(({ label, icon, action }, i) => (
                <button
                  key={i}
                  onClick={() => { action(); setShowDrawer(false); }}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '10px',
                    background: '#131d2a',
                    border: '1px solid #1c1c1c',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {icon}
                  </div>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Managed Custodians Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', color: '#8b9ba8', fontWeight: 400 }}>Managed Custodians</span>
                <button
                  onClick={() => setShowAddCustodian(!showAddCustodian)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '11.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                >
                  <Plus size={13} /> Add
                </button>
              </div>

              {showAddCustodian && (
                <form onSubmit={handleAddCustodian} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="0x... custodian address"
                    value={custodianInput}
                    onChange={(e) => setCustodianInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: '#070c12',
                      border: '1px solid #222222',
                      color: '#ffffff',
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontWeight: 400,
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="submit"
                      style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#ffffff', color: '#000000', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCustodian(false)}
                      style={{ padding: '8px 12px', borderRadius: '8px', background: '#141414', color: '#8b9ba8', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 400 }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {custodianList.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {custodianList.map((cust, idx) => (
                    <div key={idx} style={{ fontSize: '11px', color: '#8b9ba8', padding: '6px 8px', background: '#0a0a0a', borderRadius: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 400 }}>
                      {cust}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disconnect Button if Connected */}
            {isConnected && (
              <button
                onClick={() => { disconnect(); setShowDrawer(false); }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'none',
                  border: 'none',
                  borderTop: '1px solid #1c1c1c',
                  color: '#ef4444',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                Disconnect Session
              </button>
            )}
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
              border: '1px dashed rgba(37, 211, 102, 0.3)',
              borderRadius: '10px',
              padding: '14px',
              textAlign: 'center',
              marginBottom: '20px',
            }}>
              <span style={{ fontSize: '11px', color: '#8b9ba8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                Verification Link Token
              </span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#25D366', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                LINK-8492
              </span>
            </div>

            <a
              href="https://wa.me/14155552671?text=LINK-8492"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowWhatsAppModal(false)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: '#25D366',
                color: '#0d1520',
                fontSize: '14.5px',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(37, 211, 102, 0.25)',
              }}
            >
              <MessageCircle size={18} />
              Connect on WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
