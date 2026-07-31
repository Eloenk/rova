'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useRova } from '@/hooks/useRova';
import { Send, Repeat, Globe, ArrowRight, Loader, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';

type Action = 'send' | 'bridge' | 'swap';

const ACTIONS: { id: Action; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'send',   label: 'Send',   icon: <Send size={16} />,   desc: 'Transfer stablecoins to a wallet address or recipient' },
  { id: 'bridge', label: 'Bridge', icon: <Globe size={16} />,  desc: 'Move USDC cross-chain via CCTP V2' },
  { id: 'swap',   label: 'Swap',   icon: <Repeat size={16} />, desc: 'Exchange USDC ↔ EURC with StableFX' },
];

const BRIDGE_CHAINS = ['Ethereum', 'Base', 'Polygon', 'Solana', 'Arbitrum'];
const CURRENCIES = ['USDC', 'EURC', 'USYC'];

export default function SendView() {
  const { isConnected, usdcBalance } = useWallet();
  const { executeFlow, isProcessing } = useRova();

  const [action, setAction] = useState<Action>('send');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [fromChain, setFromChain] = useState('Ethereum');
  const [toChain, setToChain] = useState('Arc');
  const [fromCurrency, setFromCurrency] = useState('USDC');
  const [toCurrency, setToCurrency] = useState('EURC');
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resultMsg, setResultMsg] = useState('');

  const buildIntent = () => {
    if (action === 'send') {
      return `Send ${amount} ${fromCurrency} to ${recipient}${memo ? ` — memo: ${memo}` : ''}`;
    }
    if (action === 'bridge') return `Bridge ${amount} ${fromCurrency} from ${fromChain} to ${toChain}${memo ? ` — memo: ${memo}` : ''}`;
    if (action === 'swap')   return `Swap ${amount} ${fromCurrency} to ${toCurrency} using StableFX${memo ? ` — memo: ${memo}` : ''}`;
    return '';
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) { setStatus('error'); setResultMsg('Enter a valid amount.'); return; }
    if (action === 'send' && !recipient) { setStatus('error'); setResultMsg('Enter a recipient address.'); return; }

    setStatus('loading');
    setResultMsg('');
    try {
      const intent = buildIntent();
      await executeFlow(intent);
      setStatus('success');
      setResultMsg(`${action === 'send' ? 'Transfer' : action === 'bridge' ? 'Bridge' : 'Swap'} initiated on Arc. Check your Ledger for confirmation.`);
      setAmount(''); setRecipient(''); setMemo('');
    } catch (err: unknown) {
      setStatus('error');
      setResultMsg(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    }
  };

  return (
    <div className="py-8 px-4 sm:px-8 max-w-[680px] mx-auto animate-fade-up font-sans">
      {/* Header */}
      <header className="mb-8">
        <span className="text-[11px] font-mono font-bold tracking-widest text-accent-mint uppercase block mb-1">
          Operational Flow
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
          Send & Swap
        </h1>
        <p className="text-text-secondary text-sm sm:text-base mt-1">
          Move stablecoins on Arc with instant sub-second finality.
        </p>
      </header>

      {/* Rounded-Pill Segmented Action Control */}
      <div className="flex gap-1.5 p-1.5 mb-6 rounded-full bg-surface border border-border">
        {ACTIONS.map(a => {
          const isActive = action === a.id;
          return (
            <button
              key={a.id}
              onClick={() => { setAction(a.id); setStatus('idle'); }}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full border-0 cursor-pointer font-bold text-xs sm:text-sm transition-all
                ${isActive
                  ? 'bg-accent-mint/15 text-accent-mint border border-accent-mint/30 shadow-sm'
                  : 'bg-transparent text-text-secondary hover:text-text-primary'}
              `}
            >
              {a.icon} {a.label}
            </button>
          );
        })}
      </div>

      {/* Main Card Container */}
      <div className="p-6 sm:p-8 rounded-xl bg-surface-raised border border-border shadow-xl space-y-5">
        {/* SEND FORM */}
        {action === 'send' && (
          <div className="space-y-4">
            <Field label="Recipient wallet address" hint="Target EVM address on Arc">
              <input
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 rounded-md bg-surface border border-border text-text-primary text-sm outline-none focus:border-accent-mint transition-colors font-mono"
              />
            </Field>
            <Field label="Currency">
              <Select value={fromCurrency} onChange={setFromCurrency} options={CURRENCIES} />
            </Field>
          </div>
        )}

        {/* BRIDGE FORM */}
        {action === 'bridge' && (
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
              <Field label="From chain">
                <Select value={fromChain} onChange={setFromChain} options={BRIDGE_CHAINS} />
              </Field>
              <div className="pb-3 text-text-secondary"><ArrowRight size={18} /></div>
              <Field label="To chain">
                <Select value={toChain} onChange={setToChain} options={['Arc', ...BRIDGE_CHAINS.filter(c => c !== fromChain)]} />
              </Field>
            </div>
            <Field label="Currency">
              <Select value={fromCurrency} onChange={setFromCurrency} options={CURRENCIES} />
            </Field>
          </div>
        )}

        {/* SWAP FORM */}
        {action === 'swap' && (
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <Field label="From currency">
              <Select value={fromCurrency} onChange={setFromCurrency} options={CURRENCIES} />
            </Field>
            <div className="pb-3 text-text-secondary"><Repeat size={18} /></div>
            <Field label="To currency">
              <Select value={toCurrency} onChange={setToCurrency} options={CURRENCIES.filter(c => c !== fromCurrency)} />
            </Field>
          </div>
        )}

        {/* Amount — shared */}
        <Field label={`Amount (${fromCurrency})`} hint={isConnected && usdcBalance ? `Available: $${usdcBalance}` : undefined}>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-base">
              {fromCurrency === 'EURC' ? '€' : '$'}
            </span>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              type="number"
              min="0"
              placeholder="0.00"
              className="w-full p-3 pl-8 pr-14 rounded-md bg-surface border border-border text-text-primary text-sm outline-none focus:border-accent-mint font-mono"
            />
            {isConnected && usdcBalance && (
              <button
                onClick={() => setAmount(usdcBalance)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-accent-mint bg-transparent border-0 cursor-pointer hover:underline"
              >
                MAX
              </button>
            )}
          </div>
        </Field>

        {/* Memo */}
        <Field label="Memo (optional)" hint="Attached as a Transaction Memo on Arc">
          <input
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="e.g. Invoice #12, rent, supplier payment..."
            className="w-full p-3 rounded-md bg-surface border border-border text-text-primary text-sm outline-none focus:border-accent-mint"
          />
        </Field>

        {/* Status Feedback */}
        {status !== 'idle' && status !== 'loading' && (
          <div className={`
            flex items-start gap-2.5 p-3.5 rounded-lg text-xs leading-relaxed border
            ${status === 'success' ? 'bg-accent-mint/10 border-accent-mint/25 text-accent-mint' : 'bg-accent-error/10 border-accent-error/25 text-accent-error'}
          `}>
            {status === 'success' ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
            <p>{resultMsg}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isProcessing || status === 'loading'}
          className="w-full py-3.5 rounded-lg bg-[#BFFF00] text-black font-semibold text-sm border-0 cursor-pointer flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md"
        >
          {isProcessing || status === 'loading'
            ? <><Loader size={16} className="animate-spin" /> Processing...</>
            : <>{action === 'send' ? `Send ${fromCurrency}` : action === 'bridge' ? `Bridge ${fromCurrency}` : `Swap ${fromCurrency} ↔ ${toCurrency}`} <ArrowRight size={16} /></>
          }
        </button>
      </div>

      {/* Powered by Footer */}
      <div className="flex justify-center gap-6 mt-6 opacity-50 text-xs font-mono text-text-secondary">
        {['Circle Wallets', 'CCTP V2', 'StableFX', 'Arc Memos'].map(t => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <label className="text-xs font-semibold text-text-secondary">{label}</label>
        {hint && <span className="text-[11px] text-text-tertiary">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full p-3 pr-9 rounded-md bg-surface border border-border text-text-primary text-sm outline-none cursor-pointer appearance-none"
      >
        {options.map(o => (
          <option key={o} value={o} className="bg-surface-raised text-text-primary">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
    </div>
  );
}
