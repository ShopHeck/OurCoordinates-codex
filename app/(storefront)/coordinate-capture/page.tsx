import { CoordinateCaptureForm } from '@/components/geo/coordinate-capture-form';

export default function CoordinateCapturePage() {
  return (
    <main className="container" style={{ display: 'grid', gap: '1rem' }}>
      <section className="hero">
        <p className="kicker">Coordinate capture</p>
        <h1 style={{ marginTop: '0.75rem' }}>Where should we deliver?</h1>
        <p style={{ marginTop: '0.75rem' }}>
          Use geolocation in your checkout flow, with manual fallback when permissions are denied.
        </p>
      </section>
      <CoordinateCaptureForm />
    </main>
  );
}
