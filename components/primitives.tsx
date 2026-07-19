import { type ReactNode, type CSSProperties } from 'react';

export function Card({ children, className = '', style, p = '18px' }: { children: ReactNode; className?: string; style?: CSSProperties; p?: string }) {
  return (
    <div className={className} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:p, ...style }}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--subtle)', marginBottom:10 }}>{children}</p>;
}

export function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'teal'|'green' }) {
  const color = accent === 'teal' ? 'var(--teal)' : accent === 'green' ? '#10b981' : 'var(--text)';
  return (
    <Card>
      <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--subtle)', marginBottom:8 }}>{label}</p>
      <p style={{ fontSize:24, fontWeight:800, color, fontFamily:'var(--font-display)', marginBottom:4 }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:'var(--subtle)' }}>{sub}</p>}
    </Card>
  );
}

export function RiskBadge({ risk }: { risk: 'low'|'medium'|'high' }) {
  const s = { low:{ bg:'rgba(16,185,129,0.1)', c:'#10b981' }, medium:{ bg:'rgba(245,158,11,0.1)', c:'#f59e0b' }, high:{ bg:'rgba(239,68,68,0.1)', c:'#ef4444' } }[risk];
  return <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:5, fontSize:11, fontWeight:600, background:s.bg, color:s.c }}>{risk.charAt(0).toUpperCase()+risk.slice(1)} Risk</span>;
}

export function StatusPill({ status }: { status: 'executed'|'planned'|'failed' }) {
  const s = { executed:{ bg:'rgba(16,185,129,0.1)', c:'#10b981' }, planned:{ bg:'rgba(59,130,246,0.1)', c:'#60a5fa' }, failed:{ bg:'rgba(239,68,68,0.1)', c:'#ef4444' } }[status];
  return <span style={{ display:'inline-block', padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:600, background:s.bg, color:s.c }}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>;
}

export function Spinner({ size = 20, color = 'var(--teal)' }: { size?: number; color?: string }) {
  return <span className="animate-spin" style={{ display:'inline-block', width:size, height:size, border:`2px solid rgba(0,212,170,0.15)`, borderTopColor:color, borderRadius:'50%', flexShrink:0 }} />;
}
