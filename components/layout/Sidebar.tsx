'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Send, LayoutDashboard, BookOpen, Bot, X } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Command Hub',     icon: <LayoutDashboard size={18} strokeWidth={2.5} /> },
  { href: '/send',      label: 'Send & Swap',     icon: <Send size={18} strokeWidth={2.5} /> },
  { href: '/agent',     label: 'Agent',           icon: <Bot size={18} strokeWidth={2.5} /> },
  { href: '/history',   label: 'Recent Activity', icon: <BookOpen size={18} strokeWidth={2.5} /> },
];

export default function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside className={`
        fixed md:relative top-0 left-0 bottom-0 z-50
        w60 h-full w-[240px] p-5 flex flex-col gap-8 flex-shrink-0
        bg-surface border-r border-border transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo & Close button on mobile */}
        <div className="flex items-center justify-between pl-2">
          <Link href="/" className="flex items-center gap-2.5 no-underline group">
            <img
              src="/logo.png"
              alt="ROVA Logo"
              className="w-8 h-8 rounded-lg object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-lg font-extrabold tracking-tight text-text-primary">ROVA</span>
          </Link>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="bg-transparent border-0 text-text-secondary cursor-pointer md:hidden hover:text-text-primary"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-1.5">
          {NAV.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onCloseMobile}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg no-underline font-semibold text-sm transition-all
                  ${isActive
                    ? 'bg-accent-mint/10 text-accent-mint border border-accent-mint/20 shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised border border-transparent'}
                `}
              >
                {icon}
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom inscription */}
        <div className="mt-auto pl-2 pb-1">
          <span className="text-xs text-text-secondary font-mono tracking-wider">
            Arc Testnet • 5042002
          </span>
        </div>
      </aside>
    </>
  );
}
