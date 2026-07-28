'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useRova } from '@/hooks/useRova';
import { Send, Repeat, Globe, ArrowRight, Loader, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';

type Action = 'send' | 'bridge' | 'swap';

const ACTIONS: { id: Action; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'send',   label: 'Send',   icon: <Send size={18} />,   desc: 'Transfer stablecoins to a wallet address or recipient' },
  { id: 'bridge', label: 'Bridge', icon: <Globe size={18} />,  desc: 'Move USDC cross-chain via CCTP V2' },
  { id: 'swap',   label: 'Swap',   icon: <Repeat size={18} />, desc: 'Exchange USDC ↔ EURC with StableFX' },
];

const BRIDGE_CHAINS = ['Ethereum', 'Base', 'Polygon', 'Solana', 'Arbitrum'];
const CURRENCIES = ['USDC', 'EURC', 'USYC'];

export default function SendView() {
  const { isConnected, connectInjected, isConnecting, usdcBalance } = useWallet();
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
    <div style={{ padding: '32px 40px', maxWidth: '680px', margin: '0 auto' }} className="animate-fade-up">

      {/* Header */}
      <header style={{ marginBottom: '36px' }}>
        <span className="mono-tag" style={{ color: 'var(--mint)', marginBottom: '8px', display: 'block', fontSize: '11px' }}>Operational</span>
        <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em' }} className="text-gradient">Send & Swap</h1>
        <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '6px' }}>Move stablecoins on Arc. No jargon required.</p>
      </header>

      {/* Action selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
        {ACTIONS.map(a => (
          <button key={a.id} onClick={() => { setAction(a.id); setStatus('idle'); }} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            background: action === a.id ? 'rgba(255,255,255,0.07)' : 'transparent',
            color: action === a.id ? '#fff' : 'var(--muted)',
            fontWeight: action === a.id ? 700 : 500, fontSize: '14px', transition: 'all 0.2s',
          }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px', border: '1px solid var(--border2)' }}>

        {/* SEND FORM */}
        {action === 'send' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
            <Field label="Recipient wallet address" hint="Target address on Arc or connected chain">
              <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="0x..." style={inputStyle} />
            </Field>
            <Field label="Currency">
              <Select value={fromCurrency} onChange={setFromCurrency} options={CURRENCIES} />
            </Field>
          </div>
        )}

        {/* BRIDGE FORM */}
        {action === 'bridge' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'end' }}>
              <Field label="From chain">
                <Select value={fromChain} onChange={setFromChain} options={BRIDGE_CHAINS} />
              </Field>
              <div style={{ paddingBottom: '14px', color: 'var(--muted)' }}><ArrowRight size={18} /></div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'end', marginBottom: '20px' }}>
            <Field label="From currency">
              <Select value={fromCurrency} onChange={setFromCurrency} options={CURRENCIES} />
            </Field>
            <div style={{ paddingBottom: '14px', color: 'var(--muted)' }}><Repeat size={18} /></div>
            <Field label="To currency">
              <Select value={toCurrency} onChange={setToCurrency} options={CURRENCIES.filter(c => c !== fromCurrency)} />
            </Field>
          </div>
        )}

        {/* Amount — shared */}
        <Field label={`Amount (${fromCurrency})`} hint={isConnected && usdcBalance ? `Available: $${usdcBalance}` : undefined}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '16px', fontWeight: 700 }}>
              {fromCurrency === 'EURC' ? '€' : '$'}
            </span>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              type="number"
              min="0"
              placeholder="0.00"
              style={{ ...inputStyle, paddingLeft: '32px' }}
            />
            {isConnected && usdcBalance && (
              <button onClick={() => setAmount(usdcBalance)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 700, color: 'var(--mint)', background: 'none', border: 'none', cursor: 'pointer' }}>MAX</button>
            )}
          </div>
        </Field>

        {/* Memo */}
        <Field label="Memo (optional)" hint="Attached as a Transaction Memo on Arc">
          <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="e.g. Invoice #12, rent, supplier payment..." style={inputStyle} />
        </Field>

        {/* Status */}
        {status !== 'idle' && status !== 'loading' && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', borderRadius: '12px', marginBottom: '16px', background: status === 'success' ? 'rgba(180,244,215,0.08)' : 'rgba(255,77,77,0.08)', border: `1px solid ${status === 'success' ? 'rgba(180,244,215,0.2)' : 'rgba(255,77,77,0.2)'}` }}>
            {status === 'success' ? <CheckCircle size={16} color="var(--mint)" style={{ flexShrink: 0, marginTop: '1px' }} /> : <AlertCircle size={16} color="#ff4d4d" style={{ flexShrink: 0, marginTop: '1px' }} />}
            <p style={{ fontSize: '13px', color: status === 'success' ? 'var(--mint)' : '#ff4d4d', lineHeight: 1.5 }}>{resultMsg}</p>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={isProcessing || status === 'loading'} style={{ ...btnStyle, background: '#BFFF00', color: '#0d1520', opacity: isProcessing ? 0.7 : 1 }}>
          {isProcessing || status === 'loading'
            ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
            : <>{action === 'send' ? `Send ${fromCurrency}` : action === 'bridge' ? `Bridge ${fromCurrency}` : `Swap ${fromCurrency} ↔ ${toCurrency}`} <ArrowRight size={16} /></>
          }
        </button>

      </div>

      {/* Powered by */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px', opacity: 0.4 }}>
        {['Circle Wallets', 'CCTP V2', 'StableFX', 'Arc Memos'].map(t => (
          <span key={t} style={{ fontSize: '11px', color: 'var(--subtle)', fontWeight: 600 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>{label}</label>
        {hint && <span style={{ fontSize: '11px', color: 'var(--subtle)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          ...inputStyle,
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          paddingRight: '36px',
          cursor: 'pointer',
          background: '#090e17',
          color: '#ffffff',
          border: '1px solid rgba(180, 244, 215, 0.18)',
        }}
      >
        {options.map(o => (
          <option key={o} value={o} style={{ background: '#0d1520', color: '#ffffff', padding: '10px' }}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8b9ba8', pointerEvents: 'none' }} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: '12px',
  background: '#090e17', border: '1px solid rgba(180,244,215,0.18)',
  color: '#fff', fontSize: '15px', fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 0.2s',
};

const btnStyle: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: '14px',
  fontWeight: 800, fontSize: '15px', cursor: 'pointer',
  border: 'none', display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
};
