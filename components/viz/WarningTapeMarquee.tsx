'use client';

import { useEffect, useRef, useState } from 'react';

const ITEMS = [
  'CIRCLE',
  'ARC NETWORK',
  'WHATSAPP',
  'METAMASK',
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

  // Build repeated sequence: CIRCLE • ARC NETWORK • WHATSAPP • METAMASK • SUPABASE • ...
  const textBlock = ITEMS.join('  •  ');

  return (
    <section
      id="integrations"
      ref={containerRef}
      className="w-full py-4 bg-[#08080a] border-y border-white/15 overflow-hidden relative select-none"
      style={{
        backgroundImage: 'repeating-linear-gradient(-45deg, #08080a, #08080a 12px, #121216 12px, #121216 24px)',
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
              className="flex items-center text-xs md:text-sm font-mono font-black uppercase tracking-[0.25em] text-white/90 shrink-0 pr-8"
            >
              <span>{textBlock}</span>
              <span className="ml-8 text-emerald-400/80">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
