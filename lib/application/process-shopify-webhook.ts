import 'server-only';

export type ShopifyWebhookContext = {
  topic: string;
  shopDomain: string;
  webhookId: string;
};

export type ProcessShopifyWebhookInput = {
  context: ShopifyWebhookContext;
  payload: unknown;
};

export async function processShopifyWebhook({ context }: ProcessShopifyWebhookInput): Promise<void> {
  // Intentionally minimal initial behavior; handlers can be expanded per topic.
  console.info('[shopify-webhook] processed', {
    topic: context.topic,
    shopDomain: context.shopDomain,
    webhookId: context.webhookId
  });
}
