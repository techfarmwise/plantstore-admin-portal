import { apiClient } from './api';
import { CompositeResponse, CompositeCreateRequest, CompositeSearchRequest, CompositeSearchResponse } from '../types/api';

class CompositeService {
  async getComposites(): Promise<CompositeResponse[]> {
    return apiClient.get<CompositeResponse[]>('/catalog/composites');
  }

  async searchComposites(request: CompositeSearchRequest): Promise<CompositeSearchResponse> {
    console.log('🔍 Searching composites:', request);
    return apiClient.post<CompositeSearchResponse>('/catalog/composites/search', request);
  }

  async getComposite(compositeId: number): Promise<CompositeResponse> {
    return apiClient.get<CompositeResponse>(`/catalog/composites/${compositeId}`);
  }

  async createComposite(data: CompositeCreateRequest): Promise<CompositeResponse> {
    return apiClient.post<CompositeResponse>('/catalog/composites', data);
  }

  async updateComposite(compositeId: number, data: CompositeCreateRequest): Promise<CompositeResponse> {
    return apiClient.put<CompositeResponse>(`/catalog/composites/${compositeId}`, data);
  }

  async deleteComposite(compositeId: number): Promise<void> {
    return apiClient.delete<void>(`/catalog/composites/${compositeId}`);
  }
}

export const compositeService = new CompositeService();
