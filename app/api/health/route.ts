import { NextResponse } from 'next/server';
import { getHealthSnapshot } from '@/lib/core/env';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    integrations: getHealthSnapshot()
  });
}
