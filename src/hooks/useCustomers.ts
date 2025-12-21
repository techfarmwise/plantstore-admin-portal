import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customers';
import { CustomerSearchRequest, CustomerUpdateRequest, CustomerOnboardRequest } from '../types/api';

export const CUSTOMERS_QUERY_KEY = 'customers';

// Onboard new user
export const useOnboardUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerOnboardRequest) => customerService.onboardUser(data),
    onSuccess: () => {
      // Invalidate customers query to refresh data
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] });
    },
  });
};

// Search customers
export const useCustomerSearch = (request: CustomerSearchRequest, enabled: boolean = true) => {
  return useQuery({
    queryKey: [CUSTOMERS_QUERY_KEY, request],
    queryFn: () => customerService.searchCustomers(request),
    enabled,
  });
};

// Update customer
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, data }: { customerId: number; data: CustomerUpdateRequest }) =>
      customerService.updateCustomer(customerId, data),
    onSuccess: () => {
      // Invalidate customers query to refresh data
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] });
    },
  });
};
