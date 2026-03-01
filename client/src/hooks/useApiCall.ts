import { useState } from 'react';
import type { ApiFunction } from '../types/api';

export interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useApiCall = <TArgs extends any[], TResponse>(
  apiFunction: ApiFunction<TArgs, TResponse>
) => {
  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (...args: TArgs): Promise<TResponse | undefined> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(...args);
      const responseData = result.data;
      setData(responseData);
      return responseData;
    } catch (err: unknown) {
      let errorMessage = 'An unexpected error occurred';
      const error = err as { response?: { status: number; data?: { error?: string } }; request?: unknown; message?: string };
      
      if (error.response) {
        // Handle specific HTTP status codes
        switch (error.response.status) {
          case 401:
            errorMessage = error.response.data?.error || 'Authentication required';
            // Note: Removed automatic "Session expired" message to prevent confusion
            break;
          case 403:
            errorMessage = error.response.data?.error || 'Permission denied';
            break;
          case 404:
            errorMessage = error.response.data?.error || 'Resource not found';
            break;
          case 409:
            errorMessage = error.response.data?.error || 'Conflict occurred';
            break;
          case 429:
            errorMessage = error.response.data?.error || 'Too many requests. Please slow down.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = error.response.data?.error || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return { data, loading, error, execute, reset };
};
