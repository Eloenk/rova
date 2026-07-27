'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, Wallet, CheckCircle2, Smartphone, Mail, Globe, Send, Layers } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'phone' | 'email' | 'web3'>('phone');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 600);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 600);
  };

  const handleWeb3Connect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      background: '#ffffff',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Left Side: Large Bolder ROVA x ARC Writeup & Footer Metrics (50% Desktop Width) */}
      <div style={{
        flex: '1 1 50%',
        minWidth: '340px',
        background: '#05080c',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px 64px',
        position: 'relative',
        borderRight: '1px solid #1e293b',
        boxSizing: 'border-box',
      }}>
        {/* Main Center Writeup */}
        <div style={{ maxWidth: '520px', margin: 'auto 0' }}>
          <h1 style={{
            fontSize: '64px',
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            marginBottom: '24px',
          }}>
            ROVA × ARC
          </h1>

          <p style={{
            fontSize: '20px',
            lineHeight: 1.6,
            color: '#94a3b8',
            margin: 0,
          }}>
            Autonomous cross-border stablecoin execution engine. Managed Circle wallets, threshold security, and x402 nanopayment rate shopping.
          </p>
        </div>

        {/* Absolute Footer Level Metrics */}
        <div style={{
          paddingTop: '32px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: 0.65,
        }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
            ARC TESTNET (5042002)
          </span>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
            SUB-SECOND FINALITY
          </span>
        </div>
      </div>

      {/* Right Side: Clean Crisp All-White Auth Section with ROVA Logo at top */}
      <div style={{
        flex: '1 1 50%',
        minWidth: '340px',
        background: '#ffffff',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '50px 48px',
        boxSizing: 'border-box',
      }}>
        {/* Top Header with ROVA Logo on White Side */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Send size={19} color="#ffffff" strokeWidth={3} />
            </div>
            <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>ROVA</span>
          </Link>

          <Link href="/" style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textDecoration: 'none' }}>
            Back to Home
          </Link>
        </div>

        {/* Center Auth Card */}
        <div style={{ maxWidth: '420px', width: '100%', margin: '40px auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Sign In to Rova
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              {step === 'input' ? 'Select your authentication method to access your agent dashboard' : 'Enter the 6-digit verification code sent to your device'}
            </p>
          </div>

          {/* Auth Tab Switcher */}
          <div style={{
            display: 'flex',
            padding: '4px',
            background: '#f1f5f9',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '28px',
          }}>
            {[
              { id: 'phone', label: 'Phone OTP', icon: <Smartphone size={14} /> },
              { id: 'email', label: 'Email OTP', icon: <Mail size={14} /> },
              { id: 'web3', label: 'Web3 Wallet', icon: <Globe size={14} /> },
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setAuthMode(id as any); setStep('input'); }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: authMode === id ? '#0f172a' : 'transparent',
                  color: authMode === id ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease',
                }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Form Content */}
          {authMode !== 'web3' ? (
            step === 'input' ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    {authMode === 'phone' ? 'WhatsApp / Phone Number' : 'Email Address'}
                  </label>
                  <input
                    type={authMode === 'phone' ? 'tel' : 'email'}
                    placeholder={authMode === 'phone' ? '+1 (555) 000-0000' : 'user@example.com'}
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {loading ? 'Sending Code...' : 'Continue with OTP'}
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '18px',
                      fontWeight: 700,
                      letterSpacing: '0.2em',
                      textAlign: 'center',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify & Launch Dashboard'}
                  <CheckCircle2 size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setStep('input')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Change {authMode === 'phone' ? 'phone number' : 'email'}
                </button>
              </form>
            )
          ) : (
            /* Single RainbowKit / Web3Modal Unified Multi-Wallet Selector */
            <div>
              <button
                type="button"
                onClick={handleWeb3Connect}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
                }}
              >
                <Wallet size={18} color="#BFFF00" />
                <span>{loading ? 'Connecting...' : 'Connect Web3 Wallet (RainbowKit)'}</span>
              </button>
              <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
                Supports Rainbow, MetaMask, Coinbase Wallet, and WalletConnect
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#64748b',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={14} color="#0f172a" />
            Circle HSM Managed Security
          </span>
        </div>
      </div>
    </div>
  );
}
