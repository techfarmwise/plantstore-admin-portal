import { apiClient } from './api';
import { 
  LoginRequest, 
  TokenResponse, 
  LogoutRequest, 
  User, 
  UserRole, 
  CustomerMeResponse,
  PasswordResetRequestPayload,
  PasswordResetRequestResponse,
  PasswordResetVerifyPayload,
  PasswordResetVerifyResponse,
  PasswordResetConfirmPayload
} from '../types/api';

export class AuthService {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    // Step 1: Get tokens from login API
    const tokenResponse = await apiClient.post<TokenResponse>('/auth/login/password', credentials);
    
    // Step 2: Store tokens in localStorage
    localStorage.setItem('accessToken', tokenResponse.accessToken);
    localStorage.setItem('refreshToken', tokenResponse.refreshToken);
    
    // Step 3: Get user details from /customers/me API
    try {
      const userDetails = await this.getCurrentUserFromAPI();
      console.log('User details from API:', userDetails);
      
      // Store user info in localStorage
      localStorage.setItem('userId', userDetails.customerId.toString());
      localStorage.setItem('userRole', userDetails.roles[0]); // Use first role
      localStorage.setItem('userEmail', userDetails.email || userDetails.phone || 'Unknown'); // Fallback to phone if email is null
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      // Clear tokens if we can't get user details
      this.clearSession();
      throw new Error('Failed to fetch user details after login');
    }
    
    return tokenResponse;
  }

  async getCurrentUserFromAPI(): Promise<CustomerMeResponse> {
    return apiClient.get<CustomerMeResponse>('/customers/me');
  }

  async refreshToken(): Promise<TokenResponse> {
    const userId = localStorage.getItem('userId');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!userId || !refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<TokenResponse>('/auth/token/refresh', {
      userId: parseInt(userId),
      refreshToken,
    });

    // Update stored tokens
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);

    return response;
  }

  async logout(): Promise<void> {
    const userId = localStorage.getItem('userId');
    const refreshToken = localStorage.getItem('refreshToken');

    if (userId && refreshToken) {
      try {
        await apiClient.post<void>('/auth/logout', {
          userId: parseInt(userId),
          refreshToken,
        });
      } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API call failed:', error);
      }
    }

    this.clearSession();
  }

  clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const userEmail = localStorage.getItem('userEmail');
    
    // Check if we have all required authentication data
    return !!(token && userId && userRole && userEmail);
  }

  getCurrentUser(): User | null {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole') as UserRole;
    const userEmail = localStorage.getItem('userEmail');

    if (!userId || !userRole || !userEmail) {
      return null;
    }

    return {
      id: parseInt(userId),
      email: userEmail,
      role: userRole,
    };
  }

  getUserRole(): UserRole | null {
    return localStorage.getItem('userRole') as UserRole | null;
  }

  hasRole(role: UserRole): boolean {
    const userRole = this.getUserRole();
    if (!userRole) return false;

    // ADMIN has access to everything
    if (userRole === 'ADMIN') return true;

    return userRole === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  // Password Reset Methods
  async requestPasswordReset(payload: PasswordResetRequestPayload): Promise<PasswordResetRequestResponse> {
    return apiClient.post<PasswordResetRequestResponse>('/auth/password/reset/request', payload);
  }

  async verifyPasswordResetOtp(payload: PasswordResetVerifyPayload): Promise<PasswordResetVerifyResponse> {
    return apiClient.post<PasswordResetVerifyResponse>('/auth/password/reset/verify', payload);
  }

  async confirmPasswordReset(payload: PasswordResetConfirmPayload): Promise<void> {
    return apiClient.post<void>('/auth/password/reset/confirm', payload);
  }

}

export const authService = new AuthService();
