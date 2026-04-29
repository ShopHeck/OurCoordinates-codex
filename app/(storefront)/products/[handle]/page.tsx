import Link from 'next/link';
import { headers } from 'next/headers';
import { PreviewCard } from '@/components/preview/preview-card';
import { PreviewControls } from '@/components/preview/preview-controls';

type PreviewPayload = {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  ctaHref: string;
  ctaLabel: string;
  error?: string;
};

async function getPreview(handle: string): Promise<PreviewPayload> {
  const h = await headers();
  const host = h.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

  const response = await fetch(`${protocol}://${host}/api/preview?handle=${encodeURIComponent(handle)}`, {
    cache: 'no-store'
  });

  const data = (await response.json()) as PreviewPayload;

  if (!response.ok) {
    throw new Error(data.error ?? 'Could not load preview payload.');
  }

  return data;
}

export default async function ProductPreviewPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;

  try {
    const payload = await getPreview(handle);

    return (
      <main className="container" style={{ display: 'grid', gap: '1rem' }}>
        <PreviewCard {...payload} />
        <PreviewControls />
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';

    return (
      <main className="container">
        <section className="hero" role="alert">
          <p className="kicker">Error state</p>
          <h1 style={{ marginTop: '0.75rem' }}>Unable to load preview</h1>
          <p style={{ marginTop: '0.75rem' }}>{message}</p>
          <Link href="/" style={{ display: 'inline-block', marginTop: '1rem' }}>
            Return home
          </Link>
        </section>
      </main>
    );
  }
}
