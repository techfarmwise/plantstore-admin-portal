import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory';
import { 
  AdjustmentCreateRequest, 
  Reservation, 
  ReservationReleaseRequest,
  StockSearchRequest 
} from '../types/api';

export const STOCK_QUERY_KEY = 'stock';
export const STOCK_SEARCH_QUERY_KEY = 'stockSearch';
export const ADJUSTMENTS_QUERY_KEY = 'adjustments';
export const ADJUSTMENT_REASONS_QUERY_KEY = 'adjustmentReasons';

// Stock Queries
export const useStockByVariant = (variantId: number | null) => {
  return useQuery({
    queryKey: [STOCK_QUERY_KEY, 'variant', variantId],
    queryFn: () => inventoryService.getStockByVariant(variantId as number),
    enabled: !!variantId,
  });
};

export const useStockByWarehouse = (warehouseId: number | null) => {
  return useQuery({
    queryKey: [STOCK_QUERY_KEY, 'warehouse', warehouseId],
    queryFn: () => inventoryService.getStockByWarehouse(warehouseId as number),
    enabled: !!warehouseId,
  });
};

// Stock Search
export const useStockSearch = (request: StockSearchRequest, enabled: boolean = true) => {
  return useQuery({
    queryKey: [STOCK_SEARCH_QUERY_KEY, request],
    queryFn: () => inventoryService.searchStock(request),
    enabled: enabled && !!request.warehouseId,
  });
};

// Adjustments
export const useAdjustments = (params?: { 
  variantId?: number; 
  warehouseId?: number;
  since?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [ADJUSTMENTS_QUERY_KEY, params],
    queryFn: () => inventoryService.getAdjustments(params),
  });
};

// Adjustment Reasons
export const useAdjustmentReasons = () => {
  return useQuery({
    queryKey: [ADJUSTMENT_REASONS_QUERY_KEY],
    queryFn: () => inventoryService.getAdjustmentReasons(),
  });
};

// Stock Adjustments
export const useCreateAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdjustmentCreateRequest) => inventoryService.createAdjustment(data),
    onSuccess: () => {
      // Invalidate all stock queries and adjustments to refresh data
      queryClient.invalidateQueries({ queryKey: [STOCK_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STOCK_SEARCH_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADJUSTMENTS_QUERY_KEY] });
    },
  });
};

// Reservations
export const useCreateReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Reservation) => inventoryService.createReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STOCK_QUERY_KEY] });
    },
  });
};

export const useReleaseReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReservationReleaseRequest) => inventoryService.releaseReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STOCK_QUERY_KEY] });
    },
  });
};

export const useConsumeReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReservationReleaseRequest) => inventoryService.consumeReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STOCK_QUERY_KEY] });
    },
  });
};
