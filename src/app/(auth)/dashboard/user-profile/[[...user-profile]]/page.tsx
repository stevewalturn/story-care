'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export default function UserProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          User Profile
        </h1>
        <p className="text-sm text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardBody className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                type="text"
                value={user.displayName || ''}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-600"
              />
              <p className="mt-1 text-xs text-gray-500">
                Contact support to update your profile information
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                User ID
              </label>
              <input
                type="text"
                value={user.uid}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 font-mono text-sm text-gray-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Account Created
              </label>
              <input
                type="text"
                value={user.metadata.creationTime || 'Unknown'}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Last Sign In
              </label>
              <input
                type="text"
                value={user.metadata.lastSignInTime || 'Unknown'}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-600"
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
