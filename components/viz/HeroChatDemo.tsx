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
      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
        <div className="flex-1">
          <div className="font-bold text-slate-900">Sent ✓</div>
          <div className="text-[11px] text-slate-500 font-mono">Recipient: 0x2345...78vy</div>
        </div>
        <span className="font-mono font-bold text-emerald-600 text-sm">50 USDC</span>
      </div>
    ),
  },
  {
    type: 'swap',
    command: 'Swap 100 USDC to EURC',
    resolution: (
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" /> Swapped ✓
          </span>
          <span className="text-[10px] font-mono text-slate-400">3 desks queried</span>
        </div>
        <div className="text-[11px] text-slate-600 font-mono">
          Best rate: <span className="text-slate-900 font-bold">1 USDC = 0.9210 EURC</span>
        </div>
      </div>
    ),
  },
  {
    type: 'bridge',
    command: 'Bridge 200 USDC to Base',
    resolution: (
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" /> Bridged ✓
          </span>
          <span className="text-[10px] font-mono text-emerald-600 font-bold">CCTP V2</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-medium">Polygon</span>
          <ArrowRight size={12} className="text-emerald-600" />
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-medium">Base</span>
          <span className="ml-auto font-bold text-slate-900">200 USDC</span>
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
      className="w-full max-w-[460px] p-6 rounded-2xl bg-white border border-slate-200 shadow-[0_25px_60px_rgba(0,0,0,0.85)] font-sans text-left transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-extrabold text-slate-900 tracking-wide text-sm">Rova Agent</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
          Live Execution Demo
        </span>
      </div>

      {/* Message Exchange Area */}
      <div className="min-h-[130px] flex flex-col justify-end space-y-3 mb-4">
        {(step === 'sent' || step === 'processing' || step === 'resolved' || step === 'hold') && (
          <div className="self-end max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-slate-900 text-xs text-white font-medium shadow-md animate-fade-up">
            {currentScenario.command}
          </div>
        )}

        {(step === 'processing' || step === 'resolved' || step === 'hold') && (
          <div className="self-start max-w-[90%] w-full space-y-2 animate-fade-up">
            {step === 'processing' ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <Loader2 size={15} className="animate-spin text-emerald-600 shrink-0" />
                <span>Finding best rate & shopping x402 desks...</span>
              </div>
            ) : (
              currentScenario.resolution
            )}
          </div>
        )}
      </div>

      {/* Input Pill */}
      <div className="flex items-center gap-2 p-2 pl-4 rounded-full bg-slate-100 border border-slate-300 shadow-inner">
        <div className="flex-1 text-xs text-slate-900 font-mono truncate min-h-[16px] flex items-center">
          {step === 'typing' || step === 'sent' ? (
            <>
              {typedText}
              <span className="w-1.5 h-3.5 bg-emerald-600 inline-block ml-0.5 animate-pulse" />
            </>
          ) : (
            <span className="text-slate-400">Ask Rova to send, swap, or bridge...</span>
          )}
        </div>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
            step === 'typing'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-200 text-slate-400'
          }`}
        >
          <Send size={12} />
        </div>
      </div>
    </div>
  );
}
