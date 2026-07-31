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
      className="w-full py-5 md:py-7 bg-[#0b131e] border-y-2 border-accent-primary/40 overflow-hidden relative select-none shadow-2xl"
      style={{
        backgroundImage: 'repeating-linear-gradient(-45deg, #0b131e, #0b131e 35px, #152438 35px, #152438 70px)',
      }}
    >
      <div className="w-full overflow-hidden flex whitespace-nowrap items-center">
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
              className="flex items-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-mono font-black italic uppercase tracking-[0.22em] leading-none text-white shrink-0 pr-14"
            >
              <span>{textBlock}</span>
              <span className="ml-14 text-[#BFFF00] not-italic">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
