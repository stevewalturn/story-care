import type { ReactNode } from 'react';
import { Card, CardBody } from '@/components/ui/Card';

type MetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  iconBg?: string;
  iconColor?: string;
};

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
        <div className={`h-12 w-12 rounded-xl ${iconBg} ${iconColor} flex flex-shrink-0 items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}
