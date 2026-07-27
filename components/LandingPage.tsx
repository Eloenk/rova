'use client';
import Link from 'next/link';
import { ArrowRight, Send, Repeat, Wallet, MessageSquare, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1520',
      color: '#ffffff',
      fontFamily: 'Inter, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top Header Navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 48px',
        borderBottom: '1px solid rgba(180, 244, 215, 0.12)',
        background: 'rgba(13, 21, 32, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, #BFFF00 0%, #25D366 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(37, 211, 102, 0.2)',
          }}>
            <Send size={19} color="#0d1520" strokeWidth={3} />
          </div>
          <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>ROVA</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/login" style={{
            padding: '10px 24px',
            borderRadius: '10px',
            background: '#BFFF00',
            color: '#0d1520',
            fontSize: '14px',
            fontWeight: 800,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '70px 24px 40px',
        maxWidth: '960px',
        margin: '0 auto',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '30px',
          background: 'rgba(191, 255, 0, 0.08)',
          border: '1px solid rgba(191, 255, 0, 0.25)',
          color: '#BFFF00',
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: '20px',
        }}>
          <Zap size={14} /> Autonomous Stablecoin Execution Engine
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: '56px',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: '20px',
          letterSpacing: '-0.03em',
          color: '#ffffff',
          maxWidth: '860px',
        }}>
          Cross-border stablecoin transfers — <br />
          <span style={{
            background: 'linear-gradient(90deg, #25D366 0%, #BFFF00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            no human watching, no bad deals.
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '17px',
          lineHeight: 1.6,
          color: '#8b9ba8',
          marginBottom: '32px',
          maxWidth: '680px',
        }}>
          Move money via Web & WhatsApp natural language. Rova shops rates across 3 quote sources using Circle x402 Nanopayments before executing every send.
        </p>

        {/* CTA Button */}
        <div style={{ marginBottom: '44px' }}>
          <Link href="/login" style={{
            padding: '15px 40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #BFFF00 0%, #25D366 100%)',
            color: '#0d1520',
            fontSize: '15px',
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 6px 20px rgba(37, 211, 102, 0.2)',
          }}>
            Get Started <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* 4 Compact Cards (2x2 Grid) */}
      <div style={{ padding: '0 24px 80px', maxWidth: '860px', margin: '0 auto' }}>
        <div className="landing-grid">
          {[
            {
              icon: <MessageSquare size={22} style={{ color: '#25D366' }} />,
              title: 'WhatsApp Conversational Agent',
              desc: 'Execute transfers, set FX rate triggers, and check balances via natural language chat on WhatsApp with no app download required.',
            },
            {
              icon: <Wallet size={22} style={{ color: '#BFFF00' }} />,
              title: 'Circle Infrastructure & Wallets',
              desc: 'Powered by Circle Developer-Controlled Wallets (HSM-secured) for instant email onboarding, plus optional Web3 self-custody linking.',
            },
            {
              icon: <Zap size={22} style={{ color: '#25D366' }} />,
              title: 'x402 Nanopayment Rate Shopping',
              desc: 'Rova pays 3 competing quote providers $0.0005 via Circle Gateway x402 nanopayments to guarantee the best exchange rate before sending.',
            },
            {
              icon: <Repeat size={22} style={{ color: '#BFFF00' }} />,
              title: '24/7 Autopilot Rules Engine',
              desc: 'Arm rules once by rate threshold, date, or incoming payment. Rova continuously monitors triggers and fires automatically on Arc Testnet.',
            },
          ].map(({ icon, title, desc }, i) => (
            <div key={i} style={{
              padding: '24px 20px',
              borderRadius: '14px',
              background: 'rgba(13, 21, 32, 0.75)',
              border: '1px solid rgba(180, 244, 215, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxSizing: 'border-box',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(191, 255, 0, 0.08)',
                border: '1px solid rgba(191, 255, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>{title}</h3>
              <p style={{ color: '#8b9ba8', fontSize: '13.5px', lineHeight: 1.55, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Technology Badges Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '28px',
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(180, 244, 215, 0.1)',
        }}>
          {[
            'Circle Wallets',
            'Circle CCTP V2',
            'StableFX Engine',
            'x402 Nanopayments',
            'WhatsApp Agent',
            'Arc Testnet'
          ].map(t => (
            <span key={t} style={{ fontSize: '12.5px', color: '#8b9ba8', fontWeight: 600, letterSpacing: '0.04em' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
