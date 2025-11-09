import axios, { AxiosRequestConfig, AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface FetcherOptions extends AxiosRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  params?: Record<string, unknown>;
}

export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

/**
 * Common fetcher function for all API calls
 * Supports GET, POST, PUT, PATCH, DELETE methods
 */
export async function fetcher<T = unknown>(
  url: string,
  options: FetcherOptions = {}
): Promise<T> {
  const { method = 'GET', data, params, ...restOptions } = options;

  try {
    let response;

    switch (method) {
      case 'GET':
        response = await api.get<T>(url, { params, ...restOptions });
        break;
      case 'POST':
        response = await api.post<T>(url, data, restOptions);
        break;
      case 'PUT':
        response = await api.put<T>(url, data, restOptions);
        break;
      case 'PATCH':
        response = await api.patch<T>(url, data, restOptions);
        break;
      case 'DELETE':
        response = await api.delete<T>(url, { params, ...restOptions });
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    
    const apiError: ApiError = {
      message: axiosError.response?.data?.error || 
               axiosError.response?.data?.message || 
               axiosError.message || 
               'An error occurred',
      status: axiosError.response?.status,
      data: axiosError.response?.data,
    };

    throw apiError;
  }
}

/**
 * Helper functions for each HTTP method
 */
export const apiClient = {
  get: <T = unknown>(url: string, options?: Omit<FetcherOptions, 'method' | 'data'>) =>
    fetcher<T>(url, { ...options, method: 'GET' }),

  post: <T = unknown>(url: string, data?: unknown, options?: Omit<FetcherOptions, 'method' | 'data'>) =>
    fetcher<T>(url, { ...options, method: 'POST', data }),

  put: <T = unknown>(url: string, data?: unknown, options?: Omit<FetcherOptions, 'method' | 'data'>) =>
    fetcher<T>(url, { ...options, method: 'PUT', data }),

  patch: <T = unknown>(url: string, data?: unknown, options?: Omit<FetcherOptions, 'method' | 'data'>) =>
    fetcher<T>(url, { ...options, method: 'PATCH', data }),

  delete: <T = unknown>(url: string, options?: Omit<FetcherOptions, 'method' | 'data'>) =>
    fetcher<T>(url, { ...options, method: 'DELETE' }),
};

export default fetcher;

