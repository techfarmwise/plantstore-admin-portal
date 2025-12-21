import { useQuery } from '@tanstack/react-query';
import { variantService } from '../services/variants';
import { VariantSearchLiteRequest } from '../types/api';

export const VARIANTS_SEARCH_LITE_QUERY_KEY = 'variantsSearchLite';

export const useVariantSearchLite = (request: VariantSearchLiteRequest, enabled: boolean = true) => {
  return useQuery({
    queryKey: [VARIANTS_SEARCH_LITE_QUERY_KEY, request],
    queryFn: () => variantService.searchLite(request),
    enabled: enabled && request.query.trim().length > 0,
    staleTime: 30000, // Cache for 30 seconds
  });
};
