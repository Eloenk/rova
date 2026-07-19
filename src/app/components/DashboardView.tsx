import { useFlowHistory } from '../hooks/flowHistory';
import { useRova } from '../hooks/useRova';
import { useEffect, useState } from 'react';
import { Gem, Zap, Shield, Satellite, Moon, Clock } from 'lucide-react';

export default function Dashboard() {
  const { entries, totalExecuted, totalVolumeUsdc } = useFlowHistory();
  const { agentId, reputation, syncAgentStatus } = useRova();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    syncAgentStatus();
  }, [syncAgentStatus]);

  if (!hasMounted) return null;

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }} className="animate-fade-up">
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <span className="mono-tag" style={{ color: 'var(--mint)', marginBottom: '8px', display: 'block' }}>System Status: Operational</span>
          <h1 style={{ fontSize: '42px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', lineHeight: 1 }} className="text-gradient">
            Command Center
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Agent ID: {agentId || '...'}</p>
          <p style={{ color: 'var(--subtle)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>LAST SYNC: {new Date().toLocaleTimeString()}</p>
        </div>
      </header>

      {/* Hero Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
        <StatTile label="Managed Capital" value={`$${totalVolumeUsdc().toLocaleString()}`} sub="Active USDC Flows" icon={<Gem size={28} />} />
        <StatTile label="Settled Flows" value={totalExecuted()} sub="Onchain Success Rate" icon={<Zap size={28} />} />
        <StatTile label="Arc Trust Score" value={`${reputation ?? 0}%`} sub="ERC-8004 Rating" icon={<Shield size={28} />} color="var(--mint)" />
        <StatTile label="Node Latency" value="14ms" sub="Global Arc Mesh" icon={<Satellite size={28} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        
        {/* Main Feed */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>Autonomous Activity</h3>
            <span className="mono-tag" style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--muted)' }}>LIVE FEED</span>
          </div>

          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--subtle)' }}>
              <div style={{ marginBottom: '16px' }}><Moon size={32} color="var(--subtle)" /></div>
              <p>No transactions detected in the current epoch.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Initiate a flow via the Architect to see activity.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {entries.slice(0, 6).map(e => (
                <div key={e.id} className="cyber-button" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px 20px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '12px', background: e.status === 'executed' ? 'rgba(180,244,215,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {e.status === 'executed' ? <Zap size={20} color="var(--mint)" /> : <Clock size={20} color="var(--muted)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{e.intent.slice(0, 50)}...</p>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--mint)' }}>+${e.totalAmount}</span>
                    </div>
                    <p className="mono-tag" style={{ fontSize: '9px', color: 'var(--muted)' }}>
                      TX: {e.id.slice(0, 24)}... • ARC-L1
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Reputation Gauge */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '32px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(180, 244, 215, 0.05) 0%, transparent 100%)' }}>
            <h4 className="mono-tag" style={{ marginBottom: '24px', color: 'var(--muted)' }}>Agent Reputation</h4>
            <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 24px' }}>
              <svg width="160" height="160" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--mint)" strokeWidth="8" 
                  strokeDasharray={`${(reputation ?? 75) * 2.83} 283`} strokeLinecap="round" transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dasharray 1s ease-out' }} 
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{reputation ?? '...' }</span>
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>%</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.4' }}>
              Verified by ERC-8004 Reputation Registry.<br/>
              Status: <span style={{ color: 'var(--mint)', fontWeight: 700 }}>HIGH TRUST</span>
            </p>
          </div>

          {/* Network Map */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
            <h4 className="mono-tag" style={{ marginBottom: '16px', color: 'var(--muted)' }}>Arc Testnet Nodes</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <NetworkNode city="New York" latency="12ms" status="Optimal" />
              <NetworkNode city="Tokyo" latency="48ms" status="Optimal" />
              <NetworkNode city="Dublin" latency="22ms" status="Optimal" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, sub, icon, color }: { label: string; value: string | number; sub: string; icon: React.ReactNode; color?: string }) {
  return (
    <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px', transition: 'transform 0.2s', border: '1px solid var(--border)' }}>
      <div style={{ marginBottom: '16px', color: color || 'var(--mint)' }}>{icon}</div>
      <p className="mono-tag" style={{ color: 'var(--muted)', marginBottom: '8px' }}>{label}</p>
      <h2 style={{ fontSize: '28px', fontWeight: 800, color: color || '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>{value}</h2>
      <p style={{ fontSize: '12px', color: 'var(--subtle)', fontWeight: 500 }}>{sub}</p>
    </div>
  );
}

function NetworkNode({ city, latency, status }: { city: string; latency: string; status: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint)' }} />
        <span style={{ fontSize: '13px', fontWeight: 600 }}>{city}</span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{latency}</div>
        <div style={{ fontSize: '9px', color: 'var(--mint)', fontWeight: 700, textTransform: 'uppercase' }}>{status}</div>
      </div>
    </div>
  );
}
