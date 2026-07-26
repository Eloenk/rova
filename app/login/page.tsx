'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Zap, ArrowRight, Wallet, CheckCircle2, Lock, Smartphone, Mail, Globe } from 'lucide-react';

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

  const handleWeb3Connect = (providerName: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#090d14] text-slate-100 flex flex-col justify-between">
      <header className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
            R
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">ROVA</span>
        </Link>
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
          Back to home
        </Link>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-6 lg:p-12 gap-8 lg:gap-16 items-center justify-center">
        {/* Left Side: Arc Network Branding Showcase (Desktop 50/50 Split) */}
        <div className="w-full lg:w-1/2 flex flex-col space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-400 text-xs font-medium">
              <Zap className="w-3.5 h-3.5" />
              <span>Arc Testnet Engine (Chain ID 5042002)</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-white leading-tight">
              Autonomous AI Agent Execution Engine
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Sign in to manage your Circle Developer-Controlled Agent Wallet, configure WhatsApp security thresholds, and execute sub-second cross-chain intents.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-medium">Sub-Second Finality</div>
              <div className="text-xl font-bold text-white">&lt; 250ms</div>
              <div className="text-[11px] text-slate-500">Arc Testnet Settlement</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-medium">Gas Overhead</div>
              <div className="text-xl font-bold text-emerald-400">~$0.006</div>
              <div className="text-[11px] text-slate-500">Native USDC Gas</div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-slate-300">Live Security Guard</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            </div>
            <div className="text-xs text-slate-300 font-mono bg-slate-950/80 p-3 rounded border border-slate-800/60 space-y-1">
              <div className="text-slate-400">// WhatsApp Intent Protection</div>
              <div>Auto-execution limit: <span className="text-blue-400">$100.00 USDC</span></div>
              <div>Transfers &gt; threshold require 1-click Web Approval signature.</div>
            </div>
          </div>
        </div>

        {/* Right Side: Clean White/Slate Modern Auth Card */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white tracking-tight">Access Your Agent</h2>
              <p className="text-sm text-slate-400">
                {step === 'input' ? 'Sign in or create a new account automatically' : 'Enter the verification code sent to your device'}
              </p>
            </div>

            {/* Auth Tab Switcher */}
            <div className="flex p-1 bg-slate-950/80 rounded-lg border border-slate-800/80 text-xs font-medium">
              <button
                type="button"
                onClick={() => { setAuthMode('phone'); setStep('input'); }}
                className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${authMode === 'phone' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Phone OTP
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('email'); setStep('input'); }}
                className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${authMode === 'email' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Mail className="w-3.5 h-3.5" />
                Email OTP
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('web3'); setStep('input'); }}
                className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${authMode === 'web3' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Globe className="w-3.5 h-3.5" />
                Web3 Wallet
              </button>
            </div>

            {/* Form Section */}
            {authMode !== 'web3' ? (
              step === 'input' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {authMode === 'phone' ? 'WhatsApp Phone Number' : 'Email Address'}
                    </label>
                    <input
                      type={authMode === 'phone' ? 'tel' : 'email'}
                      placeholder={authMode === 'phone' ? '+1 (555) 000-0000' : 'user@example.com'}
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Continue with OTP'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-center tracking-widest text-lg font-mono focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify & Launch Dashboard'}
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Change {authMode === 'phone' ? 'phone number' : 'email'}
                  </button>
                </form>
              )
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleWeb3Connect('Rainbow')}
                  className="w-full p-3.5 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-slate-200 text-sm font-medium flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-blue-400" />
                    Rainbow Wallet
                  </span>
                  <span className="text-xs text-slate-400">Connect</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWeb3Connect('MetaMask')}
                  className="w-full p-3.5 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-slate-200 text-sm font-medium flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-amber-400" />
                    MetaMask
                  </span>
                  <span className="text-xs text-slate-400">Connect</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWeb3Connect('Thirdweb')}
                  className="w-full p-3.5 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-slate-200 text-sm font-medium flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-purple-400" />
                    Thirdweb / WalletConnect
                  </span>
                  <span className="text-xs text-slate-400">Connect</span>
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Circle Developer-Controlled Wallet
              </span>
              <span>Arc Testnet</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-xs text-slate-500 border-t border-slate-800/60">
        &copy; {new Date().getFullYear()} Rova Execution Engine. All rights reserved.
      </footer>
    </div>
  );
}
