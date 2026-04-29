export type ShopifyCartDto = {
  id?: string;
  checkoutUrl?: string;
  totalQuantity?: number;
  note?: string;
};

export type NormalizedCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  note: string | null;
};

export function normalizeCart(dto: ShopifyCartDto): NormalizedCart {
  return {
    id: dto.id ?? '',
    checkoutUrl: dto.checkoutUrl ?? '',
    totalQuantity: dto.totalQuantity ?? 0,
    note: dto.note ?? null
  };
}
