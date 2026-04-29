'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function PreviewControls() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="hero" aria-label="Preview controls" style={{ marginTop: '1rem' }}>
      <p className="kicker">Controls</p>
      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem' }}>
        <button
          type="button"
          onClick={() => startTransition(() => router.refresh())}
          disabled={isPending}
          style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontWeight: 600 }}
        >
          {isPending ? 'Refreshing preview…' : 'Refresh preview payload'}
        </button>
      </div>
    </div>
  );
}
