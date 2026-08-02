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
      className="w-full py-3.5 sm:py-4 md:py-1.5 bg-[#0b131e] border-y border-accent-primary/40 overflow-hidden relative select-none shadow-xl snap-start snap-always"
      style={{
        backgroundImage: 'repeating-linear-gradient(-45deg, #0b131e, #0b131e 20px, #152438 20px, #152438 40px)',
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
              className="flex items-center text-xl sm:text-2xl md:text-base lg:text-lg font-mono font-black italic uppercase tracking-[0.18em] leading-none text-white shrink-0 pr-8 md:pr-10"
            >
              <span>{textBlock}</span>
              <span className="ml-8 md:ml-10 text-[#BFFF00] not-italic">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
