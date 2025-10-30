'use client';

import { CheckSquare, FileText, MessageCircle, Users } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  const metrics = [
    {
      label: 'Active Patients',
      value: '12',
      icon: <Users className="h-6 w-6" />,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Published Pages',
      value: '24',
      icon: <FileText className="h-6 w-6" />,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Survey Responses',
      value: '156',
      icon: <CheckSquare className="h-6 w-6" />,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Written Reflections',
      value: '89',
      icon: <MessageCircle className="h-6 w-6" />,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  // Get user's display name or email
  const userName = user?.displayName || user?.email?.split('@')[0] || 'there';

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
