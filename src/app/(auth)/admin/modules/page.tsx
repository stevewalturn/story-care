/**
 * Admin Modules Page (Deprecated - Redirect to Role-Specific Pages)
 * This page now redirects users to the appropriate role-specific module management page
 */

'use client';

import { Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminModulesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on user role
      switch (user.role) {
        case 'super_admin':
          router.push('/super-admin/module-templates');
          break;
        case 'org_admin':
          router.push('/org-admin/modules');
          break;
        case 'therapist':
          router.push('/therapist/modules');
          break;
        default:
          // Fallback for unknown roles
          router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  // Show loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Layers className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Redirecting...</h2>
        <p className="text-sm text-gray-600">Taking you to your module management page</p>
        <div className="mt-4 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      </div>
    </div>
  );
}
