'use client';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';

/** Wraps useQuery with an auth gate — queries only fire when the user is authenticated. */
export function useAuthQuery<TData>(
  options: Omit<UseQueryOptions<TData>, 'enabled'> & { enabled?: boolean },
): UseQueryResult<TData> {
  const isAuthenticated = useAuthStore((s) => s.accessToken !== null);
  return useQuery<TData>({
    ...options,
    enabled: isAuthenticated && (options.enabled ?? true),
  });
}
