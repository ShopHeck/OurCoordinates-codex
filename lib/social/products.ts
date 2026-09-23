import 'server-only';

import { createHash } from 'node:crypto';

import { storefrontRequest } from '@/lib/shopify/storefront-client';

export type SocialProduct = {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  imageAlt: string | null;
  price: string;
  currency: string;
  fingerprint: string;
};

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  description: string;
  onlineStoreUrl: string | null;
  featuredImage: { url: string; altText: string | null } | null;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
};

type ProductsPage = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: ProductNode[];
  };
};

export const PRODUCTS_QUERY = `
  query SocialProducts($after: String) {
    products(first: 100, after: $after, sortKey: UPDATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id handle title description onlineStoreUrl
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  }
`;

function storeUrl(node: ProductNode): string {
  const configured = new URL(process.env.SOCIAL_STORE_URL ?? 'https://ourcoordinates.com');
  if (configured.protocol !== 'https:' || configured.hostname !== 'ourcoordinates.com') {
    throw new Error('SOCIAL_STORE_URL must use https://ourcoordinates.com');
  }
  const url = node.onlineStoreUrl ? new URL(node.onlineStoreUrl) : new URL(`/products/${node.handle}`, configured);
  if (url.protocol !== 'https:' || url.hostname !== 'ourcoordinates.com') {
    return new URL(`/products/${node.handle}`, configured).toString();
  }
  return url.toString();
}

export function normalizeProduct(node: ProductNode): SocialProduct {
  const imageUrl = node.featuredImage?.url ?? null;
  if (imageUrl && new URL(imageUrl).protocol !== 'https:') {
    throw new Error(`Product ${node.id} has an unsafe image URL`);
  }
  const product = {
    id: node.id,
    title: node.title.trim(),
    description: node.description.trim(),
    url: storeUrl(node),
    imageUrl,
    imageAlt: node.featuredImage?.altText ?? null,
    price: node.priceRange.minVariantPrice.amount,
    currency: node.priceRange.minVariantPrice.currencyCode
  };
  return {
    ...product,
    fingerprint: createHash('sha256').update(JSON.stringify(product)).digest('hex')
  };
}

export async function listPublishedProducts(): Promise<SocialProduct[]> {
  const products: SocialProduct[] = [];
  let after: string | null = null;
  for (let page = 0; page < 20; page += 1) {
    const result: Awaited<ReturnType<typeof storefrontRequest<ProductsPage, { after: string | null }>>> =
      await storefrontRequest<ProductsPage, { after: string | null }>({
        query: PRODUCTS_QUERY,
        variables: { after }
      });
    if (!result.ok) throw new Error(`Storefront product fetch failed: ${result.error.code}`);
    products.push(...result.data.products.nodes.map(normalizeProduct));
    const pageInfo: ProductsPage['products']['pageInfo'] = result.data.products.pageInfo;
    if (!pageInfo.hasNextPage) return products;
    const nextCursor: string | null = pageInfo.endCursor;
    if (!nextCursor || nextCursor === after) throw new Error('Shopify product pagination stalled');
    after = nextCursor;
  }
  throw new Error('Product scan exceeded 2,000 items; refusing a partial comparison');
}
