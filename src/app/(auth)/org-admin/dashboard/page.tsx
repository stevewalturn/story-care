/**
 * Organization Admin Dashboard
 * Overview of organization metrics and quick actions
 */

'use client';

import {
  AlertCircle,
  Calendar,
  FileText,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

type OrgMetrics = {
  activeTherapists: number;
  activePatients: number;
  sessionsLast30Days: number;
  pendingTemplateApprovals: number;
};

export default function OrgAdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<OrgMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user]);

  const fetchMetrics = async () => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/org-admin/metrics', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      } else {
        setError('Failed to load dashboard metrics');
      }
    } catch (err) {
      setError('Error loading dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error || 'Failed to load dashboard'}
        </div>
      </div>
    );
  }

  const statCards: Array<{
    title: string;
    value: number;
    icon: any;
    color: string;
    link: string | null;
    alert?: boolean;
  }> = [
    {
      title: 'Active Therapists',
      value: metrics.activeTherapists,
      icon: Users,
      color: 'bg-blue-500',
      link: '/org-admin/therapists',
    },
    {
      title: 'Active Patients',
      value: metrics.activePatients,
      icon: UserCheck,
      color: 'bg-green-500',
      link: null,
    },
    {
      title: 'Sessions (30 days)',
      value: metrics.sessionsLast30Days,
      icon: Calendar,
      color: 'bg-purple-500',
      link: null,
    },
  ];

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Organization overview and quick actions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map(stat => (
          <div
            key={stat.title}
            className="relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            {stat.alert && (
              <div className="absolute top-2 right-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
            )}
            <div className="flex items-center">
              <div className={`rounded-lg ${stat.color} p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
            {stat.link && (
              <button
                onClick={() => router.push(stat.link!)}
                className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                View details →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Button
            variant="secondary"
            onClick={() => router.push('/org-admin/therapists')}
            className="justify-start"
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Therapists
          </Button>

          <Button
            variant="secondary"
            onClick={() => router.push('/org-admin/settings')}
            className="justify-start"
          >
            <FileText className="mr-2 h-4 w-4" />
            Organization Settings
          </Button>

          <Button
            variant="secondary"
            onClick={() => router.push('/org-admin/templates')}
            className="justify-start"
          >
            <FileText className="mr-2 h-4 w-4" />
            Content Templates
          </Button>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
          <TrendingUp className="mr-2 h-5 w-5 text-indigo-600" />
          Activity Summary (Last 30 Days)
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-gray-600">Total Sessions</span>
            <span className="font-semibold text-gray-900">
              {metrics.sessionsLast30Days}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-gray-600">Active Therapists</span>
            <span className="font-semibold text-gray-900">
              {metrics.activeTherapists}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Active Patients</span>
            <span className="font-semibold text-gray-900">
              {metrics.activePatients}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
