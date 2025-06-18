import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if exists
api.interceptors.request.use(
  (config) => {
    // Add auth token to request if it exists
    const authData = localStorage.getItem('zerodha_mcp_auth');
    if (authData) {
      const { token } = JSON.parse(authData);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle successful responses
    return response.data;
  },
  (error: AxiosError) => {
    // Handle errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      // Handle 401 Unauthorized
      if (status === 401) {
        // Clear auth data and redirect to login
        localStorage.removeItem('zerodha_mcp_auth');
        window.location.href = '/login';
        return Promise.reject({ message: 'Session expired. Please log in again.' });
      }
      
      // Handle 429 Too Many Requests
      if (status === 429) {
        toast.error('Rate limit exceeded. Please try again later.');
        return Promise.reject({ message: 'Rate limit exceeded' });
      }
      
      // Handle other errors
      const errorMessage = (data as any)?.error?.message || error.message;
      return Promise.reject({ message: errorMessage });
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject({ message: 'No response from server. Please check your connection.' });
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject({ message: error.message });
    }
  }
);

// API methods
export const rpcRequest = async <T = any>(
  method: string,
  params: Record<string, any> = {},
  config: AxiosRequestConfig = {}
): Promise<T> => {
  try {
    const response = await api.post('/rpc', {
      jsonrpc: '2.0',
      method,
      params,
      id: Math.random().toString(36).substring(7),
    }, config);
    
    // Handle JSON-RPC error responses
    if (response.error) {
      throw new Error(response.error.message || 'RPC call failed');
    }
    
    return response.result;
  } catch (error) {
    console.error(`RPC call ${method} failed:`, error);
    throw error;
  }
};

// Helper function to handle paginated responses
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
  };
}

export const fetchPaginated = async <T = any>(
  method: string,
  params: Record<string, any> = {},
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<T>> => {
  const result = await rpcRequest<{
    data: T[];
    total: number;
    page: number;
    per_page: number;
  }>(method, {
    ...params,
    page,
    per_page: perPage,
  });
  
  return {
    data: result.data,
    pagination: {
      total: result.total,
      page: result.page,
      per_page: result.per_page,
      has_more: result.page * result.per_page < result.total,
    },
  };
};

// Export the axios instance in case it's needed directly
export default api;
