import { apiClient } from './api';
import {
  ProductSearchEngineRequest,
  ProductSearchEngineResponse,
  ProductSearchSuggestionResponse,
} from '../types/api';

class ProductSearchEngineService {
  async search(request: ProductSearchEngineRequest): Promise<ProductSearchEngineResponse> {
    const payload: ProductSearchEngineRequest = {
      ...request,
      page: Math.max(1, request.page ?? 1),
      pageSize: Math.min(50, Math.max(1, request.pageSize ?? 20)),
    };

    return apiClient.post<ProductSearchEngineResponse>('/product-search-engine/search', payload);
  }

  async suggest(query: string, limit = 10): Promise<ProductSearchSuggestionResponse> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    params.append('limit', limit.toString());
    return apiClient.get<ProductSearchSuggestionResponse>(`/product-search-engine/suggest?${params.toString()}`);
  }
}

export const productSearchEngineService = new ProductSearchEngineService();
