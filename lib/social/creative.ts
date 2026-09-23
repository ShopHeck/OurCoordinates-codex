import type { SocialProduct } from './products';

export function draftCreative(product: SocialProduct): { caption: string; creativeDirection: string } {
  const caption = [
    'Some places stay with us.',
    '',
    'The first meeting. The journey home. The place you always return to.',
    '',
    `Explore ${product.title} at ${product.url}`,
    '',
    '#OurCoordinates #MeaningfulJewelry'
  ].join('\n');
  return {
    caption,
    creativeDirection:
      'Use the actual product photo for this first post. For a future editorial version: warm neutral palette, soft natural light, shallow depth of field, elegant jewelry styling, a subtle map or travel detail, and generous negative space. Confirm the engraving, metal, and product details against the linked product page before using new imagery.'
  };
}
