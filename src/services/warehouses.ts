import { apiClient } from './api';
import { WarehouseCreateRequest, WarehouseResponse } from '../types/api';

export class WarehouseService {
  async getWarehouses(): Promise<WarehouseResponse[]> {
    return apiClient.get<WarehouseResponse[]>('/inventory/warehouses');
  }

  async getWarehouse(warehouseId: number): Promise<WarehouseResponse> {
    return apiClient.get<WarehouseResponse>(`/inventory/warehouses/${warehouseId}`);
  }

  async createWarehouse(data: WarehouseCreateRequest): Promise<WarehouseResponse> {
    return apiClient.post<WarehouseResponse>('/inventory/warehouses', data);
  }
}

export const warehouseService = new WarehouseService();
