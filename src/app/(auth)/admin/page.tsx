import { Shield, Users, Settings, Database } from 'lucide-react';

export default async function AdminPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Panel</h1>
        <p className="text-lg text-gray-600 mb-8">
          Manage users, permissions, and system settings.
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
          <div className="p-4 bg-gray-50 rounded-lg">
            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Users</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Settings className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Settings</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Database className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Database</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-8">Coming soon...</p>
      </div>
    </div>
  );
}
