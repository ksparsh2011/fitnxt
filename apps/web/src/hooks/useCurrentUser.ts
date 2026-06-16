'use client';
import { useAuthQuery } from './useAuthQuery';
import { apiGet } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { UserProfile } from '@/types/today';

/** Returns the authenticated user's profile, cached indefinitely. */
export function useCurrentUser() {
  return useAuthQuery<UserProfile | null>({
    queryKey: QUERY_KEYS.user.me(),
    queryFn: () => apiGet<UserProfile>('/users/me'),
    staleTime: Infinity,
  });
}
