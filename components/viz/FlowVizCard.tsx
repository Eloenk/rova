'use client';

import { useState, useMemo, lazy, Suspense } from 'react';
import type { VizSplit } from './types';

const FlowViz = lazy(() => import('./FlowViz'));

interface FlowVizCardProps {
  splits:       any[];
  totalAmount?: number;
  className?:   string;
}

function toVizSplits(splits: any[]): VizSplit[] {
  return splits.map((s) => ({
    recipient:   s.recipient,
    address:     s.address,
    amount:      s.amount,
    currency:    s.currency || 'USDC',
    arcProtocol: s.arcProtocol || 'Arc Native',
  }));
}

export default function FlowVizCard({ splits, totalAmount, className = '' }: FlowVizCardProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const vizSplits = useMemo(() => toVizSplits(splits), [splits]);

  if (splits.length === 0) return null;

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden ${className}`}
      style={{
        background:     'rgba(8,18,38,0.72)',
        border:         '1px solid rgba(45,212,191,0.18)',
        backdropFilter: 'blur(20px)',
        boxShadow:      '0 0 0 1px rgba(45,212,191,0.05), 0 24px 64px rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(45,212,191,0.2), rgba(96,165,250,0.15))' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="2" fill="#2dd4bf" fillOpacity="0.9"/>
              <path d="M6 1v2M6 9v2M1 6h2M9 6h2M2.5 2.5l1.5 1.5M8 8l1.5 1.5M9.5 2.5L8 4M4 8L2.5 9.5"
                stroke="#2dd4bf" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.7"/>
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-white/55 uppercase tracking-wider">
            Capital Flow
          </span>
          <span
            className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white/35"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            {splits.length} split{splits.length !== 1 ? 's' : ''}
          </span>
        </div>

        <button
          onClick={() => setIsAnimating((p) => !p)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200"
          style={{
            background:   isAnimating ? 'rgba(45,212,191,0.08)' : 'rgba(255,255,255,0.04)',
            border:       isAnimating ? '1px solid rgba(45,212,191,0.2)' : '1px solid rgba(255,255,255,0.08)',
            color:        isAnimating ? 'rgba(45,212,191,0.7)' : 'rgba(255,255,255,0.3)',
          }}
        >
          {isAnimating ? 'Live' : 'Paused'}
        </button>
      </div>

      <div style={{ height: 320 }}>
        <Suspense fallback={<div className="w-full h-full bg-[#03060f]" />}>
          <FlowViz
            splits={vizSplits}
            totalAmount={totalAmount}
            isAnimating={isAnimating}
          />
        </Suspense>
      </div>

      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        {splits.map((split, i) => {
          const pct = totalAmount ? Math.round((split.amount / totalAmount) * 100) : null;
          return (
            <div key={i} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: `hsla(${[170,210,260,140,30,190][i % 6]},70%,55%,0.9)` }}
              />
              <span className="text-[10px] text-white/45 truncate max-w-[100px]">
                {split.recipient}
              </span>
              {pct !== null && <span className="text-[10px] font-mono text-white/25">{pct}%</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
