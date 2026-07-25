'use client';
import Link from 'next/link';
import { ArrowRight, Send, Repeat, Globe, Wallet } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1520 0%, #1a3a42 50%, #0d1520 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow orbs */}
      <div style={{ position: 'absolute', top: '10%', right: '5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(191, 255, 0, 0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(180, 244, 215, 0.06) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 64px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #BFFF00, #B4F4D7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={20} color="#0d1520" strokeWidth={3} />
          </div>
          <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>ROVA</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ padding: '10px 24px', borderRadius: '12px', border: '1.5px solid rgba(180, 244, 215, 0.3)', background: 'rgba(180, 244, 215, 0.05)', color: '#B4F4D7', fontSize: '14px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Open App <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '100px 64px 80px', position: 'relative', zIndex: 1 }}>

        <h1 style={{ fontSize: '80px', fontWeight: 800, lineHeight: 1.05, marginBottom: '28px', letterSpacing: '-0.04em', color: '#fff', maxWidth: '900px' }}>
          Move money with<br /><span className="text-gradient">plain English.</span>
        </h1>

        <p style={{ fontSize: '20px', lineHeight: 1.6, color: '#8b9ba8', marginBottom: '48px', maxWidth: '580px' }}>
          Tell Rova what you want to do. It figures out the rest (send, bridge, swap) using your Web3 wallet or automated Circle Programmable Wallet.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '80px' }}>
          <Link href="/dashboard" style={{ padding: '18px 48px', borderRadius: '16px', background: '#BFFF00', color: '#0d1520', fontSize: '16px', fontWeight: 800, textDecoration: 'none' }}>
            Get Started
          </Link>
          <a href="https://docs.arc.io" target="_blank" rel="noopener noreferrer" style={{ padding: '18px 32px', borderRadius: '16px', background: 'transparent', border: '1.5px solid rgba(180, 244, 215, 0.3)', color: '#fff', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}>
            Read the Docs
          </a>
        </div>

        {/* Intent demo card */}
        <div className="glass-panel" style={{ maxWidth: '620px', width: '100%', borderRadius: '24px', padding: '32px', textAlign: 'left' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#B4F4D7', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>Try saying something like...</p>
          {[
            'Send $50 USDC to 0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            'Bridge 200 USDC from Ethereum to Arc',
            'Swap my USDC to EURC',
          ].map((example, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: i < 2 ? '8px' : 0 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(191,255,0,0.5)', flexShrink: 0 }} />
              <span style={{ fontSize: '15px', color: '#fff', fontStyle: 'italic' }}>"{example}"</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '40px 64px 120px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { icon: <Wallet size={28} />, title: 'Circle & Web3 Wallets', desc: 'Automate flows with Circle Developer-Controlled Wallets, or connect your Web3 wallet for self-custody. Rova supports both modes.' },
            { icon: <Globe size={28} />, title: 'Africa-first, global-ready', desc: 'Built for the reality of cross-border payments in Africa. Anyone, anywhere can send USDC in seconds.' },
            { icon: <Repeat size={28} />, title: 'Powered by Arc & Circle', desc: 'Sub-second settlement, CCTP V2 bridging, StableFX, and real-time data all in one place.' },
          ].map(({ icon, title, desc }, i) => (
            <div key={i} className="glass-panel" style={{ padding: '36px', borderRadius: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(191,255,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#BFFF00' }}>
                {icon}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', color: '#fff' }}>{title}</h3>
              <p style={{ color: '#8b9ba8', fontSize: '14px', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Built on */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '80px', opacity: 0.4 }}>
          {['Circle Wallets', 'StableFX', 'CCTP V2', 'Goldsky', 'Claude AI'].map(t => (
            <span key={t} style={{ fontSize: '13px', color: '#8b9ba8', fontWeight: 600, letterSpacing: '0.05em' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
