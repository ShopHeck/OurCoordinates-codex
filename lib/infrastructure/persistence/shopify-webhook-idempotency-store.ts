import 'server-only';

const seenWebhookIds = new Set<string>();

export type RecordWebhookResult = {
  recorded: boolean;
};

export async function recordShopifyWebhookId(webhookId: string): Promise<RecordWebhookResult> {
  if (seenWebhookIds.has(webhookId)) {
    return { recorded: false };
  }

  seenWebhookIds.add(webhookId);
  return { recorded: true };
}
