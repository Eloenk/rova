'use client';
import Link from 'next/link';
import { ArrowRight, Send, Repeat, Globe, Wallet, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_LINK || 'https://wa.me/?text=help';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1520 0%, #1a3a42 50%, #0d1520 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow orbs */}
      <div style={{ position: 'absolute', top: '10%', right: '5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(191, 255, 0, 0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(37, 211, 102, 0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 64px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #BFFF00, #25D366)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '80px 64px 60px', position: 'relative', zIndex: 1 }}>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '30px', background: 'rgba(191, 255, 0, 0.08)', border: '1px solid rgba(191, 255, 0, 0.25)', color: '#BFFF00', fontSize: '13px', fontWeight: 700, marginBottom: '24px' }}>
          <Zap size={14} /> Autonomous Stablecoin Execution Engine
        </div>

        <h1 style={{ fontSize: '72px', fontWeight: 800, lineHeight: 1.05, marginBottom: '24px', letterSpacing: '-0.04em', color: '#fff', maxWidth: '900px' }}>
          Move money via web & <br /><span style={{ background: 'linear-gradient(90deg, #25D366 0%, #BFFF00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WhatsApp natural language.</span>
        </h1>

        <p style={{ fontSize: '20px', lineHeight: 1.6, color: '#8b9ba8', marginBottom: '40px', maxWidth: '620px' }}>
          Tell Rova what you want in simple terms. It handles transfers, atomic StableFX swaps, CCTP V2 bridging, and 24/7 rate watching via Web app or WhatsApp.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '60px' }}>
          <Link href="/dashboard" style={{ padding: '18px 44px', borderRadius: '16px', background: 'linear-gradient(135deg, #BFFF00 0%, #25D366 100%)', color: '#0d1520', fontSize: '16px', fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 30px rgba(37, 211, 102, 0.25)' }}>
            Get Started
          </Link>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '18px 36px', borderRadius: '16px', background: '#25D366', color: '#ffffff', fontSize: '16px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 30px rgba(37, 211, 102, 0.3)' }}>
            <MessageSquare size={20} fill="#ffffff" color="#25D366" /> Open in WhatsApp
          </a>
        </div>

        {/* Dynamic Dual Demo Card: Web & WhatsApp */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '960px', width: '100%' }}>
          
          {/* Web Intent Card */}
          <div className="glass-panel" style={{ borderRadius: '24px', padding: '28px', textAlign: 'left', background: 'rgba(13, 21, 32, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#BFFF00' }} />
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#BFFF00', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Web App Natural Prompts</p>
            </div>
            {[
              'Send $50 USDC to 0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
              'Bridge 200 USDC from Ethereum to Arc',
              'Swap my USDC to EURC when rate >= 0.94',
            ].map((example, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: i < 2 ? '8px' : 0 }}>
                <span style={{ fontSize: '14px', color: '#fff', fontStyle: 'italic' }}>"{example}"</span>
              </div>
            ))}
          </div>

          {/* WhatsApp Agent Card */}
          <div className="glass-panel" style={{ borderRadius: '24px', padding: '28px', textAlign: 'left', background: 'rgba(13, 21, 32, 0.6)', border: '1px solid rgba(37, 211, 102, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={18} color="#25D366" />
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#25D366', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>WhatsApp AI Bot (`whatsmeow`)</p>
              </div>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#25D366', background: 'rgba(37, 211, 102, 0.15)', padding: '4px 10px', borderRadius: '10px', fontWeight: 700, textDecoration: 'none' }}>
                Chat Now ↗
              </a>
            </div>
            {[
              { in: 'send 50 USDC to 0x71C...', out: '✅ Sent via Circle Wallet on Arc! ArcScan: https://...' },
              { in: 'status', out: '📊 Active Watchers: 1 armed (USDC/EURC >= 0.94)' },
              { in: 'balance', out: '💳 Circle Wallet: 0x71C... · Arc Testnet' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(37, 211, 102, 0.05)', marginBottom: i < 2 ? '8px' : 0, borderLeft: '3px solid #25D366' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>💬 "{item.in}"</div>
                <div style={{ fontSize: '12px', color: '#8b9ba8', marginTop: '2px' }}>{item.out}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Features Grid */}
      <div style={{ padding: '20px 64px 100px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { icon: <MessageSquare size={26} />, title: 'Standalone WhatsApp Bot', desc: 'Built on high-performance whatsmeow Go daemon. Chat directly on WhatsApp to execute transactions and receive 24/7 rate alerts.' },
            { icon: <Wallet size={26} />, title: 'Circle & Web3 Wallets', desc: 'Automate flows with Circle Developer-Controlled Wallets, or connect your Web3 wallet for self-custody.' },
            { icon: <ShieldCheck size={26} />, title: 'Goroutine Nanopayments', desc: 'Queries multiple quote providers concurrently via x402 micro-transactions before picking the best rate.' },
            { icon: <Globe size={26} />, title: 'Africa-First & Global', desc: 'Built for instant cross-border remittances. Anyone, anywhere can send stablecoins in sub-second time.' },
            { icon: <Repeat size={26} />, title: 'Arc & StableFX Native', desc: 'Atomic FX swaps and Circle CCTP V2 cross-chain bridging with full on-chain execution logs.' },
            { icon: <Zap size={26} />, title: 'Autonomous Watchers', desc: 'Set rate triggers once. Rova continuously monitors Arc rates and executes transfers automatically.' },
          ].map(({ icon, title, desc }, i) => (
            <div key={i} className="glass-panel" style={{ padding: '32px', borderRadius: '20px', transition: 'all 0.3s ease' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(191,255,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', color: i === 0 ? '#25D366' : '#BFFF00' }}>
                {icon}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', color: '#fff' }}>{title}</h3>
              <p style={{ color: '#8b9ba8', fontSize: '14px', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Ecosystem Logos */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '70px', opacity: 0.5 }}>
          {['Circle Wallets', 'whatsmeow Go', 'StableFX', 'CCTP V2', 'Gemini 2.0 / Claude', 'Arc Testnet'].map(t => (
            <span key={t} style={{ fontSize: '13px', color: '#8b9ba8', fontWeight: 600, letterSpacing: '0.05em' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
