'use client';

import dynamic from 'next/dynamic';
import type { FlowPlan, ExecutionResult } from '@/lib/types';
import type { FlowStatus } from '@/hooks/useRova';

// Lazy-load the canvas viz
const FlowVizCard = dynamic(() => import('@/components/viz/FlowVizCard'), { ssr: false });

interface FlowPlanCardProps {
  plan:              FlowPlan;
  status:            FlowStatus;
  executionResult:   ExecutionResult | null;
  onExecute:         () => void;
  isWalletConnected: boolean;
  processingMs:      number | null;
}

const RISK_STYLES = {
  low:    { bg:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.25)',  text:'#34d399', label:'Low Risk'    },
  medium: { bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.25)',  text:'#fbbf24', label:'Medium Risk' },
  high:   { bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.25)', text:'#f87171', label:'High Risk'   },
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${value}%`,
          background: value > 75
            ? 'linear-gradient(90deg,#2dd4bf,#34d399)'
            : value > 50
              ? 'linear-gradient(90deg,#60a5fa,#2dd4bf)'
              : 'linear-gradient(90deg,#fbbf24,#f97316)',
        }}
      />
    </div>
  );
}

export default function FlowPlanCard({
  plan, status, executionResult, onExecute, isWalletConnected, processingMs,
}: FlowPlanCardProps) {
  const riskStyle = RISK_STYLES[plan.risk];
  const isExecuting  = status === 'executing' || status === 'recording';
  const isConfirmed  = status === 'confirmed';
  const ctaDisabled  = ['executing', 'recording'].includes(status);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden glass-card shadow-glow-blue"
      style={{
        background:     'rgba(8,18,38,0.75)',
        border:         '1px solid rgba(45,212,191,0.25)',
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center border border-teal-500/20"
            style={{ background:'linear-gradient(135deg,rgba(45,212,191,0.15),rgba(96,165,250,0.1))' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L11.5 3.5V8.5L7 11L2.5 8.5V3.5L7 1Z" stroke="#2dd4bf" strokeWidth="1.1"/>
              <path d="M7 4.5L9 5.75V8.25L7 9.5L5 8.25V5.75L7 4.5Z" fill="rgba(45,212,191,0.3)"/>
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white/90">Flow Plan Generated</p>
            {processingMs && (
              <p className="text-[10px] text-white/30 font-mono">
                Claude processed in {processingMs}ms
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
            style={{ background:riskStyle.bg, border:`1px solid ${riskStyle.border}`, color:riskStyle.text }}
          >
            {riskStyle.label}
          </span>
          <span className="text-[11px] font-mono text-white/35">
            {plan.confidence}% conf.
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 space-y-5">
        <div
          className="px-4 py-3 rounded-xl text-[12px] font-medium text-teal-300/80 text-center"
          style={{ background:'rgba(45,212,191,0.05)', border:'1px solid rgba(45,212,191,0.12)' }}
        >
          ⚡ {plan.strategy}
        </div>

        <FlowVizCard
          splits={plan.splits}
          totalAmount={plan.totalAmount}
        />

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Capital Splits</p>
            <p className="text-[10px] text-white/25 font-mono">
              Total: ${plan.totalAmount.toLocaleString()} USDC
            </p>
          </div>

          <div className="space-y-2">
            {plan.splits.map((split, i) => {
              const pct     = Math.round((split.amount / plan.totalAmount) * 100);
              const txHash  = executionResult?.txHashes?.[i];
              const scanUrl = executionResult?.arcScanLinks?.[i];

              return (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden transition-all duration-300"
                  style={{
                    background: isConfirmed ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.03)',
                    border:     isConfirmed ? '1px solid rgba(52,211,153,0.15)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[12px] font-semibold text-white/80 truncate">
                          {split.recipient}
                        </p>
                        <span
                          className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider"
                          style={{ background:'rgba(96,165,250,0.1)', color:'rgba(96,165,250,0.7)', border:'1px solid rgba(96,165,250,0.15)' }}
                        >
                          {split.arcProtocol}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] font-mono text-white/25 truncate">
                          {split.address}
                        </p>
                      </div>
                    </div>

                    <div className="text-right ml-3 shrink-0">
                      <p className="text-[14px] font-bold text-teal-300">
                        ${split.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-white/30">
                        {pct}% · {split.currency}
                      </p>
                    </div>
                  </div>

                  <div className="px-3 pb-2.5">
                    <ProgressBar value={pct} />
                  </div>

                  {isConfirmed && txHash && scanUrl && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 border-t"
                      style={{ borderColor:'rgba(52,211,153,0.1)', background:'rgba(52,211,153,0.03)' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <circle cx="5" cy="5" r="4" stroke="#34d399" strokeWidth="1"/>
                        <path d="M3 5l1.5 1.5 2.5-3" stroke="#34d399" strokeWidth="1" strokeLinecap="round"/>
                      </svg>
                      <a
                        href={scanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-emerald-400/80 hover:text-emerald-300 transition-colors flex items-center gap-1"
                        title={`View on ArcScan: ${scanUrl}`}
                      >
                        <span>{txHash.slice(0, 10)}…{txHash.slice(-8)}</span>
                        <span>↗</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {plan.gasEstimate && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-[11px] text-white/35">Arc gas estimate:</span>
            <span className="text-[12px] font-semibold text-teal-400/70 font-mono ml-auto">
              ${plan.gasEstimate.totalGasUsdc.toFixed(3)} USDC
            </span>
          </div>
        )}

        <div
          className="px-4 py-3 rounded-xl text-[12px] leading-relaxed text-white/45"
          style={{ borderLeft:'2px solid rgba(45,212,191,0.3)', background:'rgba(255,255,255,0.02)' }}
        >
          {plan.reasoning}
        </div>

        {isConfirmed && executionResult ? (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#34d399" strokeWidth="1.2"/>
              <path d="M5 8l2 2 4-4" stroke="#34d399" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <p className="text-[12px] font-semibold text-emerald-300">
                {executionResult.txHashes.length} flows confirmed on Arc
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={onExecute}
            disabled={ctaDisabled}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-[13px] font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: ctaDisabled
                ? 'rgba(13,148,136,0.4)'
                : 'linear-gradient(135deg,#0d9488,#0369a1)',
              boxShadow: ctaDisabled
                ? 'none'
                : '0 0 28px rgba(13,148,136,0.4),0 4px 16px rgba(0,0,0,0.3)',
              color: 'white',
            }}
          >
            {isExecuting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                  <path d="M8 2A6 6 0 0114 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {status === 'recording' ? 'Recording reputation…' : 'Submitting to Arc…'}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {isWalletConnected ? 'Execute on Arc' : 'Execute (Agent Mode)'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
