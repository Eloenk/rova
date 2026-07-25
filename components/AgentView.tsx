'use client';
import { useEffect, useState, useCallback } from 'react';
import { Bot, Zap, Clock, TrendingUp, TrendingDown, Trash2, PauseCircle, ExternalLink, Mail, Wallet, ShoppingCart, Bell, CheckCircle2 } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { sendUsdcSelfCustody, resolveRecipientAddress } from '@/lib/selfCustodySend';

type FxPair = 'USDC/EURC' | 'EURC/USDC';
type TriggerType = 'rate_gte' | 'rate_lte' | 'by_date';
type CustodyMode = 'managed' | 'self_custody';
type RecipientType = 'email' | 'wallet';

interface AgentRule {
  id: string; createdAt: string; status: string;
  recipientLabel: string; recipientIdentifier: string; recipientType: RecipientType;
  amount: number; pair: FxPair;
  triggerType: TriggerType; triggerValue: number; byDate?: string;
  custodyMode: CustodyMode; sourceWallet: string;
}

interface StandingIntent {
  id: string; createdAt: string; status: string; intentText: string;
  plan: { splits: { address?: string; amount: number; currency: string }[] };
  trigger: { type: 'recurring'; interval: string } | { type: 'on_receive'; minAmountUsdc: number };
  custodyMode: CustodyMode; sourceWallet: string; runCount: number; lastRunAt?: string;
}

interface QuoteShopResult {
  providersChecked: number; bestProvider: string; bestRate: number; totalPaidUsdc: number;
  quotes: { provider: string; rate: number; paidUsdc: number }[];
}

interface AgentExecution {
  id: string; ruleId?: string; standingIntentId?: string; firedAt: string;
  mode: 'mock' | 'real'; txHash: string; arcScanUrl: string;
  feeJobId?: string; feeAmountUsdc: number; reputationTxHash?: string; memo: string;
  quoteShop?: QuoteShopResult;
}

const TICK_INTERVAL_MS = 5000;

