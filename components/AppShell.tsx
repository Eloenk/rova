'use client';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

// Lazy-load so SSR never touches browser APIs inside the widget
const FeedbackWidget = dynamic(() => import('@/components/FeedbackWidget'), { ssr: false });

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--background)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar />
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
      {/* Feedback button — floats above all content on every page */}
      <FeedbackWidget />
    </div>
  );
}
