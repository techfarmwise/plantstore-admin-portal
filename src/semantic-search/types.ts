import { ProductMediaType } from '../types/api';

export interface SemanticSearchFilters {
  price?: {
    gte?: number;
    lte?: number;
  };
  categoryPath?: string | string[];
  tags?: string | string[];
  'attributes.type'?: string | string[];
  'attributes.color'?: string;
  'attributes.size'?: string;
  inStock?: boolean;
}

export interface SemanticSearchRequest {
  query?: string;
  filters?: SemanticSearchFilters;
  from?: number;
  size?: number;
}

export interface SemanticSearchHitSource {
  documentId: number;
  productId?: number | null;
  variantId?: number | null;
  compositeId?: number | null;
  title: string;
  description?: string;
  categoryPath?: string[];
  tags?: string[];
  media?: Array<{
    mediaType: ProductMediaType;
    url: string;
    altText?: string;
    primary?: boolean;
    sortOrder?: number;
    metadata?: Record<string, string | number | boolean | null>;
  }>;
  primaryImageUrl?: string | null;
  primaryImageAlt?: string | null;
  price?: number | null;
  inStock?: boolean;
  attributes?: Record<string, string | number | boolean | null>;
}

export interface SemanticSearchHit {
  id: string;
  score: number;
  source: SemanticSearchHitSource;
}

export interface SemanticSearchResponse {
  total: number;
  hits: SemanticSearchHit[];
}

export interface SemanticAutocompleteSuggestion {
  text: string;
  source: 'title_autocomplete' | 'tags_autocomplete' | 'sku_autocomplete' | string;
  id: string;
  score: number;
  primaryImageUrl?: string | null;
  primaryImageAlt?: string | null;
}

export interface SemanticAutocompleteResponse {
  query: string;
  suggestions: SemanticAutocompleteSuggestion[];
}
