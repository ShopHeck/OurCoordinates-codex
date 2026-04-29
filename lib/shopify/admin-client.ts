import 'server-only';

import { env } from '@/lib/core/env';
import { err, ok, type AppError, type Result } from '@/lib/core/result';

type AdminRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ShopifyAdminRequestOptions<TBody extends Record<string, unknown> | undefined = undefined> = {
  path: string;
  method?: AdminRequestMethod;
  body?: TBody;
};

function buildAdminUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `https://${env.shopify.storeDomain}/admin/api/${env.shopify.apiVersion}${normalizedPath}`;
}

function createAdminHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': env.shopify.adminAccessToken
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

export async function adminRequest<TResponse, TBody extends Record<string, unknown> | undefined = undefined>(
  options: ShopifyAdminRequestOptions<TBody>
): Promise<Result<TResponse>> {
  try {
    const response = await fetch(buildAdminUrl(options.path), {
      method: options.method ?? 'GET',
      headers: createAdminHeaders(),
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: 'no-store'
    });

    if (!response.ok) {
      return err(mapStatusToError(response.status, 'Shopify Admin API request failed.'));
    }

    if (response.status === 204) {
      return ok({} as TResponse);
    }

    const payload = (await response.json()) as TResponse;
    return ok(payload);
  } catch {
    return err({ code: 'NETWORK_ERROR', message: 'Shopify Admin API network failure.', status: 503, retryable: true });
  }
}
