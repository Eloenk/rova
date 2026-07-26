'use client';
import Link from 'next/link';
import { ArrowRight, Send, Repeat, Globe, Wallet, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#090d14',
      color: '#f8fafc',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Clean Header Nav */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 64px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        background: 'rgba(9, 13, 20, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Send size={18} color="#ffffff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>ROVA</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/login" style={{
            padding: '10px 22px',
            borderRadius: '10px',
            background: '#2563eb',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.2s ease',
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
        padding: '90px 24px 60px',
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '20px',
          background: 'rgba(37, 99, 235, 0.1)',
          border: '1px solid rgba(37, 99, 235, 0.3)',
          color: '#60a5fa',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '28px',
        }}>
          <Zap size={14} /> Autonomous Money Execution Engine
        </div>

        <h1 style={{
          fontSize: '64px',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: '24px',
          letterSpacing: '-0.03em',
          color: '#ffffff',
        }}>
          Move money via web & <br />
          <span style={{ color: '#38bdf8' }}>WhatsApp natural language.</span>
        </h1>

        <p style={{
          fontSize: '19px',
          lineHeight: 1.6,
          color: '#94a3b8',
          marginBottom: '40px',
          maxWidth: '660px',
        }}>
          Tell Rova what you want in simple terms. It handles transfers, currency swaps, cross-chain bridging, and 24/7 rate watching via Web app or WhatsApp.
        </p>

        {/* Single Primary Action Button */}
        <div style={{ marginBottom: '60px' }}>
          <Link href="/login" style={{
            padding: '16px 40px',
            borderRadius: '12px',
            background: '#2563eb',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'background 0.2s ease',
          }}>
            Get Started <ArrowRight size={18} />
          </Link>
        </div>

        {/* Single Intent Demo Card */}
        <div style={{
          maxWidth: '680px',
          width: '100%',
          borderRadius: '16px',
          padding: '28px',
          textAlign: 'left',
          background: '#0f172a',
          border: '1px solid rgba(148, 163, 184, 0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
              Try saying something like...
            </p>
          </div>
          {[
            'Send $50 USDC to 0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            'Bridge 200 USDC from Ethereum to Arc',
            'Swap my USDC to EURC when rate >= 0.94',
          ].map((example, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#1e293b',
              marginBottom: i < 2 ? '8px' : 0,
              border: '1px solid rgba(148, 163, 184, 0.1)',
            }}>
              <span style={{ fontSize: '14px', color: '#e2e8f0', fontStyle: 'italic' }}>"{example}"</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid - Simple & Plain English */}
      <div style={{ padding: '40px 24px 100px', maxWidth: '1140px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {[
            {
              icon: <MessageSquare size={24} style={{ color: '#25D366' }} />,
              title: 'WhatsApp Banking Agent',
              desc: 'Chat directly on WhatsApp to send money, set target rate alerts, and manage stablecoins—no crypto jargon or app downloads required.',
            },
            {
              icon: <Wallet size={24} style={{ color: '#60a5fa' }} />,
              title: 'Instant Frictionless Accounts',
              desc: 'Sign in with just your phone number or email for an automatic secure wallet, or link your existing Web3 wallet in one click.',
            },
            {
              icon: <ShieldCheck size={24} style={{ color: '#10b981' }} />,
              title: 'Smart Security Guard',
              desc: 'Set custom limits for instant WhatsApp transfers. Micro-payments process automatically while larger amounts require 1-click web approval.',
            },
            {
              icon: <Globe size={24} style={{ color: '#f59e0b' }} />,
              title: 'Sub-Second Global Remittances',
              desc: 'Send money across borders in under a second for fractions of a cent ($0.006 fee), making global remittances instant and affordable.',
            },
            {
              icon: <Repeat size={24} style={{ color: '#a855f7' }} />,
              title: 'Zero-Slippage FX Swaps',
              desc: 'Swap between USD, EUR, and yield-bearing stablecoins at real-time institutional exchange rates with no hidden fees.',
            },
            {
              icon: <Zap size={24} style={{ color: '#38bdf8' }} />,
              title: 'Automated Rate Watchers',
              desc: 'Set target exchange rates once. Rova watches market rates 24/7 and executes your transfers automatically when your rate target is met.',
            },
          ].map(({ icon, title, desc }, i) => (
            <div key={i} style={{
              padding: '28px',
              borderRadius: '14px',
              background: '#0f172a',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                background: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(148, 163, 184, 0.1)',
              }}>
                {icon}
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', margin: 0 }}>{title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Ecosystem Logos */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '36px', marginTop: '64px', opacity: 0.6 }}>
          {['Arc Network', 'Circle Wallets', 'WhatsApp Banking', 'StableFX Engine', 'Yield USYC', 'Sub-Second Transfers'].map(t => (
            <span key={t} style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
