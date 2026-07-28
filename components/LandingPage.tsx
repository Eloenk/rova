'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Send, Repeat, Wallet, MessageSquare, Zap } from 'lucide-react';

export default function LandingPage() {
  const [hasSession, setHasSession] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('rova_user_email') || document.cookie.includes('rova_user_email=');
      setHasSession(!!email);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1520',
      color: '#ffffff',
      fontFamily: 'Inter, -apple-system, sans-serif',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* Top Header Navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 48px',
        flexShrink: 0,
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
          <Link href={hasSession ? "/dashboard" : "/login"} style={{
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
            {hasSession ? "Go to Dashboard" : "Get Started"} <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* Hero Section (Shifted Downwards Together for Desktop Balance) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 'clamp(50px, 8.5vh, 105px)',
        textAlign: 'center',
        paddingLeft: '24px',
        paddingRight: '24px',
        maxWidth: '920px',
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(34px, 5.4vw, 58px)',
          fontWeight: 800,
          lineHeight: 1.12,
          marginBottom: '18px',
          letterSpacing: '-0.03em',
          color: '#ffffff',
          maxWidth: '860px',
        }}>
          Move money anywhere <br />
          <span style={{
            background: 'linear-gradient(90deg, #25D366 0%, #BFFF00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Just by asking.
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(14px, 2.1vw, 17px)',
          lineHeight: 1.6,
          color: '#8b9ba8',
          marginBottom: '32px',
          maxWidth: '680px',
        }}>
          Tell Rova what you want from the web or WhatsApp. It discovers the best execution path and handles every swap, bridge, and transfer autonomously.
        </p>

        {/* CTA Button */}
        <div style={{ marginBottom: '48px' }}>
          <Link href={hasSession ? "/dashboard" : "/login"} style={{
            padding: '15px 42px',
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
            {hasSession ? "Go to Dashboard" : "Get Started"} <ArrowRight size={18} />
          </Link>
        </div>

        {/* Feature Cards Grid (Integrated within Hero Flow with Subtle Card Containers) */}
        <div className="landing-grid" style={{ width: '100%', marginBottom: '40px' }}>
          {[
            {
              icon: <MessageSquare size={18} style={{ color: '#25D366' }} />,
              title: 'Natural Language',
              desc: 'Tell Rova what you want from WhatsApp or the web. It understands your intent and handles the rest.',
            },
            {
              icon: <Zap size={18} style={{ color: '#25D366' }} />,
              title: 'Best Execution',
              desc: 'Compares routes across multiple providers to find the optimal swap, bridge, or transfer every time.',
            },
            {
              icon: <Repeat size={18} style={{ color: '#BFFF00' }} />,
              title: 'Autonomous Rules',
              desc: 'Create rules that execute automatically when your conditions are met, even when you\'re offline.',
            },
            {
              icon: <Wallet size={18} style={{ color: '#BFFF00' }} />,
              title: 'Built on Circle',
              desc: 'Powered by Circle Wallets, CCTP V2, and x402 for secure, cross-chain execution.',
            },
          ].map(({ icon, title, desc }, i) => (
            <div key={i} className="landing-feature-card" style={{
              padding: '18px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.015)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              textAlign: 'left',
              boxSizing: 'border-box',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(191, 255, 0, 0.08)',
                  border: '1px solid rgba(191, 255, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {icon}
                </div>
                <h3 className="landing-card-title" style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: 1.25 }}>{title}</h3>
              </div>
              <p className="landing-card-desc" style={{ color: '#8b9ba8', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Simplified Footer Ticker */}
      <div style={{
        padding: '0 24px 24px',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '12.5px', color: '#8b9ba8', fontWeight: 500, letterSpacing: '0.04em' }}>
          Powered by Circle Wallets • CCTP V2 • StableFX • x402
        </span>
      </div>
    </div>
  );
}
