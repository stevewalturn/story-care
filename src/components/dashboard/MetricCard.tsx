import type { ReactNode } from 'react';
import { Card, CardBody } from '@/components/ui/Card';

type MetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  iconBg?: string;
  iconColor?: string;
  change?: number;
  changeType?: 'increase' | 'decrease';
};

export function MetricCard({
  icon,
  label,
  value,
  iconBg = 'bg-purple-50',
  iconColor = 'text-purple-600',
  change,
  changeType,
}: MetricCardProps) {
  return (
    <Card>
      <CardBody className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
          <div className={`h-8 w-8 rounded-lg ${iconBg} ${iconColor} flex flex-shrink-0 items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change !== undefined && changeType && (
            <span className={`flex items-center text-sm font-medium ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-500'
            }`}
            >
              {changeType === 'increase' ? '+' : '-'}
              {Math.abs(change)}
              %
              {changeType === 'increase'
                ? (
                    <svg className="ml-0.5 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )
                : (
                    <svg className="ml-0.5 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
            </span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
