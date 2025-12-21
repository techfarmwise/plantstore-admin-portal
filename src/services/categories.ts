import { apiClient } from './api';
import { Category, CategoryCreateRequest, CategoryUpdateRequest } from '../types/api';

export class CategoryService {
  async getCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/catalog/categories');
  }

  async getCategory(categoryId: number): Promise<Category> {
    return apiClient.get<Category>(`/catalog/categories/${categoryId}`);
  }

  async createCategory(data: CategoryCreateRequest): Promise<Category> {
    return apiClient.post<Category>('/catalog/categories', data);
  }

  async updateCategory(categoryId: number, data: CategoryUpdateRequest): Promise<Category> {
    return apiClient.put<Category>(`/catalog/categories/${categoryId}`, data);
  }

  async deleteCategory(categoryId: number): Promise<void> {
    return apiClient.delete<void>(`/catalog/categories/${categoryId}`);
  }
}

export const categoryService = new CategoryService();
