import { isOperator, isWatcher, sameOrigin, unauthorized } from '@/lib/social/auth';
import { listPublishedProducts } from '@/lib/social/products';
import { isWatchDue, markWatchComplete, observeProducts } from '@/lib/social/store';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  const operator = isOperator(request);
  if (!isWatcher(request) && !operator) return unauthorized();
  if (operator && !sameOrigin(request)) return new Response('Invalid request origin', { status: 403 });
  try {
    if (!operator && !(await isWatchDue())) return Response.json({ ok: true, skipped: 'Checked within the last 48 hours' });
    const result = await observeProducts(await listPublishedProducts());
    await markWatchComplete();
    if (operator) return Response.redirect(new URL(`/social?notice=${encodeURIComponent(`${result.drafted} new drafts from ${result.scanned} products`)}`, request.url), 303);
    return Response.json({ ok: true, ...result });
  } catch {
    return Response.json({ ok: false, error: 'Product scan failed; baseline was preserved.' }, { status: 503 });
  }
}
