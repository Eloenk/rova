import { useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { useRova } from '../hooks/useRova';
import { useWallet } from '../hooks/useWallet';
import { Shield } from 'lucide-react';

const META: Record<string, { title: string; sub: string }> = {
  '/':          { title:'Dashboard',      sub:'Overview of your Arc capital flows' },
  '/dashboard': { title:'Dashboard',      sub:'Overview of your Arc capital flows' },
  '/builder':   { title:'Flow Builder',   sub:'Describe any intent — the AI builds and executes the plan' },
  '/history':   { title:'History',        sub:'Full log of every executed flow' },
  '/agent':     { title:'Agent Identity', sub:'ERC-8004 onchain identity and Arc contracts' },
};

export default function Topbar() {
  const location  = useLocation();
  const meta  = META[location.pathname] ?? META['/dashboard'];
  const [blk, setBlk] = useState(5_821_443);
  const { reputation, isValidated } = useRova();
  const { isConnected, shortAddress, connectInjected, isConnecting, disconnect } = useWallet();

  useEffect(() => {
    const id = setInterval(() => setBlk(b => b + Math.floor(Math.random() * 3 + 1)), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="glass-panel" style={{ height:56, display:'flex', alignItems:'center', gap:12, padding:'0 24px', flexShrink:0, borderLeft:'none', borderRight:'none', borderTop:'none', background: 'rgba(13, 20, 36, 0.4)', zIndex: 10 }}>
      <span style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{meta.title}</span>
      <span style={{ width:1, height:16, background:'var(--border2)', flexShrink:0 }}/>
      <span style={{ fontSize:12, color:'var(--subtle)' }}>{meta.sub}</span>
      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
        <div className="glass-panel" style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:600, color:'#fff', boxShadow: '0 0 10px rgba(0,0,0,0.2)' }}>
          <span className="animate-pulse-glow" style={{ width:6, height:6, borderRadius:'50%', background:'var(--mint)', display:'inline-block' }}/>
          Arc Testnet
        </div>
        {isValidated && (
          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, background:'rgba(180,244,215,0.1)', border:'1px solid rgba(180,244,215,0.2)', fontSize:10, fontWeight:700, color:'var(--mint)' }}>
            <Shield size={12} />
            NODE VERIFIED
          </div>
        )}
        <div style={{ padding:'4px 10px', borderRadius:6, background:'var(--surface2)', border:'1px solid var(--border)', fontSize:11, fontFamily:'var(--font-mono)', color:'var(--subtle)' }}>
          <span style={{ color:'var(--muted)' }}>REP:</span> <span style={{ color:'#fff' }}>{reputation}%</span>
        </div>
        <div style={{ padding:'4px 10px', borderRadius:6, background:'var(--surface2)', border:'1px solid var(--border)', fontSize:11, fontFamily:'var(--font-mono)', color:'var(--subtle)', marginRight: '12px' }}>
          #{blk.toLocaleString()}
        </div>

        {/* Global Connect Wallet Button */}
        {!isConnected ? (
          <button 
            onClick={() => connectInjected()}
            disabled={isConnecting}
            className="cyber-button"
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              background: 'var(--lime)',
              color: '#000',
              fontWeight: 800,
              fontSize: '11px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
          </button>
        ) : (
          <button 
            onClick={() => disconnect()}
            className="cyber-button"
            style={{ 
              padding: '6px 12px', 
              borderRadius: '8px', 
              fontSize: '11px', 
              fontWeight: 700, 
              color: 'var(--mint)', 
              background: 'rgba(180, 244, 215, 0.08)', 
              border: '1px solid rgba(180, 244, 215, 0.2)',
              cursor: 'pointer'
            }}
          >
            {shortAddress}
          </button>
        )}
      </div>
    </header>
  );
}
