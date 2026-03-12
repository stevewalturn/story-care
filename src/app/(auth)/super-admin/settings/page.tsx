/**
 * Super Admin Settings Page
 * Configure platform-wide settings
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type PlatformSettings = {
  enablePhoneVerification: boolean;
  sessionTimeout: number;
  platformName: string;
  supportEmail: string;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) => {
      fetch('/api/super-admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then((data) => {
          setSettings(data.settings);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [user]);

  const handleToggle = async (key: keyof PlatformSettings, value: boolean) => {
    if (!settings || !user) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setSaving(true);
    setMessage('');

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/super-admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        setMessage('Settings saved.');
      } else {
        setMessage('Failed to save settings.');
        setSettings(settings); // revert
      }
    } catch {
      setMessage('Failed to save settings.');
      setSettings(settings);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-gray-500">Failed to load settings.</div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="mt-2 text-gray-600">Configure platform-wide settings and defaults</p>
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Feature Flags */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Feature Flags</h2>
        <div className="space-y-4">

          {/* Phone Verification */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Phone Verification</p>
              <p className="text-sm text-gray-500">
                Allow invited users to verify identity via SMS OTP instead of email token.
                When enabled, users invited with a phone number will receive a link to
                {' '}
                <code className="rounded bg-gray-100 px-1 text-xs">/setup-account-phone</code>
                .
              </p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleToggle('enablePhoneVerification', !settings.enablePhoneVerification)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                settings.enablePhoneVerification ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ${
                  settings.enablePhoneVerification ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
