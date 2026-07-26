'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRova } from '@/hooks/useRova';
import { useWallet } from '@/hooks/useWallet';
import { Menu, X, Wallet as WalletIcon, Copy, Check, Plus, MessageCircle, ExternalLink } from 'lucide-react';

const META: Record<string, { title: string; sub: string }> = {
  '/':          { title: 'Rova',         sub: 'AI-powered money movement on Arc' },
  '/dashboard': { title: 'Command Hub',  sub: 'Your stablecoin activity on Arc' },
  '/send':      { title: 'Send & Swap',  sub: 'Transfer, bridge, or swap stablecoins' },
  '/agent':     { title: 'Agent',        sub: 'Autonomous agent triggers and watchers' },
  '/history':   { title: 'Ledger',       sub: 'Transaction history with Arc Memos' },
};

export default function Topbar({
  onToggleMobileMenu,
  isMobileOpen,
}: {
  onToggleMobileMenu?: () => void;
  isMobileOpen?: boolean;
}) {
  const pathname = usePathname();
  const meta = META[pathname] ?? META['/dashboard'];
  const [blk, setBlk] = useState(5_821_443);
  const { reputation } = useRova();
  const { isConnected, address, shortAddress, connectInjected, disconnect } = useWallet();
  const [showDrawer, setShowDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddCustodian, setShowAddCustodian] = useState(false);
  const [custodianInput, setCustodianInput] = useState('');
  const [custodianList, setCustodianList] = useState<string[]>([]);

  const defaultAddr = address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
  const displayShort = address ? shortAddress : '0x71C7...976F';

  useEffect(() => {
    const id = setInterval(() => setBlk(b => b + Math.floor(Math.random() * 3 + 1)), 4000);
    return () => clearInterval(id);
  }, []);

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
    <header className="glass-panel relative" style={{
      height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '0 20px', flexShrink: 0,
      borderLeft: 'none', borderRight: 'none', borderTop: 'none',
      background: 'rgba(9, 13, 20, 0.8)', zIndex: 40,
      width: '100%',
    }}>
      {/* Left section: Hamburger toggle (mobile) + Brand/Title */}
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
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{meta.title}</span>
          <span className="hidden md:inline-block" style={{ width: 1, height: 16, background: 'var(--border2)', flexShrink: 0 }} />
          <span className="hidden lg:inline-block" style={{ fontSize: 12, color: 'var(--subtle)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{meta.sub}</span>
        </div>
      </div>

      {/* Right section: WhatsApp Icon + Rep + Phantom Drawer Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Subtle WhatsApp Icon Link */}
        <a
          href="https://wa.me/14155552671?text=Hi%20Rova"
          target="_blank"
          rel="noopener noreferrer"
          title="Open WhatsApp AI Agent"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors flex items-center justify-center"
        >
          <MessageCircle className="w-4 h-4" />
        </a>

        <div className="hidden md:block" style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--subtle)' }}>
          <span style={{ color: 'var(--muted)' }}>REP:</span> <span style={{ color: '#fff' }}>{reputation ?? 0}%</span>
        </div>

        {/* Minimalist Wallet Button */}
        <button
          onClick={() => setShowDrawer(!showDrawer)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center gap-2 transition-colors"
        >
          <WalletIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>{displayShort}</span>
        </button>

        {/* Phantom Wallet-Style Popover Drawer */}
        {showDrawer && (
          <div className="absolute right-5 top-14 w-80 bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-2xl space-y-4 backdrop-blur-xl z-50 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-white">Circle Wallet (Arc)</span>
              </div>
              <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Address & Copy */}
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <div className="font-mono text-xs text-slate-300 truncate max-w-[200px]">
                {defaultAddr}
              </div>
              <button onClick={handleCopy} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Token Balances List (Phantom-Style UI) */}
            <div className="space-y-2">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Balances</div>
              
              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                    $
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">USDC</div>
                    <div className="text-[10px] text-slate-400">Native Arc Gas</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white">1,250.00</div>
                  <div className="text-[10px] text-slate-400">$1,250.00</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                    €
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">EURC</div>
                    <div className="text-[10px] text-slate-400">Arc StableFX</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white">450.00</div>
                  <div className="text-[10px] text-slate-400">$486.00</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                    Y
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">USYC</div>
                    <div className="text-[10px] text-slate-400">Treasury Yield</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-400">500.00</div>
                  <div className="text-[10px] text-slate-400">5.1% APY</div>
                </div>
              </div>
            </div>

            {/* Custodian Wallets Section */}
            {custodianList.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-medium text-slate-400">Custodian Wallets</div>
                {custodianList.map((cust, idx) => (
                  <div key={idx} className="text-xs font-mono text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800/80 truncate">
                    {cust}
                  </div>
                ))}
              </div>
            )}

            {/* Add Custodian Modal / Form */}
            {!showAddCustodian ? (
              <button
                onClick={() => setShowAddCustodian(true)}
                className="w-full py-2 px-3 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custodian Wallet</span>
              </button>
            ) : (
              <form onSubmit={handleAddCustodian} className="space-y-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="0x... External Wallet Address"
                  value={custodianInput}
                  onChange={(e) => setCustodianInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 rounded bg-blue-600 text-white text-xs font-medium"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCustodian(false)}
                    className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {isConnected && (
              <button
                onClick={() => { disconnect(); setShowDrawer(false); }}
                className="w-full py-2 text-center text-xs text-rose-400 hover:text-rose-300 transition-colors pt-2 border-t border-slate-800"
              >
                Disconnect Session
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

