'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

/**
 * Hook to fetch the count of pending invitations for the sidebar badge.
 * Only runs for super_admin role. Polls every 60 seconds.
 */
export function usePendingInvitationCount() {
  const { user, dbUser } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user || dbUser?.role !== 'super_admin') return;

    try {
      const response = await authenticatedFetch(
        '/api/super-admin/pending-invitations/count',
        user,
      );
      if (response.ok) {
        const data = await response.json();
        setCount(data.count || 0);
      }
    } catch {
      // Silently fail — badge is non-critical
    }
  }, [user, dbUser?.role]);

  useEffect(() => {
    fetchCount();

    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return { count, refetch: fetchCount };
}
