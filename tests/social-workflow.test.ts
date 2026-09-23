import assert from 'node:assert/strict';
import { test } from 'node:test';

import { connectedAccountRef, createSocial } from '@opencoredev/social-sdk';
import { MemoryIdempotencyStore, mockBackend } from '@opencoredev/social-sdk/testing';

import { isOperator, sameOrigin } from '../lib/social/auth';

test('the private approval endpoint requires owner credentials and a matching origin', () => {
  process.env.SOCIAL_ADMIN_PASSWORD = 'example-test-password';
  const url = 'https://social.ourcoordinates.com/api/social/drafts/123';
  const valid = `Basic ${Buffer.from('owner:example-test-password').toString('base64')}`;
  assert.equal(isOperator(new Request(url)), false);
  assert.equal(isOperator(new Request(url, { headers: { authorization: 'Basic ' + Buffer.from('owner:wrong').toString('base64') } })), false);
  assert.equal(isOperator(new Request(url, { headers: { authorization: valid } })), true);
  assert.equal(sameOrigin(new Request(url, { headers: { origin: 'https://attacker.example' } })), false);
  assert.equal(sameOrigin(new Request(url, { headers: { origin: 'https://social.ourcoordinates.com' } })), true);
  delete process.env.SOCIAL_ADMIN_PASSWORD;
});

test('the SDK keeps an image post pending until its destination confirms publication', async () => {
  const backend = mockBackend({ scenario: 'media-processing-then-success' });
  const social = createSocial({ backend, idempotencyStore: new MemoryIdempotencyStore() });
  const request = {
    targets: [{ account: connectedAccountRef({ backend: 'default', platform: 'instagram', accountId: 'ourcoordinates-test' }) }],
    content: { text: 'A place to remember', media: [{ kind: 'image' as const, source: { kind: 'https-url' as const, url: 'https://cdn.shopify.com/test.jpg' } }] },
    idempotencyKey: 'ourcoordinates:mock-test'
  };
  assert.equal(social.posts.prepare(request).ok, true);
  const first = await social.posts.publish(request);
  assert.equal(first.outcomes[0]?.state, 'processing');
  assert.ok(first.outcomes[0]?.delivery);
  backend.testing.advanceProcessing();
  const final = await social.posts.getDelivery(first.outcomes[0].delivery);
  assert.equal(final.state, 'published');
  if (final.state === 'published') assert.ok(final.post.postId);
});
