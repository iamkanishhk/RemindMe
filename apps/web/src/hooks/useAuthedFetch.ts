import { useCallback } from 'react';
import { useAuth } from '@clerk/react';
import { ApiError, apiFetch } from '../lib/api';

export function useAuthedFetch() {
  const { getToken } = useAuth();
  return useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Not signed in');
      return apiFetch<T>(path, { ...init, token });
    },
    [getToken]
  );
}