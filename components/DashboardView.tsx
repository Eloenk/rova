'use client';
import { useFlowHistory } from '@/hooks/flowHistoryStore';
import { useRova } from '@/hooks/useRova';
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, Shield, ArrowRight, Send, Repeat, Globe, Moon, TrendingUp } from 'lucide-react';
import { arcScan } from '@/lib/config';

export default function Dashboard() {
  const { entries, totalExecuted, totalVolumeUsdc } = useFlowHistory();
  const { agentId, reputation, syncAgentStatus } = useRova();
  const { isConnected, usdcBalance, address } = useWallet();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    syncAgentStatus();
  }, [syncAgentStatus]);

  if (!hasMounted) return null;

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-up">

      {/* Header */}
      <header style={{ marginBottom: '40px' }}>
        <span className="mono-tag" style={{ color: 'var(--mint)', marginBottom: '8px', display: 'block', fontSize: '11px' }}>Arc Testnet • Operational</span>
        <h1 style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }} className="text-gradient">
          Command Hub
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '8px' }}>Your stablecoin activity on Arc, at a glance.</p>
      </header>

      {/* Email / wallet onboarding prompt if not connected */}
      {!isConnected && (
        <div className="glass-panel" style={{ padding: '28px 32px', borderRadius: '24px', marginBottom: '40px', border: '1px solid rgba(191,255,0,0.15)', background: 'rgba(191,255,0,0.03)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>Connect to get started</h3>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>Use your wallet or just your email address — no crypto experience needed.</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="glass-card" style={{ flex: 1, minWidth: '200px', padding: '20px', borderRadius: '16px', border: '1px solid rgba(180,244,215,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Globe size={18} color="var(--mint)" />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Email Login</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>Powered by Circle Programmable Wallets. Sign up with your email and a wallet is created for you automatically.</p>
              <Link href="/send" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--mint)', textDecoration: 'none' }}>
                Get started <ArrowRight size={14} />
              </Link>
            </div>
            <div className="glass-card" style={{ flex: 1, minWidth: '200px', padding: '20px', borderRadius: '16px', border: '1px solid rgba(180,244,215,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Shield size={18} color="#BFFF00" />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Web3 Wallet</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>Already have MetaMask or another wallet? Connect it directly to Arc Testnet.</p>
              <Link href="/send" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#BFFF00', textDecoration: 'none' }}>
                Connect wallet <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <StatTile label="USDC Balance" value={isConnected ? `$${usdcBalance ?? '0.00'}` : '—'} sub="On Arc Testnet" icon={<TrendingUp size={24} />} />
        <StatTile label="Total Sent" value={`$${totalVolumeUsdc().toLocaleString()}`} sub="All-time volume" icon={<Send size={24} />} />
        <StatTile label="Transactions" value={String(totalExecuted())} sub="Settled on Arc" icon={<Zap size={24} />} />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
        <Link href="/send" style={{ textDecoration: 'none' }}>
          <div className="glass-panel cyber-button" style={{ padding: '24px', borderRadius: '20px', cursor: 'pointer', border: '1px solid rgba(191,255,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(191,255,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={20} color="#BFFF00" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '16px', color: '#fff' }}>Send USDC</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Transfer to any wallet address or email on Arc.</p>
          </div>
        </Link>
        <Link href="/send" style={{ textDecoration: 'none' }}>
          <div className="glass-panel cyber-button" style={{ padding: '24px', borderRadius: '20px', cursor: 'pointer', border: '1px solid rgba(180,244,215,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(180,244,215,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Repeat size={20} color="var(--mint)" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '16px', color: '#fff' }}>Bridge & Swap</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Cross-chain via CCTP V2 or swap currencies with StableFX.</p>
          </div>
        </Link>
      </div>

      {/* Recent activity */}
      <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px', border: '1px solid var(--border2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Recent Activity</h3>
          <Link href="/history" style={{ fontSize: '13px', color: 'var(--mint)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 40px', color: 'var(--subtle)' }}>
            <Moon size={28} color="var(--subtle)" style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '15px' }}>No transactions yet.</p>
            <p style={{ fontSize: '13px', marginTop: '6px', color: 'var(--subtle)' }}>
              <Link href="/send" style={{ color: 'var(--mint)', textDecoration: 'none', fontWeight: 600 }}>Send your first USDC</Link> to get started.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {entries.slice(0, 5).map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: e.status === 'executed' ? 'rgba(180,244,215,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {e.status === 'executed' ? <Zap size={16} color="var(--mint)" /> : <Repeat size={16} color="var(--muted)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.intent}</p>
                  {e.executionResult?.txHashes?.[0] ? (
                    <a href={arcScan.tx(e.executionResult.txHashes[0])} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--muted)', textDecoration: 'none' }}>
                      {e.executionResult.txHashes[0].slice(0, 20)}... · Arc
                    </a>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--subtle)' }}>{e.id.slice(0, 20)}...</span>
                  )}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--mint)', flexShrink: 0 }}>+${e.totalAmount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border)' }}>
      <div style={{ marginBottom: '12px', color: 'var(--mint)' }}>{icon}</div>
      <p className="mono-tag" style={{ color: 'var(--muted)', marginBottom: '6px', fontSize: '10px' }}>{label}</p>
      <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '2px' }}>{value}</h2>
      <p style={{ fontSize: '12px', color: 'var(--subtle)', fontWeight: 500 }}>{sub}</p>
    </div>
  );
}
