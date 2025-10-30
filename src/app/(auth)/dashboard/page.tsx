import { MetricCard } from '@/components/dashboard/MetricCard';
import { ResponseTable } from '@/components/dashboard/ResponseTable';
import { EngagementList } from '@/components/dashboard/EngagementList';
import { Users, FileText, MessageCircle, CheckSquare } from 'lucide-react';

export default function DashboardPage() {
  const metrics = [
    { label: 'Active Patients', value: '12', icon: Users, color: 'blue' },
    { label: 'Published Pages', value: '24', icon: FileText, color: 'green' },
    { label: 'Survey Responses', value: '156', icon: CheckSquare, color: 'purple' },
    { label: 'Written Reflections', value: '89', icon: MessageCircle, color: 'orange' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, Dr. Smith
        </h1>
        <p className="text-sm text-gray-600">
          Here's what's happening with your patients today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
    </div>
  );
}
