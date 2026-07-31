'use client';

import { useEffect, useRef, useState } from 'react';

const ITEMS = [
  'CIRCLE',
  'ARC NETWORK',
  'WHATSAPP',
  'SOLIDITY SMART CONTRACTS',
  'SUPABASE',
];

export default function WarningTapeMarquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Build repeated sequence: CIRCLE • ARC NETWORK • WHATSAPP • SOLIDITY SMART CONTRACTS • SUPABASE • ...
  const textBlock = ITEMS.join('  •  ');

  return (
    <section
      id="integrations"
      ref={containerRef}
      className="w-full py-7 md:py-9 bg-[#0b131e] border-y border-accent-primary/25 overflow-hidden relative select-none shadow-lg"
      style={{
        backgroundImage: 'repeating-linear-gradient(-45deg, #0b131e, #0b131e 16px, #132030 16px, #132030 32px)',
      }}
    >
      <div className="w-full overflow-hidden flex whitespace-nowrap">
        <div
          className="animate-marquee flex items-center shrink-0"
          style={{
            animationPlayState: isVisible ? 'running' : 'paused',
          }}
        >
          {/* Duplicate 4 times to guarantee seamless overflow across any screen size */}
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="flex items-center text-sm md:text-lg lg:text-xl font-mono font-black uppercase tracking-[0.3em] text-white/95 shrink-0 pr-10"
            >
              <span>{textBlock}</span>
              <span className="ml-10 text-accent-primary">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
