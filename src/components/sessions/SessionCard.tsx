import { Folder, Users, User, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface SessionCardProps {
  id: string;
  title: string;
  date: string;
  type: 'individual' | 'group';
  patientName?: string;
  groupName?: string;
  sessionCount: number;
  onClick?: () => void;
}

export function SessionCard({
  title,
  date,
  type,
  patientName,
  groupName,
  sessionCount,
  onClick,
}: SessionCardProps) {
  return (
    <Card hover onClick={onClick}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar/Icon */}
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
            {type === 'individual' ? (
              <User className="w-6 h-6 text-indigo-600" />
            ) : (
              <Users className="w-6 h-6 text-indigo-600" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {patientName || groupName}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
            </p>

            {/* Latest session info */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" />
                <span className="capitalize">{type}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
