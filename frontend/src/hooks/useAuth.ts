import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation,  useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface User {
  user_id: string;
  user_name: string;
  email: string;
  // Add other user properties as needed
}

interface LoginResponse {
  login_url: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AUTH_STORAGE_KEY = 'zerodha_mcp_auth';

// Helper function to store auth data in localStorage
const setStoredAuth = (data: { user: User; token: string }) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
};

// Helper function to get stored auth data
const getStoredAuth = (): { user: User; token: string } | null => {
  const data = localStorage.getItem(AUTH_STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

// Helper function to clear auth data
const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

// Custom hook for authentication
const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => !!user, [user]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedAuth = getStoredAuth();
    if (storedAuth) {
      setUser(storedAuth.user);
      // Here you would typically validate the token with the server
    }
    setIsLoading(false);
  }, []);

  // Mutation for initiating login
  const loginMutation = useMutation<LoginResponse, Error, void>({
    mutationFn: async () => {
    const response = await fetch('/rpc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'login',
        params: {},
      }),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return response.json();
  },
    onSuccess: (data) => {
      // Open the login URL in a new tab/window
      if (data.login_url) {
        window.open(data.login_url, '_blank');
      }
    },
    onError: (error) => {
      toast.error(`Login failed: ${error.message}`);
    },
  });

  // Function to initiate login
  const login = useCallback(async () => {
    try {
      await loginMutation.mutateAsync();
    } catch (error) {
      console.error('Login error:', error);
    }
  }, [loginMutation]);

  // Function to handle successful login
  const _handleLoginSuccess = useCallback(
    (userData: User, token: string) => {
      setUser(userData);
      setStoredAuth({ user: userData, token });
      queryClient.clear(); // Clear any cached queries
      navigate('/');
    },
    [navigate, queryClient]
  );

  // Function to logout
  const logout = useCallback(() => {
    setUser(null);
    clearStoredAuth();
    queryClient.clear();
    navigate('/login');
  }, [navigate, queryClient]);

  // Function to check authentication status
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      // Here you would typically validate the token with the server
      const storedAuth = getStoredAuth();
      if (!storedAuth) {
        return false;
      }
      
      // For now, just return true if we have a stored token
      // In a real app, you would validate this token with the server
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }, []);

  // Set up WebSocket message listener for login success
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY && event.newValue) {
        const authData = JSON.parse(event.newValue);
        setUser(authData.user);
      } else if (event.key === AUTH_STORAGE_KEY && !event.newValue) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  };
};

export default useAuth;
