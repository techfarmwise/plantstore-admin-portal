import { useEffect } from 'react';
import { authService } from '../services/auth';

export const useTokenRefresh = () => {
  useEffect(() => {
    // Since we're no longer doing proactive refresh based on JWT expiry,
    // we'll rely on the API client's 401 interceptor to handle token refresh
    // This hook can be used for other authentication-related side effects
    
    const validateAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          // Optionally, we could periodically validate the user session
          // by calling /customers/me to ensure the user is still valid
          console.log('User session is active');
        } catch (error) {
          console.error('Session validation failed:', error);
        }
      }
    };

    // Validate session on mount
    validateAuth();

    // Optional: Set up periodic session validation (every 5 minutes)
    const interval = setInterval(validateAuth, 300000);

    return () => clearInterval(interval);
  }, []);
};
