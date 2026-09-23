import { isOperator, sameOrigin, unauthorized } from '@/lib/social/auth';
import { publishApprovedDraft, reconcileDraft } from '@/lib/social/publish';
import { getDraft, updateReview } from '@/lib/social/store';

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!isOperator(request)) return unauthorized();
  if (!sameOrigin(request)) return new Response('Invalid request origin', { status: 403 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Invalid draft ID', { status: 400 });
  const form = await request.formData();
  const action = form.get('action');
  try {
    if (action === 'publish') {
      const result = await publishApprovedDraft(id);
      return Response.redirect(new URL(`/social?notice=${encodeURIComponent(`Instagram delivery: ${result?.status ?? 'unknown'}`)}`, request.url), 303);
    }
    if (action === 'reconcile') {
      const result = await reconcileDraft(id);
      return Response.redirect(new URL(`/social?notice=${encodeURIComponent(`Delivery: ${result?.status ?? 'unknown'}`)}`, request.url), 303);
    }
    if (action !== 'save' && action !== 'approve' && action !== 'reject') return new Response('Invalid action', { status: 400 });
    const previous = await getDraft(id);
    if (!previous) return new Response('Draft not found', { status: 404 });
    const caption = form.get('caption');
    if (action !== 'reject' && (typeof caption !== 'string' || caption.trim().length < 1 || caption.length > 2200)) {
      return new Response('Caption must be 1–2,200 characters', { status: 400 });
    }
    const saved = await updateReview(id, action, action === 'reject' ? previous.caption : String(caption).trim());
    if (!saved) return new Response('Draft has already changed; reload the review page', { status: 409 });
    return Response.redirect(new URL(`/social?notice=${action}`, request.url), 303);
  } catch {
    return new Response('Action could not be completed. Check the application logs, then reload the draft.', { status: 503 });
  }
}
