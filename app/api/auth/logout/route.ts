import { NextRequest } from 'next/server';
import { handleLogout } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
