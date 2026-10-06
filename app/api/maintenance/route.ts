import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const STATUS_FILE = path.join(process.cwd(), '.maintenance_status');

export async function GET() {
  const isMaintenance = fs.existsSync(STATUS_FILE);
  return NextResponse.json({ active: isMaintenance });
}

export async function POST(req: NextRequest) {
  try {
    const authorizationError = requireAdminToken(req);
    if (authorizationError) return authorizationError;
    const { active } = await req.json();
    if (typeof active !== 'boolean') {
      return NextResponse.json({ error: 'active must be a boolean' }, { status: 400 });
    }
    
    if (active) {
      fs.writeFileSync(STATUS_FILE, 'ON');
    } else {
      if (fs.existsSync(STATUS_FILE)) {
        fs.unlinkSync(STATUS_FILE);
      }
    }
    
    return NextResponse.json({ active });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update maintenance status' }, { status: 500 });
  }
}
