import { NextResponse } from 'next/server';
import { env } from '@/lib/core/env';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    integrations: {
      shopifyApiVersion: env.shopify.apiVersion
    }
  });
}
