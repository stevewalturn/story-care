import { Database, Settings, Shield, Users } from 'lucide-react';

export default async function AdminPage() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
          <Shield className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mb-8 text-lg text-gray-600">
          Manage users, permissions, and system settings.
        </p>
        <div className="mx-auto grid max-w-xl grid-cols-3 gap-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <Users className="mx-auto mb-2 h-8 w-8 text-gray-600" />
            <p className="text-sm font-medium text-gray-700">Users</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <Settings className="mx-auto mb-2 h-8 w-8 text-gray-600" />
            <p className="text-sm font-medium text-gray-700">Settings</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <Database className="mx-auto mb-2 h-8 w-8 text-gray-600" />
            <p className="text-sm font-medium text-gray-700">Database</p>
          </div>
        </div>
        <p className="mt-8 text-sm text-gray-500">Coming soon...</p>
      </div>
    </div>
  );
}
