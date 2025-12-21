import { apiClient } from './api';
import { 
  Stock, 
  AdjustmentReason, 
  AdjustmentCreateRequest, 
  AdjustmentResponse,
  Reservation,
  ReservationReleaseRequest,
  StockSearchRequest,
  StockSearchResponse
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
}

export const inventoryService = new InventoryService();
