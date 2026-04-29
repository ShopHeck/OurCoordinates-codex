type PreviewCardProps = {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  ctaHref: string;
  ctaLabel: string;
};

export function PreviewCard({ title, description, price, imageUrl, ctaHref, ctaLabel }: PreviewCardProps) {
  return (
    <article className="hero" aria-label="Product preview">
      <img
        src={imageUrl}
        alt={title}
        style={{ width: '100%', borderRadius: '0.75rem', objectFit: 'cover', maxHeight: '18rem' }}
      />
      <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
        <p className="kicker">Preview mode</p>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p>{description}</p>
        <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>{price}</p>
        <a
          href={ctaHref}
          style={{
            display: 'inline-flex',
            width: '100%',
            justifyContent: 'center',
            background: '#0f172a',
            color: '#fff',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          {ctaLabel}
        </a>
      </div>
    </article>
  );
}
