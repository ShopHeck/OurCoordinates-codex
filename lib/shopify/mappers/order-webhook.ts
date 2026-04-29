export type ShopifyOrderWebhookDto = {
  id?: number;
  admin_graphql_api_id?: string;
  order_number?: number;
  email?: string;
  currency?: string;
  total_price?: string;
  created_at?: string;
};

export type NormalizedOrderWebhook = {
  id: number;
  adminGraphqlApiId: string;
  orderNumber: number;
  email: string | null;
  currency: string | null;
  totalPrice: number;
  createdAt: string | null;
};

export function normalizeOrderWebhook(dto: ShopifyOrderWebhookDto): NormalizedOrderWebhook {
  return {
    id: dto.id ?? 0,
    adminGraphqlApiId: dto.admin_graphql_api_id ?? '',
    orderNumber: dto.order_number ?? 0,
    email: dto.email ?? null,
    currency: dto.currency ?? null,
    totalPrice: Number(dto.total_price ?? 0),
    createdAt: dto.created_at ?? null
  };
}
