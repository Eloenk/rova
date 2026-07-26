'use client';
export const dynamic = 'force-dynamic';
import nextDynamic from 'next/dynamic';

const AgentView = nextDynamic(() => import('@/components/AgentView'), { ssr: false });

export default function AgentPage() {
  return <AgentView />;
}
