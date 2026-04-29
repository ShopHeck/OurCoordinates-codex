export type ShopifyProductDto = {
  id?: string;
  handle?: string;
  title?: string;
  description?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
};

export type NormalizedProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor: string | null;
  productType: string | null;
  tags: string[];
};

export function normalizeProduct(dto: ShopifyProductDto): NormalizedProduct {
  return {
    id: dto.id ?? '',
    handle: dto.handle ?? '',
    title: dto.title ?? '',
    description: dto.description ?? '',
    vendor: dto.vendor ?? null,
    productType: dto.productType ?? null,
    tags: dto.tags ?? []
  };
}
