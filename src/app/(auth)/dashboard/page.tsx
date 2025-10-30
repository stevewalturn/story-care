'use client';

import { CheckSquare, FileText, MessageCircle, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  activePatients: number;
  publishedPages: number;
  surveyResponses: number;
  writtenReflections: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats when user is available
  useEffect(() => {
    if (user?.uid) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/stats?therapistId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    {
      label: 'Active Patients',
      value: stats?.activePatients?.toString() || '0',
      icon: <Users className="h-6 w-6" />,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Published Pages',
      value: stats?.publishedPages?.toString() || '0',
      icon: <FileText className="h-6 w-6" />,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Survey Responses',
      value: stats?.surveyResponses?.toString() || '0',
      icon: <CheckSquare className="h-6 w-6" />,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Written Reflections',
      value: stats?.writtenReflections?.toString() || '0',
      icon: <MessageCircle className="h-6 w-6" />,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  // Get user's display name or email
  const userName = user?.displayName || user?.email?.split('@')[0] || 'there';

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Welcome back,
          {' '}
          {userName}
        </h1>
        <p className="text-sm text-gray-600">
          Here's what's happening with your patients today
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(metric => (
          <MetricCard
            key={metric.label}
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            iconBg={metric.iconBg}
            iconColor={metric.iconColor}
          />
        ))}
      </div>
    </div>
  );
}
