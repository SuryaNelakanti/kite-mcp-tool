import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:3001/api', // This will be proxied to the backend
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for cookies if using sessions
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

// Define response types
interface RpcResponse<T = any> {
  jsonrpc: string;
  id?: string | number | null;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse<RpcResponse>) => {
    const { data } = response;
    
    // Handle RPC error responses
    if (data && data.error) {
      const error = new Error(data.error.message || 'RPC Error');
      (error as any).code = data.error.code;
      (error as any).data = data.error.data;
      return Promise.reject(error);
    }
    
    // Return the result for successful responses
    return data.result || data;
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
export async function rpcRequest<T = any>(
  method: string,
  params: Record<string, any> = {},
  config: AxiosRequestConfig = {}
): Promise<T> {
  try {
    const response = await api.post<RpcResponse<T>>('rpc', {
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now(),
    }, config);

    // The response interceptor will handle RPC errors
    return response as unknown as T;
  } catch (error) {
    console.error('RPC Request failed:', error);
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

export async function fetchPaginated<T = any>(
  method: string,
  params: Record<string, any> = {},
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<T>> {
  try {
    const response = await rpcRequest<{
      data: T[];
      total: number;
      page: number;
      per_page: number;
    }>(method, {
      ...params,
      page,
      per_page: perPage,
    });

    // Handle the case where the response is already in the expected format
    if (Array.isArray((response as any).data)) {
      const data = response as any;
      return {
        data: data.data || [],
        pagination: {
          total: data.total || 0,
          page: data.page || page,
          per_page: data.per_page || perPage,
          has_more: (data.page || page) * (data.per_page || perPage) < (data.total || 0),
        },
      };
    }

    // Fallback for different response formats
    return {
      data: Array.isArray(response) ? response : [],
      pagination: {
        total: 0,
        page,
        per_page: perPage,
        has_more: false,
      },
    };
  } catch (error) {
    console.error(`Paginated request ${method} failed:`, error);
    throw error;
  }
}

// Export the axios instance in case it's needed directly
export default api;
