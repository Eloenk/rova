'use client';
import { AlertTriangle, Hammer, ShieldAlert } from 'lucide-react';

export default function MaintenanceOverlay({ isError = false }: { isError?: boolean }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: '#04070a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px',
      overflow: 'hidden'
    }}>
      {/* Emergency Light Background Pulse */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: isError ? 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(13, 148, 136, 0.1) 0%, transparent 70%)',
        animation: 'emergency-pulse 3s infinite ease-in-out',
        pointerEvents: 'none'
      }} />

      {/* Content Container */}
      <div className="glass-panel" style={{
        maxWidth: '540px',
        padding: '60px 40px',
        borderRadius: '32px',
        border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(13, 148, 136, 0.2)'}`,
        background: 'rgba(13, 20, 36, 0.6)',
        backdropFilter: 'blur(12px)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(13, 148, 136, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
          border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(13, 148, 136, 0.3)'}`,
          boxShadow: `0 0 20px ${isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(13, 148, 136, 0.2)'}`
        }}>
          {isError ? <ShieldAlert size={40} color="#ef4444" /> : <Hammer size={40} color="var(--mint)" />}
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          {isError ? 'System Anomaly Detected' : 'Scheduled Optimization'}
        </h1>
        
        <p style={{ color: 'var(--muted)', fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' }}>
          {isError 
            ? "An unexpected logic error occurred. To protect your assets, we've enabled emergency maintenance. Our automated agents are already investigating."
            : "Sorry, we're conducting maintenance for a better user experience. We are currently upgrading the capital flow engine. We will be back shortly."}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px 20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isError ? '#ef4444' : 'var(--mint)', animation: 'pulse 1s infinite' }} />
          <span className="mono-tag" style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
            {isError ? 'EMERGENCY PROTOCOL ACTIVE' : 'NETWORK UPGRADE IN PROGRESS'}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes emergency-pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
