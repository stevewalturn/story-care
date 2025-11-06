/**
 * Dashboard Redirect Component
 * Redirects users to their role-specific dashboard
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardRedirect() {
  const { dbUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && dbUser?.role) {
      // Redirect based on role
      switch (dbUser.role) {
        case 'super_admin':
          router.push('/super-admin/dashboard');
          break;
        case 'org_admin':
          router.push('/org-admin/dashboard');
          break;
        case 'therapist':
          // Stay on /dashboard (therapist dashboard)
          break;
        case 'patient':
          router.push('/patient/story');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [dbUser, loading, router]);

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>
  );
}
