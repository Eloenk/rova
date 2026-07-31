'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle2, ArrowRight, RefreshCw, Globe, Loader2 } from 'lucide-react';

type Step = 'idle' | 'typing' | 'sent' | 'processing' | 'resolved' | 'hold';

interface ExampleScenario {
  type: 'send' | 'swap' | 'bridge';
  command: string;
  resolution: React.ReactNode;
}

const SCENARIOS: ExampleScenario[] = [
  {
    type: 'send',
    command: 'Send 50 USDC to 0x2345...78vy',
    resolution: (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-accent-primary/20 text-xs">
        <CheckCircle2 size={16} className="text-accent-primary shrink-0" />
        <div className="flex-1">
          <div className="font-bold text-text-primary">Sent ✓</div>
          <div className="text-[11px] text-text-secondary font-mono">Recipient: 0x2345...78vy</div>
        </div>
        <span className="font-mono font-bold text-accent-primary text-sm">50 USDC</span>
      </div>
    ),
  },
  {
    type: 'swap',
    command: 'Swap 100 USDC to EURC',
    resolution: (
      <div className="p-3 rounded-lg bg-surface border border-accent-primary/20 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-text-primary flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-accent-primary" /> Swapped ✓
          </span>
          <span className="text-[10px] font-mono text-text-tertiary">3 desks queried</span>
        </div>
        <div className="text-[11px] text-text-secondary font-mono">
          Best rate: <span className="text-text-primary font-bold">1 USDC = 0.9210 EURC</span>
        </div>
      </div>
    ),
  },
  {
    type: 'bridge',
    command: 'Bridge 200 USDC to Base',
    resolution: (
      <div className="p-3 rounded-lg bg-surface border border-accent-primary/20 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-text-primary flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-accent-primary" /> Bridged ✓
          </span>
          <span className="text-[10px] font-mono text-accent-primary font-bold">CCTP V2</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">Polygon</span>
          <ArrowRight size={12} className="text-accent-primary" />
          <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">Base</span>
          <span className="ml-auto font-bold text-text-primary">200 USDC</span>
        </div>
      </div>
    ),
  },
];

export default function HeroChatDemo() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [step, setStep] = useState<Step>('idle');
  const [typedText, setTypedText] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver to pause loop when scrolled out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const currentScenario = SCENARIOS[scenarioIdx];

  useEffect(() => {
    if (!isVisible) return;

    let timeout: NodeJS.Timeout;

    if (step === 'idle') {
      setTypedText('');
      timeout = setTimeout(() => setStep('typing'), 800);
    } else if (step === 'typing') {
      const fullText = currentScenario.command;
      if (typedText.length < fullText.length) {
        timeout = setTimeout(() => {
          setTypedText(fullText.slice(0, typedText.length + 1));
        }, 40);
      } else {
        timeout = setTimeout(() => setStep('sent'), 600);
      }
    } else if (step === 'sent') {
      timeout = setTimeout(() => setStep('processing'), 400);
    } else if (step === 'processing') {
      timeout = setTimeout(() => setStep('resolved'), 1200);
    } else if (step === 'resolved') {
      timeout = setTimeout(() => setStep('hold'), 2200);
    } else if (step === 'hold') {
      timeout = setTimeout(() => {
        setScenarioIdx(prev => (prev + 1) % SCENARIOS.length);
        setStep('idle');
      }, 500);
    }

    return () => clearTimeout(timeout);
  }, [step, typedText, scenarioIdx, isVisible, currentScenario.command]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[460px] p-6 rounded-2xl bg-surface-raised/95 border border-accent-primary/30 shadow-[0_0_40px_rgba(37,211,102,0.18),0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl font-sans text-left transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent-primary animate-pulse" />
          <span className="font-extrabold text-text-primary tracking-wide text-sm">Rova Agent</span>
        </div>
        <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-widest font-bold">
          Live Execution Demo
        </span>
      </div>

      {/* Message Exchange Area */}
      <div className="min-h-[130px] flex flex-col justify-end space-y-3 mb-4">
        {(step === 'sent' || step === 'processing' || step === 'resolved' || step === 'hold') && (
          <div className="self-end max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-accent-primary/15 border border-accent-primary/30 text-xs text-text-primary font-medium shadow-sm animate-fade-up">
            {currentScenario.command}
          </div>
        )}

        {(step === 'processing' || step === 'resolved' || step === 'hold') && (
          <div className="self-start max-w-[90%] w-full space-y-2 animate-fade-up">
            {step === 'processing' ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface border border-border text-xs text-text-secondary">
                <Loader2 size={15} className="animate-spin text-accent-primary shrink-0" />
                <span>Finding best rate & shopping x402 desks...</span>
              </div>
            ) : (
              currentScenario.resolution
            )}
          </div>
        )}
      </div>

      {/* Input Pill */}
      <div className="flex items-center gap-2 p-2 pl-4 rounded-full bg-surface border border-border-strong shadow-inner">
        <div className="flex-1 text-xs text-text-primary font-mono truncate min-h-[16px] flex items-center">
          {step === 'typing' || step === 'sent' ? (
            <>
              {typedText}
              <span className="w-1.5 h-3.5 bg-accent-primary inline-block ml-0.5 animate-pulse" />
            </>
          ) : (
            <span className="text-text-tertiary">Ask Rova to send, swap, or bridge...</span>
          )}
        </div>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
            step === 'typing'
              ? 'bg-accent-primary text-primary-foreground shadow-sm'
              : 'bg-surface-raised text-text-tertiary'
          }`}
        >
          <Send size={12} />
        </div>
      </div>
    </div>
  );
}
