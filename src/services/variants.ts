import { apiClient } from './api';
import { VariantSearchLiteRequest, VariantSearchLiteResponse } from '../types/api';

class VariantService {
  async searchLite(request: VariantSearchLiteRequest): Promise<VariantSearchLiteResponse> {
    console.log('🔍 Searching variants (lite):', request);
    return apiClient.post<VariantSearchLiteResponse>('/catalog/variants/search-lite', {
      query: request.query,
      limit: request.limit || 10,
      offset: request.offset || 0,
    });
  }
}

export const variantService = new VariantService();
