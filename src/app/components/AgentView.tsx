import { useRova } from '../hooks/useRova';
import { AGENT_METADATA, ERC8004, ARC_TESTNET } from '../lib/config';
import { useState, useEffect } from 'react';
import { Bot, Shield, Cpu } from 'lucide-react';

export default function AgentIdentity() {
  const { agentId, reputation, isValidated } = useRova();
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  if (!hasMounted) return null;

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-up">
      
      {/* Header */}
      <header style={{ marginBottom: '48px' }}>
        <span className="mono-tag" style={{ color: 'var(--blue)', marginBottom: '8px', display: 'block' }}>Registry Standard: ERC-8004</span>
        <h1 style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }} className="text-gradient">
          Agent Identity Hub
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '16px', maxWidth: '700px' }}>
          Real-time transparent verification of node credentials, reputation scores, and autonomous compliance logs.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }}>
        
        {/* Identity Passport */}
        <div className="glass-panel" style={{ padding: '48px', borderRadius: '48px', border: '1px solid var(--border2)', position: 'relative', overflow: 'hidden' }}>
          
          {/* Background Highlight */}
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(180, 244, 215, 0.1) 0%, transparent 70%)', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '48px' }}>
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '32px', 
                background: 'linear-gradient(135deg, var(--mint), var(--lime))', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 0 40px rgba(180, 244, 215, 0.3)' 
              }} className="animate-glow">
                <Bot size={56} color="#0d1520" strokeWidth={2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{AGENT_METADATA.name}</h2>
                  {isValidated && (
                    <div style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(180,244,215,0.1)', border: '1px solid var(--mint)', color: 'var(--mint)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em' }}>VERIFIED</div>
                  )}
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>{AGENT_METADATA.description}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Badge text={`v${AGENT_METADATA.version}`} />
                  <Badge text={AGENT_METADATA.network} />
                </div>
              </div>
            </div>

            {/* Credential Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid var(--border)' }}>
              <CredentialItem label="Agent ID Token" value={`#${agentId?.slice(-6) || '8183-001'}`} />
              <CredentialItem label="Onchain Reputation" value={`${reputation}/100`} color="var(--mint)" />
              <CredentialItem label="Operational Status" value="Active Compliance" />
              <CredentialItem label="Node Hierarchy" value="Sentinel V2" />
            </div>
            
            <div style={{ marginTop: '32px' }}>
              <p className="mono-tag" style={{ color: 'var(--subtle)', marginBottom: '16px' }}>Active Skill Modules</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {AGENT_METADATA.capabilities.map(cap => (
                  <div key={cap} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'capitalize' }}>
                    {cap.split('_').join(' ')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System Specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Registry Module */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '32px' }}>
            <h4 className="mono-tag" style={{ color: 'var(--muted)', marginBottom: '24px' }}>Blockchain Infrastructure</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <RegistryLink label="Identity Registry" address={ERC8004.IdentityRegistry} />
              <RegistryLink label="Reputation Registry" address={ERC8004.ReputationRegistry} />
              <RegistryLink label="Network RPC" address={ARC_TESTNET.rpc} />
            </div>
          </div>

          {/* Node Performance */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '32px', background: 'rgba(180, 244, 215, 0.03)' }}>
             <h4 className="mono-tag" style={{ color: 'var(--muted)', marginBottom: '24px' }}>Node Diagnostic</h4>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Metric label="Validation Latency" value="240ms" />
                <Metric label="Uptime Signature" value="99.98%" />
                <Metric label="Proof of Stake" value="25,000 USDC" />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function CredentialItem({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <p className="mono-tag" style={{ fontSize: '9px', color: 'var(--subtle)', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '15px', fontWeight: 800, color: color || '#fff', fontFamily: 'var(--font-mono)' }}>{value}</p>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>
      {text.toUpperCase()}
    </span>
  );
}

function RegistryLink({ label, address }: { label: string; address: string }) {
  return (
    <div>
      <p className="mono-tag" style={{ fontSize: '9px', color: 'var(--subtle)', marginBottom: '6px' }}>{label}</p>
      <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: '14px', border: '1px solid var(--border)', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--muted)', wordBreak: 'break-all' }}>
        {address}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );
}
