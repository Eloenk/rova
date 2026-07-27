import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const STATUS_FILE = path.join(process.cwd(), '.maintenance_status');

export async function GET() {
  const isMaintenance = fs.existsSync(STATUS_FILE);
  return NextResponse.json({ active: isMaintenance });
}

export async function POST(req: NextRequest) {
  try {
    const { active } = await req.json();
    
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
