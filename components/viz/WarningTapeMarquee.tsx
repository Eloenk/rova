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
      className="w-full py-8 md:py-11 bg-[#0b131e] border-y border-accent-primary/30 overflow-hidden relative select-none shadow-xl"
      style={{
        backgroundImage: 'repeating-linear-gradient(-45deg, #0b131e, #0b131e 20px, #132030 20px, #132030 40px)',
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
              className="flex items-center text-xl md:text-2xl lg:text-3xl font-mono font-black uppercase tracking-[0.35em] text-white/95 shrink-0 pr-12"
            >
              <span>{textBlock}</span>
              <span className="ml-12 text-accent-primary">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
