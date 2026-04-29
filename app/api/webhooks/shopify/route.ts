import { createHmac, timingSafeEqual } from 'node:crypto';

import { processShopifyWebhook } from '@/lib/application/process-shopify-webhook';
import { recordShopifyWebhookId } from '@/lib/infrastructure/persistence/shopify-webhook-idempotency-store';

const SHOPIFY_TOPIC_HEADER = 'x-shopify-topic';
const SHOPIFY_SHOP_DOMAIN_HEADER = 'x-shopify-shop-domain';
const SHOPIFY_WEBHOOK_ID_HEADER = 'x-shopify-webhook-id';
const SHOPIFY_HMAC_HEADER = 'x-shopify-hmac-sha256';

class RetryableWebhookError extends Error {}

type RouteContext = {
  topic: string;
  shopDomain: string;
  webhookId: string;
};

type TopicHandler = (args: { context: RouteContext; payload: unknown }) => Promise<void>;

const topicHandlers: Record<string, TopicHandler> = {
  '*': async ({ context, payload }) => {
    await processShopifyWebhook({ context, payload });
  }
};

function jsonResponse(status: number, data: Record<string, unknown>): Response {
  return Response.json(data, { status });
}

function readRequiredHeader(headers: Headers, key: string): string {
  const value = headers.get(key)?.trim();

  if (!value) {
    throw new Error(`Missing required header: ${key}`);
  }

  return value;
}

function verifyHmac(rawBody: string, providedHmac: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new RetryableWebhookError('SHOPIFY_WEBHOOK_SECRET is not configured');
  }

  const digest = createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');

  const provided = Buffer.from(providedHmac, 'utf8');
  const expected = Buffer.from(digest, 'utf8');

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}

function resolveTopicHandler(topic: string): TopicHandler {
  return topicHandlers[topic] ?? topicHandlers['*'];
}

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();

  let payload: unknown;
  try {
    payload = rawBody.length ? JSON.parse(rawBody) : {};
  } catch {
    return jsonResponse(400, {
      ok: false,
      retryable: false,
      error: 'invalid_payload',
      message: 'Webhook body must be valid JSON.'
    });
  }

  let context: RouteContext;
  try {
    context = {
      topic: readRequiredHeader(request.headers, SHOPIFY_TOPIC_HEADER),
      shopDomain: readRequiredHeader(request.headers, SHOPIFY_SHOP_DOMAIN_HEADER),
      webhookId: readRequiredHeader(request.headers, SHOPIFY_WEBHOOK_ID_HEADER)
    };
  } catch (error) {
    return jsonResponse(400, {
      ok: false,
      retryable: false,
      error: 'missing_required_headers',
      message: error instanceof Error ? error.message : 'Missing required Shopify headers.'
    });
  }

  const providedHmac = request.headers.get(SHOPIFY_HMAC_HEADER)?.trim();
  if (!providedHmac) {
    return jsonResponse(401, {
      ok: false,
      retryable: false,
      error: 'missing_hmac_signature',
      message: `Missing required header: ${SHOPIFY_HMAC_HEADER}`
    });
  }

  try {
    if (!verifyHmac(rawBody, providedHmac)) {
      return jsonResponse(401, {
        ok: false,
        retryable: false,
        error: 'invalid_hmac_signature',
        message: 'Webhook signature verification failed.'
      });
    }

    const idempotencyResult = await recordShopifyWebhookId(context.webhookId);
    if (!idempotencyResult.recorded) {
      return jsonResponse(200, {
        ok: true,
        duplicate: true,
        retryable: false,
        message: 'Webhook already processed.'
      });
    }

    const handler = resolveTopicHandler(context.topic);
    await handler({ context, payload });

    return jsonResponse(200, {
      ok: true,
      duplicate: false,
      retryable: false,
      message: 'Webhook accepted.'
    });
  } catch (error) {
    const retryable = error instanceof RetryableWebhookError;

    return jsonResponse(retryable ? 503 : 500, {
      ok: false,
      retryable,
      error: retryable ? 'temporary_webhook_error' : 'webhook_processing_failed',
      message: error instanceof Error ? error.message : 'Unknown webhook processing failure.'
    });
  }
}
