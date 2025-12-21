import { apiClient } from './api';
import { ProductCreateRequest, ProductResponse, ProductSearchRequest, ProductSearchResponse } from '../types/api';

export class ProductService {
  async getProducts(): Promise<ProductResponse[]> {
    return apiClient.get<ProductResponse[]>('/catalog/products');
  }

  async searchProducts(request: ProductSearchRequest): Promise<ProductSearchResponse> {
    console.log('🔍 Searching products:', request);
    return apiClient.post<ProductSearchResponse>('/catalog/products/search', request);
  }

  async getProduct(productId: number): Promise<ProductResponse> {
    return apiClient.get<ProductResponse>(`/catalog/products/${productId}`);
  }

  async createProduct(data: ProductCreateRequest): Promise<ProductResponse> {
    return apiClient.post<ProductResponse>('/catalog/products', data);
  }

  async updateProduct(productId: number, data: Partial<ProductCreateRequest>): Promise<ProductResponse> {
    console.log('🔄 Calling PUT API for product update:', {
      productId,
      url: `/catalog/products/${productId}`,
      data
    });
    return apiClient.put<ProductResponse>(`/catalog/products/${productId}`, data);
  }

  async deleteProduct(productId: number): Promise<void> {
    return apiClient.delete<void>(`/catalog/products/${productId}`);
  }
}

export const productService = new ProductService();
