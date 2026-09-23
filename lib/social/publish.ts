import 'server-only';

import { connectedAccountRef, createSocial, type DeliveryOutcome } from '@opencoredev/social-sdk';
import { instagram } from '@opencoredev/social-sdk/instagram';

import { claimForPublish, getDraft, postgresIdempotencyStore, postgresInstagramWorkflows, saveDelivery, type DraftStatus } from './store';

function credentials() {
  const accessToken = process.env.SOCIAL_INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.SOCIAL_INSTAGRAM_ACCOUNT_ID;
  if (!accessToken || !accountId) throw new Error('Instagram publishing credentials are not configured');
  return { accessToken, accountId };
}

export function instagramConfigured(): boolean {
  return Boolean(process.env.SOCIAL_INSTAGRAM_ACCESS_TOKEN && process.env.SOCIAL_INSTAGRAM_ACCOUNT_ID);
}

function client() {
  const auth = credentials();
  return createSocial({
    backend: instagram({ auth, workflowStore: postgresInstagramWorkflows }),
    idempotencyStore: postgresIdempotencyStore
  });
}

function deliveryStatus(outcome: DeliveryOutcome): DraftStatus {
  if (outcome.state === 'published') return 'published';
  if (outcome.state === 'accepted' || outcome.state === 'processing' || outcome.state === 'scheduled') return 'pending';
  if (outcome.state === 'unknown') return 'unknown';
  return 'failed';
}

export async function publishApprovedDraft(id: string) {
  const social = client();
  const candidate = await getDraft(id);
  if (!candidate || candidate.status !== 'approved') throw new Error('Draft is not approved');
  if (!candidate.product.imageUrl) throw new Error('Product has no image to publish');
  const auth = credentials();
  const request = {
    targets: [{ account: connectedAccountRef({ backend: 'default', platform: 'instagram', accountId: auth.accountId }) }],
    content: {
      text: candidate.caption,
      media: [{ kind: 'image' as const, source: { kind: 'https-url' as const, url: candidate.product.imageUrl } }]
    },
    idempotencyKey: `ourcoordinates:${id}`
  };
  const prepared = social.posts.prepare(request);
  if (!prepared.ok) throw new Error(`Social SDK rejected this draft: ${prepared.issues.map(issue => issue.message).join('; ')}`);
  const claimed = await claimForPublish(id);
  if (!claimed) throw new Error('Draft was already submitted or changed');
  try {
    const result = await social.posts.publish(request, { authorization: { tenantId: 'ourcoordinates', principalId: 'owner' } });
    const outcome = result.outcomes[0];
    if (!outcome) throw new Error('Social SDK returned no delivery outcome');
    await saveDelivery(id, deliveryStatus(outcome), outcome);
  } catch {
    // The provider might have accepted the post before a timeout. Never retry this automatically.
    await saveDelivery(id, 'unknown', null);
  }
  return getDraft(id);
}

export async function reconcileDraft(id: string) {
  const draft = await getDraft(id);
  if (!draft || !['pending', 'unknown'].includes(draft.status) || !draft.outcome?.delivery) {
    throw new Error('No pending delivery is available for reconciliation');
  }
  const outcome = await client().posts.getDelivery(draft.outcome.delivery, {
    authorization: { tenantId: 'ourcoordinates', principalId: 'owner' }
  });
  await saveDelivery(id, deliveryStatus(outcome), outcome);
  return getDraft(id);
}
