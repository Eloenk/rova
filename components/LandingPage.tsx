'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Zap,
  Repeat,
  Send,
  MessageCircle,
  Layers,
  Cpu,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  Globe,
  ExternalLink,
  ChevronRight,
  Calendar,
  Mail,
} from 'lucide-react';
import HeroChatDemo from '@/components/viz/HeroChatDemo';
import WarningTapeMarquee from '@/components/viz/WarningTapeMarquee';

export default function LandingPage() {
  const [hasSession, setHasSession] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'fx' | 'agent'>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('rova_user_email') || document.cookie.includes('rova_user_email=');
      setHasSession(!!email);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans antialiased overflow-x-hidden selection:bg-accent-mint/30 selection:text-accent-primary">
      {/* ── 0. TOP NAVIGATION BAR ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src="/logo.png"
                alt="ROVA Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-text-primary">ROVA</span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-accent-mint bg-accent-mint/10 border border-accent-mint/20 px-2 py-0.5 rounded-full hidden sm:inline-block">
              ARC TESTNET
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#architecture" className="hover:text-text-primary transition-colors">Architecture</a>
            <a href="#integrations" className="hover:text-text-primary transition-colors">Ecosystem</a>
            <a href="#comparison" className="hover:text-text-primary transition-colors">Comparison</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href={hasSession ? '/dashboard' : '/login'}
              className="relative inline-flex items-center justify-center p-[2px] rounded-xl overflow-hidden group shadow-lg"
            >
              <div className="btn-zebra-stripe absolute inset-0 transition-transform duration-300 group-hover:scale-110" />
              <div className="relative px-5 py-2.5 rounded-[10px] bg-black text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                <span>{hasSession ? 'Go to Dashboard' : 'Launch App'}</span>
                <ArrowRight size={14} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 1. HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-36 overflow-hidden">
        {/* Subtle Background Glow Radial */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-mint/10 blur-[140px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Pitch */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-mono text-text-secondary">
                <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
                <span>Next-Gen Stablecoin Infrastructure</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-text-primary leading-[1.08]">
                A New Standard <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary via-emerald-300 to-accent-mint font-extrabold">
                  in Autonomous Capital.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-text-secondary max-w-2xl font-normal leading-relaxed">
                Send, bridge, and swap stablecoins on Arc using plain English. Powered by Circle Programmable Wallets, x402 nanopayments, and 24/7 background execution daemons.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href={hasSession ? '/dashboard' : '/login'}
                  className="relative inline-flex items-center justify-center p-[2px] rounded-xl overflow-hidden group shadow-2xl"
                >
                  <div className="btn-zebra-stripe absolute inset-0 transition-transform duration-300 group-hover:scale-110" />
                  <div className="relative px-7 py-3.5 rounded-[10px] bg-black text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                    <span>{hasSession ? 'Access Command Hub' : 'Launch App Now'}</span>
                    <ArrowRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <a
                  href="#architecture"
                  className="px-6 py-3.5 rounded-xl bg-surface border border-border text-text-primary font-semibold text-base hover:bg-surface-raised transition-all flex items-center gap-2"
                >
                  <span>Explore Architecture</span>
                  <ChevronRight size={16} className="text-text-secondary" />
                </a>
              </div>
            </div>

            {/* Right Product Preview Floating HeroChatDemo */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <HeroChatDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. FEATURE TRIPTYCH ─────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-surface/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-accent-mint">Engineered for Precision</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-text-primary tracking-tight">
              Clarity and control for every part of your portfolio.
            </h2>
            <p className="text-text-secondary text-base md:text-lg">
              Three core execution pillars power Rova's cross-border capital engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="p-8 rounded-2xl bg-surface border border-border hover:border-border-strong transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-sm font-mono font-bold text-accent-primary">[1]</span>
                <h3 className="text-xl font-bold text-text-primary">x402 Nanopayments</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Before moving money, Rova queries 3 independent FX desks paying a fraction of a cent per quote over x402 to capture the tightest spread.
                </p>
              </div>
              <div className="mt-8 p-4 rounded-xl bg-surface-raised border border-border text-xs space-y-2 font-mono">
                <div className="flex justify-between text-text-secondary">
                  <span>Provider A</span>
                  <span className="text-text-primary">1.0821 EUR/USD</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Provider B</span>
                  <span className="text-accent-mint font-bold">1.0845 EUR/USD (Best)</span>
                </div>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 rounded-2xl bg-surface border border-border hover:border-border-strong transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-sm font-mono font-bold text-accent-primary">[2]</span>
                <h3 className="text-xl font-bold text-text-primary">Autonomous Daemons</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Set standing instructions once. The native `rova-agent-go` background engine monitors chain state and executes transfers even while you sleep.
                </p>
              </div>
              <div className="mt-8 p-4 rounded-xl bg-surface-raised border border-border text-xs space-y-2 font-mono">
                <div className="flex items-center gap-2 text-accent-success">
                  <CheckCircle2 size={14} />
                  <span>Rule #8004 Executed</span>
                </div>
                <div className="text-text-secondary">Trigger: Rate &gt; $1.02 • Swapped 500 USDC</div>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-8 rounded-2xl bg-surface border border-border hover:border-border-strong transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-sm font-mono font-bold text-accent-primary">[3]</span>
                <h3 className="text-xl font-bold text-text-primary">CCTP V2 Cross-Chain</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Burn-and-mint native USDC transfers across Sepolia, Base, Polygon, and Arc with zero slippage and sub-second finality.
                </p>
              </div>
              <div className="mt-8 p-4 rounded-xl bg-surface-raised border border-border text-xs space-y-2 font-mono">
                <div className="flex justify-between text-text-secondary">
                  <span>Source: Polygon</span>
                  <span>Dest: Arc Testnet</span>
                </div>
                <div className="text-accent-mint font-bold">Circle Gateway Verified</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FLOATING MICRO-INSIGHT CALLOUTS ────────────────────────────── */}
      <section className="py-20 bg-background relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-surface border border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-mint/10 border border-accent-mint/20 flex items-center justify-center shrink-0">
                <TrendingUp size={24} className="text-accent-mint" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-text-primary font-mono">+$12,840</div>
                <div className="text-xs text-text-secondary">Captured FX Arbitrage Value</div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
                <Zap size={24} className="text-accent-primary" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-text-primary font-mono">400ms</div>
                <div className="text-xs text-text-secondary">Average x402 Quote Settlement</div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-success/10 border border-accent-success/20 flex items-center justify-center shrink-0">
                <Shield size={24} className="text-accent-success" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-text-primary font-mono">100%</div>
                <div className="text-xs text-text-secondary">On-Chain Verified (`RovaExecutionLog`)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SYSTEM NODE DIAGRAM (Full-Page Depth with Elevated Shadows) ────────────────── */}
      <section id="architecture" className="py-28 bg-black border-t border-white/10 relative">
        <div className="w-full max-w-[1400px] mx-auto px-6 text-center space-y-16">
          <div className="max-w-4xl mx-auto space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-text-tertiary bg-white/5 border border-white/10 px-3 py-1 rounded-full">System Architecture</span>
            <h2 className="text-4xl md:text-6xl font-extrabold text-text-primary tracking-tight">
              One platform. Multiple intelligence layers.
            </h2>
            <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto">
              Rova unifies plain-English intent understanding, micro-nanopayment shopping, and native EVM execution into a single high-availability stack.
            </p>
          </div>

          {/* Full-Page Diagram Grid Container with Elevated Shadow Depth */}
          <div className="relative p-8 md:p-14 rounded-3xl bg-[#08080a] border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.95)]">
            {/* Central Node — Big bold text */}
            <div className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-black tracking-widest text-white uppercase mb-14">
              <Cpu size={30} className="text-emerald-400" />
              <span>ROVA CORE ENGINE</span>
            </div>

            {/* Satellite Layer Grid with Deep Elevated Shadows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
              <div className="p-8 rounded-2xl bg-[#0f0f13] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.8)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] hover:border-emerald-500/40 transition-all duration-300 space-y-3">
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">LAYER 1 • PARSER</div>
                <h4 className="text-lg font-extrabold text-white">Intent Parser</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Translates natural language prompts from WhatsApp & Web into structured smart contract transaction payload specs with failsafe fast-paths.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-[#0f0f13] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.8)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] hover:border-emerald-500/40 transition-all duration-300 space-y-3">
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">LAYER 2 • QUOTE</div>
                <h4 className="text-lg font-extrabold text-white">x402 / Gateway</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Queries 3 independent market liquidity desks over x402 HTTP headers, paying sub-cent micro-nanopayments for real-time rates.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-[#0f0f13] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.8)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] hover:border-emerald-500/40 transition-all duration-300 space-y-3">
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">LAYER 3 • ROUTER</div>
                <h4 className="text-lg font-extrabold text-white">CCTP V2 Bridge</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Executes native burn-and-mint cross-chain liquidity routing between Sepolia, Base, Polygon, and Arc with 1:1 parity guarantee.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-[#0f0f13] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.8)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] hover:border-emerald-500/40 transition-all duration-300 space-y-3">
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">LAYER 4 • AUDIT</div>
                <h4 className="text-lg font-extrabold text-white">Arc Audit Ledger</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Records every user action and automated trigger on `RovaExecutionLog` smart contract for immutable, verifiable proof of reserves.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. INTEGRATIONS STRIP (Warning Tape Marquee Band) ────────────────────────────── */}
      <WarningTapeMarquee />

      {/* ── 6. COMPARISON TABLE ─────────────────────────────────────────── */}
      <section id="comparison" className="py-24 bg-surface/40 border-t border-border">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-accent-mint">Unmatched Efficiency</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-text-primary tracking-tight">
              Built for modern capital, not legacy systems.
            </h2>
          </div>

          <div className="rounded-2xl bg-surface border border-border overflow-hidden">
            <div className="grid grid-cols-12 bg-surface-raised border-b border-border p-4 font-bold text-sm text-text-primary">
              <div className="col-span-6">Capability</div>
              <div className="col-span-3 text-center text-accent-primary">ROVA</div>
              <div className="col-span-3 text-center text-text-tertiary">Legacy Platforms</div>
            </div>

            {[
              { cap: 'x402 Nanopayment Rate Shopping', rova: true, legacy: false },
              { cap: '24/7 Autonomous Background Daemons', rova: true, legacy: false },
              { cap: 'Natural Language Prompting (WhatsApp & Web)', rova: true, legacy: false },
              { cap: 'Zero-Slippage Atomic FX Swaps (StableFX)', rova: true, legacy: false },
              { cap: 'Circle Programmable Wallet Security', rova: true, legacy: true },
            ].map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 p-4 border-b border-border/50 items-center text-sm">
                <div className="col-span-6 text-text-primary font-medium">{item.cap}</div>
                <div className="col-span-3 flex justify-center text-accent-success">
                  <CheckCircle2 size={18} />
                </div>
                <div className="col-span-3 flex justify-center text-text-tertiary">
                  {item.legacy ? <CheckCircle2 size={18} /> : <XCircle size={18} className="text-accent-error/60" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. CLOSING CTA & LIVE SYSTEM ACTIVITY ───────────────────────── */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-extrabold text-text-primary tracking-tight">
            Ready to automate your money movement?
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Experience sub-second finality and autonomous capital execution on Arc Testnet.
          </p>

          <div className="pt-4">
            <Link
              href={hasSession ? '/dashboard' : '/login'}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-accent-primary text-primary-foreground font-extrabold text-lg hover:brightness-110 transition-all shadow-[0_0_40px_rgba(191,255,0,0.25)]"
            >
              <span>Launch Application</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. FOOTER ────────────────────────────────────────────────────── */}
      <footer className="py-12 bg-surface border-t border-border text-xs text-text-secondary">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="ROVA" className="w-6 h-6 rounded" />
            <span className="font-bold text-text-primary">ROVA</span>
            <span>© 2026 Rova Protocol. Built on Arc.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="mailto:support@rova.network" className="hover:text-text-primary transition-colors flex items-center gap-1.5">
              <Mail size={14} /> Support
            </a>
            <a href="https://docs.arc.network" target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors flex items-center gap-1.5">
              <ExternalLink size={14} /> Arc Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
