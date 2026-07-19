import { Link, useLocation } from 'react-router';
import { useWallet } from '../hooks/useWallet';
import { Terminal, User, Wrench, BookOpen, Layers } from 'lucide-react';

const RovaIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="var(--mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="var(--mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface NavLinkProps {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NavLink = ({ to, label, icon }: NavLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className="cyber-button" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '12px',
      textDecoration: 'none',
      color: isActive ? 'var(--mint)' : 'var(--muted)',
      background: isActive ? 'rgba(180, 244, 215, 0.08)' : 'transparent',
      border: isActive ? '1px solid rgba(180, 244, 215, 0.15)' : '1px solid transparent',
      fontWeight: 600,
      fontSize: '14px',
      transition: 'all 0.2s'
    }}>
      {icon}
      {label}
    </Link>
  );
};

export default function Sidebar() {
  const { isConnected, shortAddress, usdcBalance, connectInjected, isConnecting, disconnect } = useWallet();

  return (
    <aside style={{ 
      width: '260px', 
      height: '100%', 
      borderRight: '1px solid var(--border)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      background: 'var(--sidebar)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
        <RovaIcon />
        <span className="font-display" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
          ROVA <span style={{ color: 'var(--mint)', fontSize: '12px', verticalAlign: 'top' }}>V2</span>
        </span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <NavLink to="/dashboard" label="Command Hub" icon={<Terminal size={18} strokeWidth={2.5} />} />
        <NavLink to="/agent" label="Agent Profile" icon={<User size={18} strokeWidth={2.5} />} />
        <NavLink to="/builder" label="Architect" icon={<Wrench size={18} strokeWidth={2.5} />} />
        <NavLink to="/history" label="Ledger" icon={<BookOpen size={18} strokeWidth={2.5} />} />
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Wallet Connection */}
        {!isConnected ? (
          <button 
            onClick={() => connectInjected()} 
            disabled={isConnecting}
            className="cyber-button" 
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '12px', 
              background: 'var(--lime)', 
              color: '#000', 
              fontWeight: 800, 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
          </button>
        ) : (
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px', cursor: 'pointer' }} onClick={() => disconnect()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="mono-tag" style={{ color: 'var(--mint)' }}>Connected</span>
              <span style={{ fontSize: '10px', color: 'var(--subtle)' }}>{shortAddress}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
               <span style={{ fontSize: '11px', color: 'var(--subtle)' }}>Balance</span>
               <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>${usdcBalance ?? '0.00'}</span>
            </div>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px' }}>
          <p className="mono-tag" style={{ color: 'var(--mint)', marginBottom: '8px' }}>Node Healthy</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '11px', color: 'var(--subtle)' }}>Latency</span>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>14ms</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
