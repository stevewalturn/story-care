/**
 * Super Admin Settings Page
 * Configure platform-wide settings
 */

'use client';

import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure platform-wide settings and defaults
        </p>
      </div>

      {/* Placeholder Message */}
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <SettingsIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          System settings are currently disabled
        </h3>
        <p className="text-sm text-gray-600">
          Platform configuration settings are not available at this time.
        </p>
      </div>
    </div>
  );
}
