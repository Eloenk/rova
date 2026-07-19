'use client';
import dynamic from 'next/dynamic';

const HistoryView = dynamic(() => import('@/components/HistoryView'), { ssr: false });

export default function HistoryPage() {
  return <HistoryView />;
}
