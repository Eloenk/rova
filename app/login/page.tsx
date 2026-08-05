'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { Shield, ArrowRight, CheckCircle2, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { isConnected } = useWallet();

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    const hasEmailSession = typeof window !== 'undefined' && (
      localStorage.getItem('rova_user_email') || document.cookie.includes('rova_user_email=')
    );
    if (hasEmailSession) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to send verification code');
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Verification failed');
      if (typeof window !== 'undefined') {
        localStorage.setItem('rova_user_email', email.toLowerCase().trim());
        if (data.user?.circleWalletAddress) {
          localStorage.setItem('rova_user_wallet', data.user.circleWalletAddress);
        }
      }
      router.replace('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
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
      {/* Left Side: Brand Section */}
      <div className="login-left-brand" style={{
        flex: '1 1 50%',
        minWidth: '340px',
        background: '#05080c',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px 64px',
        position: 'relative',
        boxSizing: 'border-box',
      }}>
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

        <div style={{
          paddingTop: '24px',
          display: 'flex',
          gap: '32px',
          color: '#64748b',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          <div>Circle SCA Wallets</div>
          <div>Arc Testnet</div>
          <div>StableFX Engine</div>
        </div>
      </div>

      {/* Right Side: Email OTP Login Card */}
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
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img
              src="/logo.png"
              alt="ROVA Logo"
              style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'contain' }}
            />
            <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>ROVA</span>
          </Link>

          <Link href="/" style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textDecoration: 'none' }}>
            Back to Home
          </Link>
        </div>

        <div style={{ maxWidth: '420px', width: '100%', margin: '40px auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Sign In to Rova
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              {step === 'input' ? 'Enter your email address to receive your instant 6-digit access code' : 'Enter the 6-digit verification code sent to your email'}
            </p>
          </div>

          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '20px',
              textAlign: 'center',
            }}>
              {errorMsg}
            </div>
          )}

          {step === 'input' ? (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {loading ? 'Sending Code...' : 'Continue with Email OTP'}
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
                {loading ? 'Verifying...' : 'Verify'}
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
                Change email address
              </button>
            </form>
          )}
        </div>

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
