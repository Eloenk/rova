'use client';
import { useEffect, useState, useCallback } from 'react';
import { Bot, Zap, Clock, TrendingUp, TrendingDown, Trash2, PauseCircle, ExternalLink } from 'lucide-react';
import { arcScan } from '@/lib/config';

type FxPair = 'USDC/EURC' | 'EURC/USDC';
type TriggerType = 'rate_gte' | 'rate_lte' | 'by_date';

interface AgentRule {
  id: string;
  createdAt: string;
  status: 'active' | 'fired' | 'cancelled' | 'expired';
  recipientLabel: string;
  recipientAddress: string;
  amount: number;
  pair: FxPair;
  triggerType: TriggerType;
  triggerValue: number;
  byDate?: string;
  toleranceBps: number;
}

interface AgentExecution {
  id: string;
  ruleId: string;
  firedAt: string;
  rateAtExecution: number;
  mode: 'mock' | 'real';
  txHash: string;
  arcScanUrl: string;
  feeJobId?: string;
  feeAmountUsdc: number;
  reputationTxHash?: string;
  memo: string;
}

const TICK_INTERVAL_MS = 5000;

export default function AgentView() {
  const [rules, setRules] = useState<AgentRule[]>([]);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [rates, setRates] = useState<Record<FxPair, number>>({ 'USDC/EURC': 0.92, 'EURC/USDC': 1.087 });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [recipientLabel, setRecipientLabel] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [pair, setPair] = useState<FxPair>('USDC/EURC');
  const [triggerType, setTriggerType] = useState<TriggerType>('rate_gte');
  const [triggerValue, setTriggerValue] = useState('');
  const [byDate, setByDate] = useState('');

  const refreshRules = useCallback(async () => {
    const res = await fetch('/api/agent/rules');
    const data = await res.json();
    if (data.ok) setRules(data.rules);
  }, []);

  const refreshRates = useCallback(async () => {
    const res = await fetch('/api/agent/rate');
    const data = await res.json();
    if (data.ok) setRates(data.rates);
  }, []);

  const tick = useCallback(async () => {
    const res = await fetch('/api/agent/tick', { method: 'POST' });
    const data = await res.json();
    if (data.ok && data.fired?.length) {
      setExecutions(prev => [...data.fired, ...prev]);
      refreshRules();
    }
    refreshRates();
  }, [refreshRules, refreshRates]);

  useEffect(() => {
    refreshRules();
    refreshRates();
    const interval = setInterval(tick, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tick, refreshRules, refreshRates]);

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      setFormError('Enter a valid recipient wallet address (0x...)');
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setFormError('Enter an amount greater than 0');
      return;
    }
    if (triggerType !== 'by_date' && (!triggerValue || parseFloat(triggerValue) <= 0)) {
      setFormError('Enter a target rate');
      return;
    }
    if (triggerType === 'by_date' && !byDate) {
      setFormError('Pick a deadline date');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/agent/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientLabel: recipientLabel || 'Recipient',
          recipientAddress,
          amount: amt,
          pair,
          triggerType,
          triggerValue: triggerValue ? parseFloat(triggerValue) : 0,
          byDate: byDate || undefined,
          toleranceBps: 10,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setFormError(data.error || 'Failed to create rule');
        return;
      }
      setRecipientLabel(''); setRecipientAddress(''); setAmount(''); setTriggerValue(''); setByDate('');
      setShowForm(false);
      refreshRules();
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelRule(id: string) {
    await fetch(`/api/agent/rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    refreshRules();
  }

  const activeRules = rules.filter(r => r.status === 'active');

  return (
    <div style={{ padding: '32px 40px', maxWidth: '980px', margin: '0 auto' }} className="animate-fade-up">

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
        <div>
          <span className="mono-tag" style={{ color: 'var(--mint)', marginBottom: '8px', display: 'block', fontSize: '11px' }}>Autonomous · Arc Testnet</span>
          <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em' }} className="text-gradient">Agent</h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '6px' }}>
            Set a condition once — Rova watches StableFX rates and executes for you, no manual send required.
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ padding: '12px 20px', borderRadius: '12px', background: 'var(--lime)', color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '13px' }}
        >
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

      {/* New rule form */}
      {showForm && (
        <form onSubmit={handleCreateRule} className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Recipient label">
              <input value={recipientLabel} onChange={e => setRecipientLabel(e.target.value)} placeholder="e.g. Sister — Nairobi" style={inputStyle} />
            </Field>
            <Field label="Recipient address">
              <input value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} placeholder="0x..." style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Amount (USDC)">
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" placeholder="200" style={inputStyle} />
            </Field>
            <Field label="Currency pair">
              <select value={pair} onChange={e => setPair(e.target.value as FxPair)} style={inputStyle}>
                <option value="USDC/EURC">USDC → EURC</option>
                <option value="EURC/USDC">EURC → USDC</option>
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Trigger">
              <select value={triggerType} onChange={e => setTriggerType(e.target.value as TriggerType)} style={inputStyle}>
                <option value="rate_gte">Rate rises to at least...</option>
                <option value="rate_lte">Rate falls to at most...</option>
                <option value="by_date">By this date, regardless of rate</option>
              </select>
            </Field>
            {triggerType === 'by_date' ? (
              <Field label="Deadline">
                <input value={byDate} onChange={e => setByDate(e.target.value)} type="date" style={inputStyle} />
              </Field>
            ) : (
              <Field label="Target rate">
                <input value={triggerValue} onChange={e => setTriggerValue(e.target.value)} type="number" step="0.0001" placeholder="0.93" style={inputStyle} />
              </Field>
            )}
          </div>

          {formError && <p style={{ color: '#ef4444', fontSize: '13px' }}>{formError}</p>}

          <button type="submit" disabled={submitting} style={{ padding: '13px', borderRadius: '12px', background: 'var(--lime)', color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '13px', marginTop: '4px' }}>
            {submitting ? 'Creating...' : 'Arm Rule'}
          </button>
        </form>
      )}

      {/* Active rules */}
      <SectionHeader icon={<Bot size={16} color="var(--mint)" />} title="Active rules" count={activeRules.length} />
      {activeRules.length === 0 ? (
        <EmptyState text="No active rules. Create one above — the agent checks live rates every few seconds." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          {activeRules.map(r => (
            <div key={r.id} className="glass-panel" style={{ padding: '18px 22px', borderRadius: '18px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {r.triggerType === 'rate_gte' ? <TrendingUp size={16} color="var(--mint)" /> : r.triggerType === 'rate_lte' ? <TrendingDown size={16} color="#60a5fa" /> : <Clock size={16} color="#BFFF00" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                  {r.amount} {r.pair.split('/')[0]} → {r.recipientLabel}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--subtle)', marginTop: '2px' }}>
                  {r.triggerType === 'by_date'
                    ? `Fires by ${r.byDate}`
                    : `Fires when ${r.pair} ${r.triggerType === 'rate_gte' ? '≥' : '≤'} ${r.triggerValue}`}
                  {' · '}{r.recipientAddress.slice(0, 6)}…{r.recipientAddress.slice(-4)}
                </p>
              </div>
              <button onClick={() => cancelRule(r.id)} title="Cancel rule" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--subtle)', padding: '6px' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Execution log */}
      <SectionHeader icon={<Zap size={16} color="#BFFF00" />} title="Autonomous executions" count={executions.length} />
      {executions.length === 0 ? (
        <EmptyState text="Nothing has fired yet. Once a rule's condition is met, it executes here automatically." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {executions.map(ex => (
            <div key={ex.id} className="glass-panel" style={{ padding: '18px 22px', borderRadius: '18px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mint)' }}>{ex.memo}</p>
                  <p style={{ fontSize: '11px', color: 'var(--subtle)', marginTop: '2px' }}>{new Date(ex.firedAt).toLocaleString()}</p>
                </div>
                <span className="mono-tag" style={{ fontSize: '10px', color: ex.mode === 'real' ? 'var(--mint)' : 'var(--subtle)' }}>{ex.mode === 'real' ? 'ON-CHAIN' : 'MOCK'}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '11px', color: 'var(--subtle)' }}>
                <a href={ex.arcScanUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                  Transfer tx <ExternalLink size={11} />
                </a>
                {ex.feeJobId && <span>Agent fee (ERC-8183): {ex.feeAmountUsdc} USDC</span>}
                {ex.reputationTxHash && <span>Reputation logged (ERC-8004)</span>}
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

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
      {icon}
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{title}</h2>
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

const inputStyle: React.CSSProperties = {
  padding: '11px 14px',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)',
  color: '#fff',
  fontSize: '13px',
  outline: 'none',
};
