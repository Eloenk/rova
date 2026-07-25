'use client';
import { useFlowHistory } from '@/hooks/flowHistoryStore';
import { useRova } from '@/hooks/useRova';
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, Shield, ArrowRight, Send, Repeat, Globe, Moon, TrendingUp, Sparkles, Clock, Bell } from 'lucide-react';
import { arcScan } from '@/lib/config';
import FlowPlanCard from '@/components/dashboard/FlowPlanCard';

type TriggerChoice = 'now' | 'recurring' | 'on_receive';

export default function Dashboard() {
  const { entries, totalExecuted, totalVolumeUsdc } = useFlowHistory();
  const rova = useRova();
  const { agentId, reputation, syncAgentStatus, plan, status, executionResult, processingMs, planIntent, executePlan, reset } = rova;
  const { isConnected, usdcBalance, address } = useWallet();
  const [hasMounted, setHasMounted] = useState(false);
  const [intentText, setIntentText] = useState('');
  const [showTriggerPicker, setShowTriggerPicker] = useState(false);
  const [triggerChoice, setTriggerChoice] = useState<TriggerChoice>('recurring');
  const [interval, setInterval_] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [minAmount, setMinAmount] = useState('50');
  const [automating, setAutomating] = useState(false);
  const [automateMsg, setAutomateMsg] = useState<string | null>(null);

  useEffect(() => {
    setHasMounted(true);
    syncAgentStatus();
  }, [syncAgentStatus]);

  if (!hasMounted) return null;

  const handlePlan = async () => {
    setAutomateMsg(null);
    setShowTriggerPicker(false);
    if (!intentText.trim()) return;
    await planIntent(intentText);
  };

  const handleMakeAutomatic = async () => {
    if (!plan) return;
    setAutomating(true);
    setAutomateMsg(null);
    try {
      const custodyMode = isConnected ? 'self_custody' : 'managed';
      const trigger = triggerChoice === 'recurring'
        ? { type: 'recurring' as const, interval }
        : { type: 'on_receive' as const, minAmountUsdc: parseFloat(minAmount) || 50 };

      const res = await fetch('/api/agent/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentText,
          plan,
          trigger,
          custodyMode,
          sourceWallet: isConnected ? address : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setAutomateMsg(`Couldn't automate: ${data.error}`); return; }
      setAutomateMsg('Saved. Rova will run this on its own from now on — check the Agent tab.');
      setIntentText('');
      reset();
      setShowTriggerPicker(false);
    } catch (e) {
      setAutomateMsg(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setAutomating(false);
    }
  };

  return (
    <div className="animate-fade-up max-w-7xl mx-auto w-full px-4 sm:px-8 py-6">

      {/* Header */}
      <header style={{ marginBottom: '40px' }}>
        <span className="mono-tag" style={{ color: 'var(--mint)', marginBottom: '8px', display: 'block', fontSize: '11px' }}>Operational</span>
        <h1 style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }} className="text-gradient">
          Command Hub
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '8px' }}>Your stablecoin activity on Arc, at a glance.</p>
      </header>

      {/* Quick Intent — type it once, run it now or make it automatic */}
      <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px', border: '1px solid var(--border2)', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Sparkles size={16} color="var(--mint)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Tell Rova what you want to do</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
          "Send 100 USDC split between my supplier and savings" — plan it once, then either run it now or make it automatic.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            value={intentText}
            onChange={e => setIntentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePlan()}
            placeholder="Type your intent..."
            style={{ flex: 1, padding: '13px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', fontSize: '14px', outline: 'none' }}
          />
          <button
            onClick={handlePlan}
            disabled={status === 'planning' || !intentText.trim()}
            style={{ padding: '13px 22px', borderRadius: '12px', background: 'var(--lime)', color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '13px', opacity: status === 'planning' ? 0.7 : 1, whiteSpace: 'nowrap' }}
          >
            {status === 'planning' ? 'Planning...' : 'Plan it'}
          </button>
        </div>

        {plan && (
          <div style={{ marginTop: '20px' }}>
            <FlowPlanCard
              plan={plan}
              status={status}
              executionResult={executionResult}
              onExecute={() => executePlan(isConnected ? address : undefined)}
              isWalletConnected={isConnected}
              processingMs={processingMs}
            />

            {status === 'planned' && (
              <div style={{ marginTop: '14px' }}>
                {!showTriggerPicker ? (
                  <button
                    onClick={() => setShowTriggerPicker(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 18px', borderRadius: '12px', background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.25)', color: 'var(--lime)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                  >
                    <Clock size={15} /> Make this automatic instead
                  </button>
                ) : (
                  <div className="glass-card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '10px' }}>Run this automatically</p>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                      <TriggerTab active={triggerChoice === 'recurring'} onClick={() => setTriggerChoice('recurring')} icon={<Clock size={14} />} label="On a schedule" />
                      <TriggerTab active={triggerChoice === 'on_receive'} onClick={() => setTriggerChoice('on_receive')} icon={<Bell size={14} />} label="When I receive a payment" />
                    </div>

                    {triggerChoice === 'recurring' ? (
                      <select value={interval} onChange={e => setInterval_(e.target.value as any)} style={pickerInputStyle}>
                        <option value="daily">Every day</option>
                        <option value="weekly">Every week</option>
                        <option value="monthly">Every month</option>
                      </select>
                    ) : (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--subtle)' }}>Trigger when an incoming payment is at least</span>
                        <input value={minAmount} onChange={e => setMinAmount(e.target.value)} type="number" step="1" style={pickerInputStyle} />
                      </label>
                    )}

                    <p style={{ fontSize: '11px', color: 'var(--subtle)', marginTop: '12px', marginBottom: '14px' }}>
                      {isConnected
                        ? "You're using your own connected wallet — Rova will detect the trigger and ask you to approve with one tap each time (it can't sign for a wallet it doesn't hold the key to)."
                        : 'Using a Rova-managed wallet — this will run fully on its own, no approval needed each time.'}
                    </p>

                    <button
                      onClick={handleMakeAutomatic}
                      disabled={automating}
                      style={{ padding: '11px 20px', borderRadius: '10px', background: 'var(--lime)', color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '13px', opacity: automating ? 0.7 : 1 }}
                    >
                      {automating ? 'Saving...' : 'Confirm automation'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {automateMsg && (
          <p style={{ marginTop: '14px', fontSize: '13px', color: automateMsg.startsWith("Couldn't") ? '#f87171' : 'var(--mint)' }}>{automateMsg}</p>
        )}
      </div>

      {/* Email / wallet onboarding prompt if not connected */}
      {!isConnected && (
        <div className="glass-panel" style={{ padding: '28px 32px', borderRadius: '24px', marginBottom: '40px', border: '1px solid rgba(191,255,0,0.15)', background: 'rgba(191,255,0,0.03)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>Get Started with Rova</h3>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>Choose your preferred wallet mode: automated agent execution via Circle or direct Web3 self-custody.</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="glass-card" style={{ flex: 1, minWidth: '200px', padding: '20px', borderRadius: '16px', border: '1px solid rgba(180,244,215,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Globe size={18} color="var(--mint)" />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Circle Programmable Wallet</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>Developer-controlled HSM wallets on Arc. Best for automated 24/7 background triggers and agent execution.</p>
              <Link href="/send" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--mint)', textDecoration: 'none' }}>
                Open Send Hub <ArrowRight size={14} />
              </Link>
            </div>
            <div className="glass-card" style={{ flex: 1, minWidth: '200px', padding: '20px', borderRadius: '16px', border: '1px solid rgba(180,244,215,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Shield size={18} color="#BFFF00" />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Web3 Self-Custody</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>Connect MetaMask or any Web3 wallet directly to sign transactions on Arc with single-tap approval.</p>
              <Link href="/send" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#BFFF00', textDecoration: 'none' }}>
                Connect Wallet <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <StatTile label="USDC Balance" value={isConnected ? `$${usdcBalance ?? '0.00'}` : '$0.00'} sub="USDC Balance" icon={<TrendingUp size={24} />} />
        <StatTile label="Total Sent" value={`$${totalVolumeUsdc().toLocaleString()}`} sub="All-time volume" icon={<Send size={24} />} />
        <StatTile label="Transactions" value={String(totalExecuted())} sub="Settled on Arc" icon={<Zap size={24} />} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
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

function TriggerTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px',
        background: active ? 'rgba(191,255,0,0.1)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${active ? 'rgba(191,255,0,0.35)' : 'var(--border)'}`,
        color: active ? 'var(--lime)' : 'var(--muted)', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
      }}
    >
      {icon} {label}
    </button>
  );
}

const pickerInputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)', color: '#fff', fontSize: '13px', outline: 'none',
};

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
