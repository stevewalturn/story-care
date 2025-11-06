/**
 * Super Admin Settings Page
 * Configure platform-wide settings
 */

'use client';

import { Save, Settings as SettingsIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

type PlatformSettings = {
  id?: string;
  defaultAiCredits: number;
  imageGenModel: string;
  defaultStorageQuota: number;
  maxFileUploadSize: number;
  requireEmailVerification: boolean;
  enableMfaForAdmins: boolean;
  sessionTimeout: number;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings>({
    defaultAiCredits: 1000,
    imageGenModel: 'dall-e-3',
    defaultStorageQuota: 10737418240,
    maxFileUploadSize: 524288000,
    requireEmailVerification: true,
    enableMfaForAdmins: true,
    sessionTimeout: 15,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const idToken = await user?.getIdToken();

      const response = await fetch('/api/super-admin/settings', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        setError('Failed to load settings');
      }
    } catch (err) {
      setError('Error loading settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user, fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const idToken = await user?.getIdToken();

      const response = await fetch('/api/super-admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSuccess('Settings saved successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save settings');
      }
    } catch (err) {
      setError('Error saving settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof PlatformSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure platform-wide settings and defaults
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* AI Configuration */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">AI Configuration</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="defaultAiCredits" className="block text-sm font-medium text-gray-700">
                Default AI Credits
              </label>
              <input
                id="defaultAiCredits"
                type="number"
                value={settings.defaultAiCredits}
                onChange={e => handleChange('defaultAiCredits', Number.parseInt(e.target.value, 10))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Note: Model selection for both text generation and image generation is now available per-request for therapists, allowing them to choose the best model for each use case.
          </p>
        </div>

        {/* Storage Configuration */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Storage Configuration</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="defaultStorageQuota" className="block text-sm font-medium text-gray-700">
                Default Storage Quota (bytes)
              </label>
              <input
                id="defaultStorageQuota"
                type="number"
                value={settings.defaultStorageQuota}
                onChange={e => handleChange('defaultStorageQuota', Number.parseInt(e.target.value, 10))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Current:
                {' '}
                {(settings.defaultStorageQuota / 1024 / 1024 / 1024).toFixed(2)}
                {' '}
                GB
              </p>
            </div>
            <div>
              <label htmlFor="maxFileUploadSize" className="block text-sm font-medium text-gray-700">
                Max File Upload Size (bytes)
              </label>
              <input
                id="maxFileUploadSize"
                type="number"
                value={settings.maxFileUploadSize}
                onChange={e => handleChange('maxFileUploadSize', Number.parseInt(e.target.value, 10))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Current:
                {' '}
                {(settings.maxFileUploadSize / 1024 / 1024).toFixed(2)}
                {' '}
                MB
              </p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Security Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="requireEmailVerification" className="text-sm font-medium text-gray-700">
                  Require Email Verification
                </label>
                <p className="text-xs text-gray-500">
                  Users must verify their email before accessing the platform
                </p>
              </div>
              <input
                id="requireEmailVerification"
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={e => handleChange('requireEmailVerification', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="enableMfaForAdmins" className="text-sm font-medium text-gray-700">
                  Enable MFA for Admins
                </label>
                <p className="text-xs text-gray-500">
                  Require multi-factor authentication for admin users
                </p>
              </div>
              <input
                id="enableMfaForAdmins"
                type="checkbox"
                checked={settings.enableMfaForAdmins}
                onChange={e => handleChange('enableMfaForAdmins', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">
                Session Timeout (minutes)
              </label>
              <input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={e => handleChange('sessionTimeout', Number.parseInt(e.target.value, 10))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving
              ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                )
              : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
          </Button>
        </div>
      </form>

      {/* Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start">
          <SettingsIcon className="mr-3 h-5 w-5 text-blue-600" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Platform Settings</p>
            <p className="mt-1">
              Changes to these settings affect all organizations and users on the platform.
              Exercise caution when modifying security and storage settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
