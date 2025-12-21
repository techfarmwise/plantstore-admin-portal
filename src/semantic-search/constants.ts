import { SemanticSearchHitSource } from './types';

export const POPULAR_SEARCHES: string[] = [
  'snake plant',
  'money plant',
  'peace lily',
  'bonsai',
  'desk planters',
  'air purifying',
  'succulent',
  'orchid',
];

export interface FilterOption {
  label: string;
  value: string;
}

export const PRODUCT_TYPE_FILTERS: FilterOption[] = [
  { label: 'Plant', value: 'plant' },
  { label: 'Self-Watering Plant 8 Inch', value: 'self-watering-8in' },
  { label: 'Self-Watering Plant Aura', value: 'self-watering-aura' },
  { label: 'Planter', value: 'planter' },
];

export const CATEGORY_FILTERS: FilterOption[] = [
  { label: 'Indoor', value: 'indoor' },
  { label: 'Outdoor', value: 'outdoor' },
  { label: 'Desk', value: 'desk' },
  { label: 'Hanging', value: 'hanging' },
];

export const TAG_FILTERS: FilterOption[] = [
  { label: 'Air Purifying', value: 'air-purifying' },
  { label: 'Pet Friendly', value: 'pet-friendly' },
  { label: 'Low Light', value: 'low-light' },
  { label: 'Beginner', value: 'beginner' },
];

export interface TrendingProductTeaser {
  id: string;
  title: string;
  price?: number;
  mediaUrl?: string;
  mediaAlt?: string;
}

export const TRENDING_PRODUCTS: TrendingProductTeaser[] = [
  {
    id: 'trend-fern',
    title: 'Golden Fern with Self-Watering Pot',
    price: 799,
    mediaUrl: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=480&q=80',
    mediaAlt: 'Golden fern plant on a table',
  },
  {
    id: 'trend-succulent',
    title: 'Minimalist Succulent Duo',
    price: 499,
    mediaUrl: 'https://images.unsplash.com/photo-1501004318641-3113c456d42b?auto=format&fit=crop&w=480&q=80',
    mediaAlt: 'Succulent plants in white pots',
  },
  {
    id: 'trend-monstera',
    title: 'Monstera Deliciosa XL',
    price: 2199,
    mediaUrl: 'https://images.unsplash.com/photo-1501004318641-b6bbd81b2992?auto=format&fit=crop&w=480&q=80',
    mediaAlt: 'Large monstera plant by a window',
  },
];

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

export const mapHitToTeaser = (hit: SemanticSearchHitSource) => ({
  id: String(hit.documentId),
  title: hit.title,
  price: hit.price ?? undefined,
  mediaUrl: hit.primaryImageUrl ?? hit.media?.find((m) => m.primary)?.url,
  mediaAlt: hit.primaryImageAlt ?? hit.media?.find((m) => m.primary)?.altText ?? hit.title,
});
