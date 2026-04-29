export default function ProductPreviewLoading() {
  return (
    <main className="container">
      <section className="hero" aria-busy="true" aria-live="polite">
        <p className="kicker">Loading state</p>
        <h1 style={{ marginTop: '0.75rem' }}>Loading preview…</h1>
        <p style={{ marginTop: '0.75rem' }}>Fetching the latest product preview payload.</p>
      </section>
    </main>
  );
}
