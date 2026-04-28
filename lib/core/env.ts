import 'server-only';

type RawEnv = {
  SHOPIFY_STORE_DOMAIN?: string;
  SHOPIFY_STOREFRONT_ACCESS_TOKEN?: string;
  SHOPIFY_ADMIN_ACCESS_TOKEN?: string;
  SHOPIFY_API_VERSION?: string;
  DATABASE_URL?: string;
};

type AppEnv = {
  shopify: {
    storeDomain: string;
    storefrontAccessToken: string;
    adminAccessToken: string;
    apiVersion: string;
  };
  database: {
    url: string;
  };
};

type HealthSnapshot = {
  shopify: {
    configured: boolean;
    storeDomainConfigured: boolean;
    storefrontAccessTokenConfigured: boolean;
    adminAccessTokenConfigured: boolean;
    apiVersionConfigured: boolean;
    apiVersionValid: boolean;
  };
  database: {
    configured: boolean;
    urlValid: boolean;
  };
};

function readRawEnv(): RawEnv {
  return {
    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    SHOPIFY_ADMIN_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    SHOPIFY_API_VERSION: process.env.SHOPIFY_API_VERSION,
    DATABASE_URL: process.env.DATABASE_URL
  };
}

function hasNonEmptyValue(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

function requireNonEmpty(value: string | undefined, key: keyof RawEnv): string {
  if (!hasNonEmptyValue(value)) {
    throw new Error(`[env] Missing required environment variable: ${key}`);
  }

  return value.trim();
}

function validateShopifyDomain(value: string): string {
  const trimmed = value.trim().toLowerCase();

  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(trimmed)) {
    throw new Error(
      `[env] Invalid SHOPIFY_STORE_DOMAIN value: "${value}". Expected a valid hostname such as "example.myshopify.com".`
    );
  }

  return trimmed;
}

function validateApiVersion(value: string): string {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    throw new Error(
      `[env] Invalid SHOPIFY_API_VERSION value: "${value}". Expected format "YYYY-MM" (for example "2025-10").`
    );
  }

  return value;
}

function validateUrl(value: string, key: keyof RawEnv): string {
  try {
    new URL(value);
  } catch {
    throw new Error(`[env] Invalid ${key} value: "${value}". Expected a valid URL.`);
  }

  return value;
}

export function parseAppEnv(source: RawEnv = readRawEnv()): AppEnv {
  const shopifyStoreDomain = validateShopifyDomain(
    requireNonEmpty(source.SHOPIFY_STORE_DOMAIN, 'SHOPIFY_STORE_DOMAIN')
  );
  const shopifyStorefrontAccessToken = requireNonEmpty(
    source.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    'SHOPIFY_STOREFRONT_ACCESS_TOKEN'
  );
  const shopifyAdminAccessToken = requireNonEmpty(
    source.SHOPIFY_ADMIN_ACCESS_TOKEN,
    'SHOPIFY_ADMIN_ACCESS_TOKEN'
  );
  const shopifyApiVersion = validateApiVersion(
    requireNonEmpty(source.SHOPIFY_API_VERSION, 'SHOPIFY_API_VERSION')
  );
  const databaseUrl = validateUrl(requireNonEmpty(source.DATABASE_URL, 'DATABASE_URL'), 'DATABASE_URL');

  return {
    shopify: {
      storeDomain: shopifyStoreDomain,
      storefrontAccessToken: shopifyStorefrontAccessToken,
      adminAccessToken: shopifyAdminAccessToken,
      apiVersion: shopifyApiVersion
    },
    database: {
      url: databaseUrl
    }
  };
}

export function getHealthSnapshot(source: RawEnv = readRawEnv()): HealthSnapshot {
  const storeDomainConfigured = hasNonEmptyValue(source.SHOPIFY_STORE_DOMAIN);
  const storefrontAccessTokenConfigured = hasNonEmptyValue(source.SHOPIFY_STOREFRONT_ACCESS_TOKEN);
  const adminAccessTokenConfigured = hasNonEmptyValue(source.SHOPIFY_ADMIN_ACCESS_TOKEN);
  const apiVersionConfigured = hasNonEmptyValue(source.SHOPIFY_API_VERSION);

  let apiVersionValid = false;
  if (apiVersionConfigured) {
    try {
      validateApiVersion(source.SHOPIFY_API_VERSION!.trim());
      apiVersionValid = true;
    } catch {
      apiVersionValid = false;
    }
  }

  const databaseConfigured = hasNonEmptyValue(source.DATABASE_URL);
  let databaseUrlValid = false;
  if (databaseConfigured) {
    try {
      validateUrl(source.DATABASE_URL!.trim(), 'DATABASE_URL');
      databaseUrlValid = true;
    } catch {
      databaseUrlValid = false;
    }
  }

  return {
    shopify: {
      configured:
        storeDomainConfigured && storefrontAccessTokenConfigured && adminAccessTokenConfigured && apiVersionValid,
      storeDomainConfigured,
      storefrontAccessTokenConfigured,
      adminAccessTokenConfigured,
      apiVersionConfigured,
      apiVersionValid
    },
    database: {
      configured: databaseConfigured && databaseUrlValid,
      urlValid: databaseUrlValid
    }
  };
}

export const env = parseAppEnv();

export type Env = typeof env;
export type { AppEnv, HealthSnapshot, RawEnv };
