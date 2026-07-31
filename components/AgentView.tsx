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
    <div className="py-8 px-4 sm:px-8 max-w-[980px] mx-auto animate-fade-up font-sans">
      <header className="flex justify-between items-end mb-7">
        <div>
          <span className="text-[11px] font-mono font-bold tracking-widest text-accent-mint uppercase block mb-1">Autonomous Agent</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-accent-primary via-accent-mint to-accent-success bg-clip-text text-transparent">Agent</h1>
          <p className="text-text-secondary text-sm sm:text-base mt-1">
            Shops three rate providers before every move, then executes on its own, or waits for your one-tap approval if using your wallet.
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="py-2.5 px-5 rounded-lg bg-accent-primary text-primary-foreground font-extrabold text-xs cursor-pointer hover:brightness-110 transition-all border-0 shadow-md"
        >
          {showForm ? 'Cancel' : '+ New Rule'}
        </button>
      </header>

      {/* Live Rate Ticker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
        {(Object.keys(rates) as FxPair[]).map(p => (
          <div key={p} className="p-4 rounded-xl bg-surface border border-border flex justify-between items-center shadow-md">
            <div>
              <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider mb-1">{p} · indicative</p>
              <p className="text-xl font-bold font-mono text-text-primary">{rates[p].toFixed(4)}</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-accent-mint shadow-[0_0_10px_var(--accent-mint)]" />
          </div>
        ))}
      </div>

      {/* Waiting Approvals */}
      {(readyRules.length > 0 || readyIntents.length > 0) && (
        <div className="mb-7">
          <SectionHeader icon={<Bell size={16} className="text-amber-400" />} title="Waiting for your approval" count={readyRules.length + readyIntents.length} />
          <div className="flex flex-col gap-2.5">
            {readyRules.map(r => (
              <div key={r.id} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-bold text-text-primary">{r.amount} USDC → {r.recipientLabel}</p>
                  <p className="text-text-tertiary">Trigger condition met: your wallet needs to sign this one.</p>
                </div>
                <button
                  onClick={() => approveRule(r)}
                  disabled={approvingId === r.id}
                  className="px-4 py-2 rounded-lg bg-amber-400 text-black font-extrabold text-xs cursor-pointer hover:bg-amber-300 border-0 shrink-0"
                >
                  {approvingId === r.id ? 'Confirming...' : 'Approve & Send'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Rule Form */}
      {showForm && (
        <form onSubmit={handleCreateRule} className="p-6 rounded-xl bg-surface-raised border border-border mb-7 flex flex-col gap-3.5 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Field label="Recipient label">
              <input value={recipientLabel} onChange={e => setRecipientLabel(e.target.value)} placeholder="e.g. Sister — Nairobi" className="w-full p-2.5 rounded-md bg-surface border border-border text-text-primary text-xs outline-none focus:border-accent-mint" />
            </Field>
            <Field label="Amount (USDC)">
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" placeholder="200" className="w-full p-2.5 rounded-md bg-surface border border-border text-text-primary text-xs outline-none focus:border-accent-mint font-mono" />
            </Field>
          </div>

          <Field label="Recipient Wallet Address">
            <input value={recipientIdentifier} onChange={e => setRecipientIdentifier(e.target.value)} placeholder="0x..." className="w-full p-2.5 rounded-md bg-surface border border-border text-text-primary text-xs outline-none focus:border-accent-mint font-mono" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Field label="Currency pair">
              <select value={pair} onChange={e => setPair(e.target.value as FxPair)} className="w-full p-2.5 rounded-md bg-surface border border-border text-text-primary text-xs outline-none">
                <option value="USDC/EURC">USDC → EURC</option>
                <option value="EURC/USDC">EURC → USDC</option>
              </select>
            </Field>
            <Field label="Trigger">
              <select value={triggerType} onChange={e => setTriggerType(e.target.value as TriggerType)} className="w-full p-2.5 rounded-md bg-surface border border-border text-text-primary text-xs outline-none">
                <option value="rate_gte">Rate rises to at least...</option>
                <option value="rate_lte">Rate falls to at most...</option>
                <option value="by_date">By this date, regardless of rate</option>
              </select>
            </Field>
          </div>

          {triggerType === 'by_date' ? (
            <Field label="Deadline"><input value={byDate} onChange={e => setByDate(e.target.value)} type="date" className="w-full p-2.5 rounded-md bg-surface border border-border text-text-primary text-xs outline-none" /></Field>
          ) : (
            <Field label="Target rate"><input value={triggerValue} onChange={e => setTriggerValue(e.target.value)} type="number" step="0.0001" placeholder="0.93" className="w-full p-2.5 rounded-md bg-surface border border-border text-text-primary text-xs outline-none font-mono" /></Field>
          )}

          {formError && <p className="text-accent-error text-xs">{formError}</p>}

          <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg bg-accent-primary text-primary-foreground font-extrabold text-xs cursor-pointer hover:brightness-110 border-0 shadow-md">
            {submitting ? 'Creating...' : 'Arm Rule'}
          </button>
        </form>
      )}

      {/* Active Rate Rules */}
      <SectionHeader icon={<Bot size={16} className="text-accent-mint" />} title="Active rules" count={activeRules.length} />
      {activeRules.length === 0 ? <EmptyState text="No active rate rules. Create one above." /> : (
        <div className="flex flex-col gap-2.5 mb-8">
          {activeRules.map(r => (
            <div key={r.id} className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-raised border border-border flex items-center justify-center shrink-0">
                  {r.triggerType === 'rate_gte' ? <TrendingUp size={14} className="text-accent-mint" /> : <TrendingDown size={14} className="text-blue-400" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">{r.amount} {r.pair.split('/')[0]} → {r.recipientLabel}</p>
                  <p className="text-xs text-text-secondary">Fires when {r.pair} {r.triggerType === 'rate_gte' ? '≥' : '≤'} {r.triggerValue}</p>
                </div>
              </div>
              <button onClick={() => cancelRule(r.id)} className="bg-transparent border-0 text-text-tertiary cursor-pointer hover:text-accent-error p-1">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Execution Log */}
      <SectionHeader icon={<Zap size={16} className="text-accent-primary" />} title="Autonomous executions" count={executions.length} />
      {executions.length === 0 ? <EmptyState text="Nothing has fired yet." /> : (
        <div className="flex flex-col gap-2.5">
          {executions.map(ex => (
            <div key={ex.id} className="p-4 rounded-xl bg-surface border border-border space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <p className="font-bold text-accent-mint">{ex.memo}</p>
                <span className="font-mono text-[10px] text-text-tertiary">{ex.mode === 'real' ? 'ON-CHAIN' : 'MOCK'}</span>
              </div>
              <div className="flex gap-4 text-text-secondary text-[11px]">
                <a href={ex.arcScanUrl} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text-primary flex items-center gap-1">
                  Explorer <ExternalLink size={11} />
                </a>
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
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-mono font-bold text-text-tertiary uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}<h2 className="text-sm font-bold text-text-primary">{title}</h2>
      <span className="text-xs font-mono text-text-tertiary">({count})</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-8 rounded-xl bg-surface border border-border text-center mb-8">
      <PauseCircle size={24} className="text-text-tertiary mx-auto mb-2" />
      <p className="text-xs text-text-secondary">{text}</p>
    </div>
  );
}
