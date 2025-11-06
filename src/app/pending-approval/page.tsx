/**
 * Pending Approval Page
 * Shown to users awaiting organization admin approval
 */

'use client';

import { Clock, Building2, Mail, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logOut } from '@/libs/Firebase';

export default function PendingApprovalPage() {
  const { user, dbUser, loading } = useAuth();
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState<string>('');

  useEffect(() => {
    // Redirect if user is not pending or not authenticated
    if (!loading) {
      if (!user) {
        router.push('/sign-in');
      } else if (dbUser?.status === 'active') {
        router.push('/dashboard');
      } else if (dbUser?.status === 'inactive') {
        router.push('/sign-in?error=account_inactive');
      }
    }
  }, [user, dbUser, loading, router]);

  useEffect(() => {
    // Fetch organization info
    const fetchOrgInfo = async () => {
      if (dbUser?.organizationId) {
        try {
          const idToken = await user?.getIdToken();
          const response = await fetch(
            `/api/organizations/${dbUser.organizationId}`,
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            },
          );

          if (response.ok) {
            const data = await response.json();
            setOrganizationName(data.organization.name);
          }
        } catch (error) {
          console.error('Failed to fetch organization info:', error);
        }
      }
    };

    fetchOrgInfo();
  }, [dbUser?.organizationId, user]);

  const handleLogout = async () => {
    await logOut();
    router.push('/sign-in');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <span className="text-3xl font-bold text-white">S</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">StoryCare</h1>
        </div>

        {/* Pending Approval Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          {/* Status Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Approval Pending
            </h2>
            <p className="mt-2 text-amber-50">
              Your registration is awaiting approval
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <div className="space-y-6">
              {/* Status Message */}
              <div>
                <p className="text-gray-700">
                  Thank you for registering with StoryCare! Your account has been created and is now waiting for approval from your organization administrator.
                </p>
              </div>

              {/* Organization Info */}
              {organizationName && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        Organization
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {organizationName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Info */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                    <Mail className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Your Email
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {dbUser?.email || user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* What's Next */}
              <div className="rounded-lg bg-indigo-50 p-4">
                <h3 className="text-sm font-semibold text-indigo-900">
                  What happens next?
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-indigo-700">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>Your organization administrator will review your registration</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>You'll receive an email notification once approved</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>You can then sign in and access StoryCare</span>
                  </li>
                </ul>
              </div>

              {/* Timeline */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Expected approval time:</span> Typically within 1-2 business days
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Need help?{' '}
          <a
            href="mailto:support@storycare.com"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
