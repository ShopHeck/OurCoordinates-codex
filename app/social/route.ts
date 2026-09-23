import { isOperator, unauthorized } from '@/lib/social/auth';
import { instagramConfigured } from '@/lib/social/publish';
import { listDrafts, type SocialDraft } from '@/lib/social/store';

export const runtime = 'nodejs';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

function card(draft: SocialDraft): string {
  const action = `/api/social/drafts/${encodeURIComponent(draft.id)}`;
  const photo = draft.product.imageUrl
    ? `<img src="${escapeHtml(draft.product.imageUrl)}" alt="${escapeHtml(draft.product.imageAlt ?? draft.product.title)}" loading="lazy">`
    : '<div class="no-photo">No product photo</div>';
  const publishedLink = draft.outcome?.state === 'published' && draft.outcome.url
    ? `<p><a href="${escapeHtml(draft.outcome.url)}" target="_blank" rel="noopener noreferrer">View published post ↗</a></p>`
    : '';
  const review = draft.status === 'draft' ? `
    <form method="post" action="${action}">
      <label for="caption-${draft.id}">Instagram caption</label>
      <textarea id="caption-${draft.id}" name="caption" maxlength="2200" required>${escapeHtml(draft.caption)}</textarea>
      <div class="actions">
        <button name="action" value="save">Save draft</button>
        <button name="action" value="approve" class="primary">Approve</button>
        <button name="action" value="reject">Reject</button>
      </div>
    </form>` : `<div class="caption">${escapeHtml(draft.caption)}</div>`;
  const publish = draft.status === 'approved'
    ? `<form method="post" action="${action}"><button name="action" value="publish" class="primary" ${instagramConfigured() ? '' : 'disabled title="Instagram credentials are needed"'}>Publish approved post to Instagram</button></form>`
    : '';
  const reconcile = (draft.status === 'pending' || draft.status === 'unknown') && draft.outcome?.delivery
    ? `<form method="post" action="${action}"><button name="action" value="reconcile">Check delivery status</button></form>`
    : '';
  return `<article class="card">
    <div class="photo">${photo}</div>
    <div class="details">
      <div class="row"><span class="badge ${escapeHtml(draft.status)}">${escapeHtml(draft.status)}</span><span>${new Date(draft.createdAt).toLocaleDateString('en-US')}</span></div>
      <h2>${escapeHtml(draft.product.title)}</h2>
      <a href="${escapeHtml(draft.product.url)}" target="_blank" rel="noopener noreferrer">View product ↗</a>
      <p class="direction">${escapeHtml(draft.creativeDirection)}</p>
      ${review}${publish}${reconcile}${publishedLink}
      ${draft.status === 'unknown' || draft.status === 'publishing' ? '<p class="attention">Delivery may be uncertain. Check Instagram before taking any further publishing action.</p>' : ''}
    </div>
  </article>`;
}

export async function GET(request: Request): Promise<Response> {
  if (!isOperator(request)) return unauthorized();
  try {
    const drafts = await listDrafts();
    const notice = new URL(request.url).searchParams.get('notice');
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Social approvals · OurCoordinates</title>
      <style>
        :root{color-scheme:light;font-family:Georgia,serif;color:#342a25;background:#f5f0ea}*{box-sizing:border-box}body{margin:0}header{padding:40px max(5vw,20px);background:#efe6dc;border-bottom:1px solid #d6c7ba}main{max-width:1200px;margin:auto;padding:36px 20px 80px}h1{font-weight:normal;font-size:clamp(2.3rem,6vw,4.5rem);margin:12px 0}h2{font-weight:normal;font-size:2rem;margin:8px 0}.eyebrow,.badge,.row,button,label{font-family:Arial,sans-serif}.eyebrow{text-transform:uppercase;letter-spacing:.24em;font-size:.72rem;color:#816d5f}.intro{font-size:1.1rem;line-height:1.6;max-width:690px}.toolbar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:32px}.card{display:grid;grid-template-columns:minmax(260px,40%) 1fr;background:#fff;border:1px solid #dfd3c8;margin:20px 0;overflow:hidden}.photo{background:#eae2d9;min-height:340px}.photo img{display:block;width:100%;height:100%;max-height:600px;object-fit:cover}.no-photo{padding:30px}.details{padding:30px}.row{display:flex;gap:15px;align-items:center;color:#826e60;font-size:.8rem}.badge{text-transform:uppercase;letter-spacing:.12em;font-size:.65rem;background:#efe6db;padding:8px 10px}.badge.approved{background:#e2eadf}.badge.published{background:#dae7db}.badge.unknown,.badge.failed{background:#f3e0d7}.direction{font-size:.9rem;line-height:1.55;color:#76685f}label{display:block;font-size:.8rem;margin:24px 0 8px}textarea{width:100%;min-height:230px;padding:15px;font:1rem/1.5 Arial,sans-serif;border:1px solid #cfc2b7;background:#fffcf8}.caption{white-space:pre-wrap;font:1rem/1.55 Arial,sans-serif;margin:24px 0}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}button{font-size:.85rem;padding:12px 17px;border:1px solid #56483d;background:transparent;color:#342a25;cursor:pointer}button.primary{background:#342a25;color:white}button:disabled{opacity:.45;cursor:not-allowed}a{color:#694e3e}form+form{margin-top:12px}.notice{padding:12px 16px;background:#e7ded2}.attention{color:#9a4327}@media(max-width:700px){.card{grid-template-columns:1fr}.photo{height:360px}.details{padding:22px}}
      </style></head><body><header><div class="eyebrow">OurCoordinates · private workspace</div><h1>Social approvals</h1><p class="intro">New and changed products become reviewable drafts. Approving a draft never publishes it; publishing is a separate action.</p></header><main>
      <div class="toolbar"><form method="post" action="/api/social/watch"><button type="submit">Check products now</button></form><span>${drafts.length} recent drafts · Instagram ${instagramConfigured() ? 'connected in configuration' : 'credentials pending'}</span></div>
      ${notice ? `<p class="notice">${escapeHtml(notice.slice(0, 100))}</p>` : ''}
      ${drafts.length ? drafts.map(card).join('') : '<p>No drafts yet. Check products to create the first pilot draft.</p>'}
      </main></body></html>`;
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'none'; img-src https:; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch {
    return new Response('Social approvals are not configured yet.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