export default function AgentView() {
  const { isConnected, address, connectInjected } = useWallet();
  const [rules, setRules] = useState<AgentRule[]>([]);
  const [intents, setIntents] = useState<StandingIntent[]>([]);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [rates, setRates] = useState<Record<FxPair, number>>({ 'USDC/EURC': 0.92, 'EURC/USDC': 1.087 });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [recipientLabel, setRecipientLabel] = useState('');
  const [recipientMode, setRecipientMode] = useState<RecipientType>('wallet');
  const [recipientIdentifier, setRecipientIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [pair, setPair] = useState<FxPair>('USDC/EURC');
  const [triggerType, setTriggerType] = useState<TriggerType>('rate_gte');
  const [triggerValue, setTriggerValue] = useState('');
  const [byDate, setByDate] = useState('');
  const [useConnectedWallet, setUseConnectedWallet] = useState(false);

  const refreshAll = useCallback(async () => {
    const [rRes, iRes, rateRes] = await Promise.all([
      fetch('/api/agent/rules'), fetch('/api/agent/intents'), fetch('/api/agent/rate'),
    ]);
    const [rData, iData, rateData] = await Promise.all([rRes.json(), iRes.json(), rateRes.json()]);
    if (rData.ok) setRules(rData.rules);
    if (iData.ok) setIntents(iData.intents);
    if (rateData.ok) setRates(rateData.rates);
  }, []);

  const tick = useCallback(async () => {
    const res = await fetch('/api/agent/tick', { method: 'POST' });
    const data = await res.json();
    if (data.ok && data.fired?.length) setExecutions(prev => [...data.fired, ...prev]);
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(tick, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tick, refreshAll]);

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const id = recipientIdentifier.trim();
    if (recipientMode === 'wallet' && !/^0x[a-fA-F0-9]{40}$/.test(id)) {
      setFormError('Enter a valid recipient wallet address (0x...)'); return;
    }
    if (recipientMode === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) {
      setFormError('Enter a valid recipient email'); return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setFormError('Enter an amount greater than 0'); return; }
    if (triggerType !== 'by_date' && (!triggerValue || parseFloat(triggerValue) <= 0)) { setFormError('Enter a target rate'); return; }
    if (triggerType === 'by_date' && !byDate) { setFormError('Pick a deadline date'); return; }
    if (useConnectedWallet && !address) { setFormError('Connect your wallet first'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/agent/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientLabel: recipientLabel || 'Recipient',
          recipientIdentifier: id,
          amount: amt,
          pair,
          triggerType,
          triggerValue: triggerValue ? parseFloat(triggerValue) : 0,
          byDate: byDate || undefined,
          toleranceBps: 10,
          custodyMode: useConnectedWallet ? 'self_custody' : 'managed',
          sourceWallet: useConnectedWallet ? address : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setFormError(data.error || 'Failed to create rule'); return; }
      setRecipientLabel(''); setRecipientIdentifier(''); setAmount(''); setTriggerValue(''); setByDate('');
      setShowForm(false);
      refreshAll();
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelRule(id: string) {
    await fetch(`/api/agent/rules/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) });
    refreshAll();
  }

  async function cancelIntent(id: string) {
    await fetch(`/api/agent/intents/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) });
    refreshAll();
  }

  async function approveRule(rule: AgentRule) {
    setApprovingId(rule.id);
    try {
      const recipientAddress = await resolveRecipientAddress(rule.recipientIdentifier);
      const txHash = await sendUsdcSelfCustody(recipientAddress, rule.amount);
      await fetch(`/api/agent/rules/${rule.id}/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txHash }) });
      refreshAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Approval failed');
    } finally {
      setApprovingId(null);
    }
  }

  async function approveIntent(intent: StandingIntent) {
    setApprovingId(intent.id);
    try {
      // Standing intents can carry multiple splits; self-custody approval
      // signs a single native transfer covering the plan's first split — the
      // simplification that keeps one-tap approval possible for arbitrary
      // Command Hub plans (multi-split self-custody signing in one tap is a
      // good next step, likely via a batched call once the source wallet
      // supports it).
      const firstSplit = intent.plan.splits[0];
      if (!firstSplit?.address || !firstSplit.amount) throw new Error('This plan has no sendable split');
      const txHash = await sendUsdcSelfCustody(firstSplit.address, firstSplit.amount);
      await fetch(`/api/agent/intents/${intent.id}/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txHash }) });
      refreshAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Approval failed');
    } finally {
      setApprovingId(null);
    }
  }

  const activeRules = rules.filter(r => r.status === 'active');
  const readyRules = rules.filter(r => r.status === 'ready_to_execute');
  const activeIntents = intents.filter(i => i.status === 'active');
  const readyIntents = intents.filter(i => i.status === 'ready_to_execute');

  return (
    <div style={{ padding: '32px 40px', maxWidth: '980px', margin: '0 auto' }} className="animate-fade-up">

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
        <div>
          <span className="mono-tag" style={{ color: 'var(--mint)', marginBottom: '8px', display: 'block', fontSize: '11px' }}>Autonomous</span>
          <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em' }} className="text-gradient">Agent</h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '6px' }}>
            Shops three rate providers before every move, then executes on its own, or waits for your one-tap approval if you're using your own wallet.
          </p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{ padding: '12px 20px', borderRadius: '12px', background: 'var(--lime)', color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '13px' }}>
          {showForm ? 'Cancel' : '+ New Rule'}
        </button>
      </header>

      {/* Live rate ticker */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {(Object.keys(rates) as FxPair[]).map(p => (
          <div key={p} className="glass-panel" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="mono-tag" style={{ color: 'var(--muted)', fontSize: '10px', marginBottom: '6px' }}>{p} · indicative</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{rates[p].toFixed(4)}</p>
            </div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--mint)', boxShadow: '0 0 8px var(--mint)' }} />
          </div>
        ))}
      </div>

      {/* Ready-to-execute approvals (self-custody) */}
      {(readyRules.length > 0 || readyIntents.length > 0) && (
        <div style={{ marginBottom: '28px' }}>
          <SectionHeader icon={<Bell size={16} color="#fbbf24" />} title="Waiting for your approval" count={readyRules.length + readyIntents.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {readyRules.map(r => (
              <div key={r.id} className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.04)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{r.amount} USDC → {r.recipientLabel}</p>
                  <p style={{ fontSize: '11px', color: 'var(--subtle)' }}>Trigger condition met: your wallet needs to sign this one.</p>
                </div>
                <button onClick={() => approveRule(r)} disabled={approvingId === r.id} style={approveBtnStyle}>
                  {approvingId === r.id ? 'Confirm in wallet...' : 'Approve & Send'}
                </button>
              </div>
            ))}
            {readyIntents.map(i => (
              <div key={i.id} className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.04)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>"{i.intentText}"</p>
                  <p style={{ fontSize: '11px', color: 'var(--subtle)' }}>Standing instruction is due: your wallet needs to sign this one.</p>
                </div>
                <button onClick={() => approveIntent(i)} disabled={approvingId === i.id} style={approveBtnStyle}>
                  {approvingId === i.id ? 'Confirm in wallet...' : 'Approve & Send'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New rule form */}
      {showForm && (
        <form onSubmit={handleCreateRule} className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Recipient label">
              <input value={recipientLabel} onChange={e => setRecipientLabel(e.target.value)} placeholder="e.g. Sister — Nairobi" style={inputStyle} />
            </Field>
            <Field label="Amount (USDC)">
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" placeholder="200" style={inputStyle} />
            </Field>
          </div>

          <Field label="Recipient Wallet Address">
            <input
              value={recipientIdentifier}
              onChange={e => setRecipientIdentifier(e.target.value)}
              placeholder="0x..."
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Currency pair">
              <select value={pair} onChange={e => setPair(e.target.value as FxPair)} style={inputStyle}>
                <option value="USDC/EURC">USDC → EURC</option>
                <option value="EURC/USDC">EURC → USDC</option>
              </select>
            </Field>
            <Field label="Trigger">
              <select value={triggerType} onChange={e => setTriggerType(e.target.value as TriggerType)} style={inputStyle}>
                <option value="rate_gte">Rate rises to at least...</option>
                <option value="rate_lte">Rate falls to at most...</option>
                <option value="by_date">By this date, regardless of rate</option>
              </select>
            </Field>
          </div>

          {triggerType === 'by_date' ? (
            <Field label="Deadline"><input value={byDate} onChange={e => setByDate(e.target.value)} type="date" style={inputStyle} /></Field>
          ) : (
            <Field label="Target rate"><input value={triggerValue} onChange={e => setTriggerValue(e.target.value)} type="number" step="0.0001" placeholder="0.93" style={inputStyle} /></Field>
          )}

          <div className="glass-card" style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: isConnected ? 'pointer' : 'default' }}>
              <input type="checkbox" checked={useConnectedWallet} disabled={!isConnected} onChange={e => setUseConnectedWallet(e.target.checked)} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Use my connected wallet as the source (self-custody)</span>
            </label>
            <p style={{ fontSize: '11px', color: 'var(--subtle)', marginTop: '6px', marginLeft: '26px' }}>
              {isConnected
                ? "You'll need to tap Approve each time this fires — Circle never holds your key."
                : <>Not connected. <button type="button" onClick={connectInjected} style={{ color: 'var(--mint)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '11px', textDecoration: 'underline' }}>Connect a wallet</button> to enable this, or leave unchecked to use a Rova-managed wallet that runs fully unattended.</>}
            </p>
          </div>

          {formError && <p style={{ color: '#ef4444', fontSize: '13px' }}>{formError}</p>}

          <button type="submit" disabled={submitting} style={{ padding: '13px', borderRadius: '12px', background: 'var(--lime)', color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '13px', marginTop: '4px' }}>
            {submitting ? 'Creating...' : 'Arm Rule'}
          </button>
        </form>
      )}

      {/* Active rate rules */}
      <SectionHeader icon={<Bot size={16} color="var(--mint)" />} title="Active rules" count={activeRules.length} />
      {activeRules.length === 0 ? <EmptyState text="No active rate rules. Create one above." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          {activeRules.map(r => (
            <div key={r.id} className="glass-panel" style={{ padding: '18px 22px', borderRadius: '18px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {r.triggerType === 'rate_gte' ? <TrendingUp size={16} color="var(--mint)" /> : r.triggerType === 'rate_lte' ? <TrendingDown size={16} color="#60a5fa" /> : <Clock size={16} color="#BFFF00" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{r.amount} {r.pair.split('/')[0]} → {r.recipientLabel}
                  <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 7px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--subtle)' }}>{r.recipientType === 'email' ? 'email' : 'wallet'} · {r.custodyMode === 'self_custody' ? 'self-custody' : 'managed'}</span>
                </p>
                <p style={{ fontSize: '12px', color: 'var(--subtle)', marginTop: '2px' }}>
                  {r.triggerType === 'by_date' ? `Fires by ${r.byDate}` : `Fires when ${r.pair} ${r.triggerType === 'rate_gte' ? '≥' : '≤'} ${r.triggerValue}`}
                </p>
              </div>
              <button onClick={() => cancelRule(r.id)} title="Cancel rule" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--subtle)', padding: '6px' }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Standing intents (Command Hub automations) */}
      <SectionHeader icon={<Clock size={16} color="#BFFF00" />} title="Standing instructions" count={activeIntents.length} />
      {activeIntents.length === 0 ? <EmptyState text='Nothing automated from Command Hub yet — plan an intent there and hit "Make this automatic."' /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          {activeIntents.map(i => (
            <div key={i.id} className="glass-panel" style={{ padding: '18px 22px', borderRadius: '18px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i.trigger.type === 'recurring' ? <Clock size={16} color="var(--mint)" /> : <Bell size={16} color="#fbbf24" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{i.intentText}"</p>
                <p style={{ fontSize: '12px', color: 'var(--subtle)', marginTop: '2px' }}>
                  {i.trigger.type === 'recurring' ? `Runs ${i.trigger.interval}` : `Runs when an incoming payment ≥ ${i.trigger.minAmountUsdc} USDC arrives`}
                  {' · '}{i.runCount} run{i.runCount === 1 ? '' : 's'} so far
                </p>
              </div>
              <button onClick={() => cancelIntent(i.id)} title="Cancel" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--subtle)', padding: '6px' }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Execution log */}
      <SectionHeader icon={<Zap size={16} color="#BFFF00" />} title="Autonomous executions" count={executions.length} />
      {executions.length === 0 ? <EmptyState text="Nothing has fired yet." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {executions.map(ex => (
            <div key={ex.id} className="glass-panel" style={{ padding: '18px 22px', borderRadius: '18px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mint)' }}>{ex.memo}</p>
                <span className="mono-tag" style={{ fontSize: '10px', color: ex.mode === 'real' ? 'var(--mint)' : 'var(--subtle)' }}>{ex.mode === 'real' ? 'ON-CHAIN' : 'MOCK'}</span>
              </div>

              {ex.quoteShop && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(191,255,0,0.05)', border: '1px solid rgba(191,255,0,0.15)' }}>
                  <ShoppingCart size={13} color="var(--lime)" />
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    Shopped {ex.quoteShop.providersChecked} providers for ${ex.quoteShop.totalPaidUsdc.toFixed(4)} total — best was <strong style={{ color: 'var(--lime)' }}>{ex.quoteShop.bestProvider}</strong> @ {ex.quoteShop.bestRate}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '11px', color: 'var(--subtle)' }}>
                <a href={ex.arcScanUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>Transfer tx <ExternalLink size={11} /></a>
                {ex.feeJobId && <span>Agent fee (ERC-8183): {ex.feeAmountUsdc} USDC</span>}
                {ex.reputationTxHash && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={11} /> Reputation logged (ERC-8004)</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
      {children}
    </label>
  );
}

function ModeTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', background: active ? 'rgba(191,255,0,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${active ? 'rgba(191,255,0,0.35)' : 'var(--border)'}`, color: active ? 'var(--lime)' : 'var(--muted)', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
      {icon} {label}
    </button>
  );
}

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
      {icon}<h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{title}</h2>
      <span className="mono-tag" style={{ fontSize: '10px', color: 'var(--subtle)' }}>{count}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="glass-panel" style={{ padding: '40px 32px', borderRadius: '20px', textAlign: 'center', marginBottom: '32px' }}>
      <PauseCircle size={26} color="var(--subtle)" style={{ marginBottom: '10px' }} />
      <p style={{ fontSize: '13px', color: 'var(--muted)' }}>{text}</p>
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: '11px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', fontSize: '13px', outline: 'none' };
const approveBtnStyle: React.CSSProperties = { padding: '10px 18px', borderRadius: '10px', background: '#fbbf24', color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' };
