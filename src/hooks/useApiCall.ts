import { useState, useCallback } from 'react';

interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseApiCallReturn<T> extends ApiCallState<T> {
  execute: (apiCall: () => Promise<T>) => Promise<T | undefined>;
  reset: () => void;
}

/**
 * Custom hook for handling API calls with loading and error states
 * @template T - The type of data returned by the API call
 * @returns Object containing data, loading, error states and execute function
 * 
 * @example
 * const { data, loading, error, execute } = useApiCall<User>();
 * 
 * const fetchUser = async () => {
 *   await execute(() => api.getUser(userId));
 * };
 */
export const useApiCall = <T = any>(): UseApiCallReturn<T> => {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (apiCall: () => Promise<T>): Promise<T | undefined> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setState(prev => ({ ...prev, loading: false, error }));
      console.error('API call failed:', error);
      return undefined;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
};

export default useApiCall;