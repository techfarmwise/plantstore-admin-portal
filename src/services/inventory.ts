import { apiClient } from './api';
import { 
  Stock, 
  AdjustmentReason, 
  AdjustmentCreateRequest, 
  AdjustmentResponse,
  Reservation,
  ReservationReleaseRequest,
  StockSearchRequest,
  StockSearchResponse,
  LowStockRequest,
  LowStockResponse,
  UpdateStockConfigRequest,
  StockConfigResponse
} from '../types/api';

class InventoryService {
  // Stock Queries
  async getStockByVariant(variantId: number): Promise<Stock[]> {
    return apiClient.get<Stock[]>(`/inventory/stock/variant/${variantId}`);
  }

  async getStockByWarehouse(warehouseId: number): Promise<Stock[]> {
    return apiClient.get<Stock[]>(`/inventory/stock/warehouse/${warehouseId}`);
  }

  // Stock Search
  async searchStock(request: StockSearchRequest): Promise<StockSearchResponse> {
    console.log('🔍 Searching stock:', request);
    return apiClient.post<StockSearchResponse>('/inventory/stock/search', request);
  }

  // Adjustment Reasons
  async getAdjustmentReasons(): Promise<AdjustmentReason[]> {
    return apiClient.get<AdjustmentReason[]>('/inventory/adjustments/reasons');
  }

  // Stock Adjustments
  async getAdjustments(params?: { 
    variantId?: number; 
    warehouseId?: number;
    since?: string; // ISO date-time
    limit?: number;
  }): Promise<AdjustmentResponse[]> {
    const queryParams = new URLSearchParams();
    if (params?.variantId) queryParams.append('variantId', params.variantId.toString());
    if (params?.warehouseId) queryParams.append('warehouseId', params.warehouseId.toString());
    if (params?.since) queryParams.append('since', params.since);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/inventory/adjustments?${queryString}` : '/inventory/adjustments';
    
    return apiClient.get<AdjustmentResponse[]>(url);
  }

  async createAdjustment(data: AdjustmentCreateRequest): Promise<AdjustmentResponse> {
    console.log('📦 Creating stock adjustment:', data);
    return apiClient.post<AdjustmentResponse>('/inventory/adjustments', data);
  }

  // Reservations
  async createReservation(data: Reservation): Promise<any> {
    console.log('🔒 Creating reservation:', data);
    return apiClient.post<any>('/inventory/reservations', data);
  }

  async releaseReservation(data: ReservationReleaseRequest): Promise<void> {
    console.log('🔓 Releasing reservation:', data);
    return apiClient.post<void>('/inventory/reservations/release', data);
  }

  async consumeReservation(data: ReservationReleaseRequest): Promise<void> {
    console.log('✅ Consuming reservation:', data);
    return apiClient.post<void>('/inventory/reservations/consume', data);
  }

  // Low Stock Alerts
  async getLowStock(params: LowStockRequest): Promise<LowStockResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('warehouseId', params.warehouseId.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.includeIgnored !== undefined) queryParams.append('includeIgnored', params.includeIgnored.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    
    const url = `/inventory/low-stock?${queryParams.toString()}`;
    
    console.log('⚠️ Fetching low stock items:', url);
    return apiClient.get<LowStockResponse>(url);
  }

  // Stock Configuration (Unified - threshold and ignore)
  async updateStockConfig(data: UpdateStockConfigRequest): Promise<StockConfigResponse> {
    console.log('🎯 Updating stock configuration:', data);
    return apiClient.put<StockConfigResponse>('/admin/stock/config', data);
  }
}

export const inventoryService = new InventoryService();
