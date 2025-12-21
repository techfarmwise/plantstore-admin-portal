import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiError, TokenResponse } from '../types/api';

class ApiClient {
  private client: AxiosInstance;
  private baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const exemptPaths = ['/auth/login', '/auth/password/reset', '/auth/token/refresh'];
        const requestUrl = config.url || '';

        const isExempt = exemptPaths.some((path) => requestUrl.includes(path));

        if (!isExempt) {
          const token = localStorage.getItem('accessToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          } else if (config.headers.Authorization) {
            delete config.headers.Authorization;
          }
        } else if (config.headers.Authorization) {
          delete config.headers.Authorization;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Skip token refresh for login and password reset endpoints
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                               originalRequest.url?.includes('/auth/password/reset');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          originalRequest._retry = true;

          console.log('🔄 401 Error detected, attempting token refresh...');

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            const userId = localStorage.getItem('userId');

            console.log('🔑 Refresh token data:', { userId, refreshToken: refreshToken ? 'exists' : 'missing' });

            if (refreshToken && userId) {
              console.log('📡 Calling refresh token API...');
              const response = await this.refreshToken({
                userId: parseInt(userId),
                refreshToken,
              });

              console.log('✅ Token refresh successful:', { 
                hasAccessToken: !!response.accessToken,
                hasRefreshToken: !!response.refreshToken 
              });

              localStorage.setItem('accessToken', response.accessToken);
              localStorage.setItem('refreshToken', response.refreshToken);

              // Retry the original request
              originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
              console.log('🔄 Retrying original request with new token...');
              return this.client(originalRequest);
            } else {
              console.error('❌ Missing refresh token or userId');
              throw new Error('No refresh token available');
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            // Refresh failed, redirect to login
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(data: { userId: number; refreshToken: string }): Promise<TokenResponse> {
    console.log('🔄 Refresh token request:', { 
      url: `${this.baseURL}/auth/token/refresh`,
      userId: data.userId,
      refreshToken: data.refreshToken.substring(0, 10) + '...' // Log partial token for security
    });
    
    const response = await axios.post(`${this.baseURL}/auth/token/refresh`, data);
    
    console.log('🔄 Refresh token response:', {
      status: response.status,
      hasAccessToken: !!response.data?.accessToken,
      hasRefreshToken: !!response.data?.refreshToken
    });
    
    return response.data;
  }

  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url);
    return response.data;
  }

  // Error handler
  handleError(error: AxiosError): ApiError {
    if (error.response?.data) {
      return error.response.data as ApiError;
    }

    return {
      timestamp: new Date().toISOString(),
      status: error.response?.status || 500,
      error: 'Network Error',
      code: 'NETWORK_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: null,
      path: error.config?.url || '',
      traceId: '',
      spanId: '',
    };
  }
}

export const apiClient = new ApiClient();
