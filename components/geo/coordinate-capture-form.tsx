'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

export function CoordinateCaptureForm() {
  const [status, setStatus] = useState<string>('');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const latitude = formData.get('latitude');
    const longitude = formData.get('longitude');

    setStatus(`Coordinates captured manually: ${latitude}, ${longitude}`);
  };

  return (
    <form onSubmit={onSubmit} className="hero" aria-describedby="manual-fallback-help">
      <p className="kicker">Manual fallback</p>
      <p id="manual-fallback-help" style={{ marginTop: '0.75rem' }}>
        If geolocation is unavailable, enter your coordinates manually.
      </p>

      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
        <label htmlFor="latitude">Latitude</label>
        <input id="latitude" name="latitude" type="number" step="0.000001" min={-90} max={90} required />

        <label htmlFor="longitude">Longitude</label>
        <input id="longitude" name="longitude" type="number" step="0.000001" min={-180} max={180} required />

        <button
          type="submit"
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: '#0f172a',
            color: '#fff',
            fontWeight: 600
          }}
        >
          Save coordinates
        </button>
      </div>

      <p aria-live="polite" style={{ marginTop: '0.75rem' }}>
        {status}
      </p>
    </form>
  );
}
