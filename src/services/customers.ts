import { apiClient } from './api';
import { 
  CustomerSearchRequest,
  CustomerSearchResponse,
  CustomerUpdateRequest,
  CustomerOnboardRequest,
  CustomerSearchItem
} from '../types/api';

class CustomerService {
  // Onboard new user (ADMIN only)
  async onboardUser(data: CustomerOnboardRequest): Promise<CustomerSearchItem> {
    console.log('👤 Onboarding new user:', data);
    return apiClient.post<CustomerSearchItem>('/admin/customers', data);
  }

  // Search customers
  async searchCustomers(request: CustomerSearchRequest): Promise<CustomerSearchResponse> {
    console.log('🔍 Searching customers:', request);
    return apiClient.post<CustomerSearchResponse>('/admin/customers/search', request);
  }

  // Update customer
  async updateCustomer(customerId: number, data: CustomerUpdateRequest): Promise<CustomerSearchItem> {
    console.log('✏️ Updating customer:', customerId, data);
    return apiClient.put<CustomerSearchItem>(`/admin/customers/${customerId}`, data);
  }
}

export const customerService = new CustomerService();
