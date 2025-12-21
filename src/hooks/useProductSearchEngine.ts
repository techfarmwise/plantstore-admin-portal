import { useQuery } from '@tanstack/react-query';
import { productSearchEngineService } from '../services/productSearchEngine';
import { ProductSearchEngineRequest } from '../types/api';

export const PRODUCT_SEARCH_ENGINE_QUERY_KEY = 'product-search-engine';
export const PRODUCT_SEARCH_ENGINE_SUGGESTIONS_KEY = 'product-search-engine-suggestions';

export const useProductSearchEngine = (
  request: ProductSearchEngineRequest,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: [PRODUCT_SEARCH_ENGINE_QUERY_KEY, request],
    queryFn: () => productSearchEngineService.search(request),
    enabled,
  });
};

export const useProductSearchSuggestions = (query: string, limit = 8) => {
  const trimmedQuery = query.trim();
  return useQuery({
    queryKey: [PRODUCT_SEARCH_ENGINE_SUGGESTIONS_KEY, trimmedQuery, limit],
    queryFn: () => productSearchEngineService.suggest(trimmedQuery, limit),
    enabled: trimmedQuery.length > 1,
    staleTime: 60 * 1000,
  });
};
