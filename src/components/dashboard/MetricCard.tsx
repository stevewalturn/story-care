import type { ReactNode } from 'react';
import { Card, CardBody } from '@/components/ui/Card';

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  iconBg?: string;
  iconColor?: string;
}

export function MetricCard({
  icon,
  label,
  value,
  iconBg = 'bg-indigo-50',
  iconColor = 'text-indigo-600',
}: MetricCardProps) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}
