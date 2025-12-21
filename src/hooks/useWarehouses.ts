import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseService } from '../services/warehouses';
import { WarehouseCreateRequest } from '../types/api';

export const WAREHOUSES_QUERY_KEY = 'warehouses';

export const useWarehouses = () => {
  return useQuery({
    queryKey: [WAREHOUSES_QUERY_KEY],
    queryFn: () => warehouseService.getWarehouses(),
  });
};

export const useWarehouse = (warehouseId: number) => {
  return useQuery({
    queryKey: [WAREHOUSES_QUERY_KEY, warehouseId],
    queryFn: () => warehouseService.getWarehouse(warehouseId),
    enabled: !!warehouseId,
  });
};

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WarehouseCreateRequest) => warehouseService.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WAREHOUSES_QUERY_KEY] });
    },
  });
};
