'use client';
import dynamic from 'next/dynamic';

const SendView = dynamic(() => import('@/components/SendView'), { ssr: false });

export default function SendPage() {
  return <SendView />;
}
