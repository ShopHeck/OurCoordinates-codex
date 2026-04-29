import 'server-only';

import { env } from '@/lib/core/env';
import { err, ok, type AppError, type Result } from '@/lib/core/result';

type StorefrontRequestOptions<TVariables extends Record<string, unknown> = Record<string, unknown>> = {
  query: string;
  variables?: TVariables;
};

type ShopifyGraphQlResponse<TData> = {
  data?: TData;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
};

function buildStorefrontUrl(): string {
  return `https://${env.shopify.storeDomain}/api/${env.shopify.apiVersion}/graphql.json`;
}

function createStorefrontHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': env.shopify.storefrontAccessToken
  };
}

function mapStatusToError(status: number, fallback: string): AppError {
  if (status === 401) return { code: 'UNAUTHORIZED', message: fallback, status, retryable: false };
  if (status === 403) return { code: 'FORBIDDEN', message: fallback, status, retryable: false };
  if (status === 404) return { code: 'NOT_FOUND', message: fallback, status, retryable: false };
  if (status === 422) return { code: 'VALIDATION_ERROR', message: fallback, status, retryable: false };
  if (status === 429) return { code: 'RATE_LIMITED', message: fallback, status, retryable: true };
  if (status >= 500) return { code: 'UPSTREAM_ERROR', message: fallback, status, retryable: true };
  return { code: 'UNKNOWN_ERROR', message: fallback, status, retryable: false };
}

export async function storefrontRequest<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  options: StorefrontRequestOptions<TVariables>
): Promise<Result<TData>> {
  try {
    const response = await fetch(buildStorefrontUrl(), {
      method: 'POST',
      headers: createStorefrontHeaders(),
      body: JSON.stringify({ query: options.query, variables: options.variables ?? {} }),
      cache: 'no-store'
    });

    if (!response.ok) {
      return err(mapStatusToError(response.status, 'Storefront API request failed.'));
    }

    const payload = (await response.json()) as ShopifyGraphQlResponse<TData>;

    if (payload.errors?.length) {
      return err({
        code: 'UPSTREAM_ERROR',
        message: payload.errors[0]?.message ?? 'Storefront API returned GraphQL errors.',
        status: 502,
        retryable: true,
        context: {
          graphQlCode: payload.errors[0]?.extensions?.code
        }
      });
    }

    if (!payload.data) {
      return err({
        code: 'UNKNOWN_ERROR',
        message: 'Storefront API response did not include data.',
        status: 502,
        retryable: false
      });
    }

    return ok(payload.data);
  } catch {
    return err({ code: 'NETWORK_ERROR', message: 'Storefront API network failure.', status: 503, retryable: true });
  }
}
