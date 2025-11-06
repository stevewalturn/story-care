/**
 * Super Admin Dashboard
 * Platform-wide overview and metrics
 */

'use client';

import { Activity, Building2, TrendingUp, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useAuth } from '@/contexts/AuthContext';

type PlatformMetrics = {
  totalOrganizations: number;
  activeOrganizations: number;
  totalTherapists: number;
  totalPatients: number;
  aiCreditsUsedThisMonth: number;
};

export default function SuperAdminDashboard() {
  const { user, dbUser } = useAuth();
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = useCallback(async () => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/super-admin/metrics', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      } else {
        setError('Failed to load metrics');
      }
    } catch (err) {
      setError('Error loading metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && dbUser?.role === 'super_admin') {
      fetchMetrics();
    }
  }, [user, dbUser, fetchMetrics]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitor platform-wide metrics and system health
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Organizations"
          value={metrics?.totalOrganizations || 0}
          icon={<Building2 className="h-6 w-6" />}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />

        <MetricCard
          label="Active Organizations"
          value={metrics?.activeOrganizations || 0}
          icon={<Activity className="h-6 w-6" />}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />

        <MetricCard
          label="Total Therapists"
          value={metrics?.totalTherapists || 0}
          icon={<Users className="h-6 w-6" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />

        <MetricCard
          label="Total Patients"
          value={metrics?.totalPatients || 0}
          icon={<TrendingUp className="h-6 w-6" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* AI Credits Usage */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          AI Credits Usage This Month
        </h2>
        <p className="mt-4 text-3xl font-bold text-indigo-600">
          {metrics?.aiCreditsUsedThisMonth?.toLocaleString() || 0}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Total AI API calls across all organizations
        </p>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/super-admin/organizations"
            className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
          >
            <Building2 className="mr-3 h-8 w-8 text-indigo-600" />
            <div>
              <p className="font-medium text-gray-900">Manage Organizations</p>
              <p className="text-sm text-gray-500">Create and configure orgs</p>
            </div>
          </a>

          <a
            href="/super-admin/users"
            className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
          >
            <Users className="mr-3 h-8 w-8 text-indigo-600" />
            <div>
              <p className="font-medium text-gray-900">User Management</p>
              <p className="text-sm text-gray-500">View all platform users</p>
            </div>
          </a>

          <a
            href="/super-admin/audit"
            className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
          >
            <Activity className="mr-3 h-8 w-8 text-indigo-600" />
            <div>
              <p className="font-medium text-gray-900">Audit Logs</p>
              <p className="text-sm text-gray-500">Security and access logs</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
