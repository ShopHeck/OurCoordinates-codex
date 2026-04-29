import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const mockProducts: Record<string, { title: string; description: string; price: string; imageUrl: string }> = {
  'trail-pack': {
    title: 'Trail Pack',
    description: 'Weather-ready daypack with hydration sleeve and lightweight frame.',
    price: '$89.00',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80'
  },
  'summit-jacket': {
    title: 'Summit Jacket',
    description: 'Windproof shell with breathable fabric for unpredictable terrain.',
    price: '$149.00',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80'
  }
};

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get('handle');

  if (!handle) {
    return NextResponse.json({ error: 'Missing required query parameter: handle.' }, { status: 400 });
  }

  const product = mockProducts[handle];

  if (!product) {
    return NextResponse.json({ error: `No preview payload found for handle "${handle}".` }, { status: 404 });
  }

  return NextResponse.json({
    handle,
    ...product,
    ctaHref: '/coordinate-capture',
    ctaLabel: 'Capture delivery coordinates'
  });
}
