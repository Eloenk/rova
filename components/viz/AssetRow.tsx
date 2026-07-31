'use client';

import React from 'react';

export interface AssetRowProps {
  symbol: string;
  name: string;
  amount: string;
  usdValue: string;
  iconBg?: string;
  iconColor?: string;
  sparklineData?: number[];
  change24h?: string;
}

export default function AssetRow({
  symbol,
  name,
  amount,
  usdValue,
  iconBg = 'rgba(180, 244, 215, 0.1)',
  iconColor = '#B4F4D7',
  sparklineData = [10, 15, 13, 20, 18, 25, 22, 30],
  change24h = '+0.12%',
}: AssetRowProps) {
  // Generate SVG path points for mini sparkline
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const width = 60;
  const height = 20;

  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-raised border border-border transition-all duration-200">
      {/* Left: Token Icon & Ticker */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center font-bold text-sm shrink-0 border border-border"
          style={{ background: iconBg, color: iconColor }}
        >
          {symbol === 'USDC' ? '$' : symbol === 'EURC' ? '€' : 'Y'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-text-primary truncate">{symbol}</span>
            <span className="text-[10px] text-accent-mint px-1.5 py-0.5 rounded bg-accent-mint/10 border border-accent-mint/20">
              {change24h}
            </span>
          </div>
          <span className="text-xs text-text-secondary truncate block">{name}</span>
        </div>
      </div>

      {/* Center: Sparkline */}
      <div className="hidden sm:block shrink-0 px-4">
        <svg width={width} height={height} className="overflow-visible">
          <polyline
            fill="none"
            stroke="var(--accent-mint)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>

      {/* Right: Amounts & Valuations */}
      <div className="text-right shrink-0">
        <div className="font-semibold text-sm text-text-primary font-mono">{amount}</div>
        <div className="text-xs text-text-secondary font-mono">${usdValue} USD</div>
      </div>
    </div>
  );
}
