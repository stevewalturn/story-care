import { Calendar, Folder, Trash2, User, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';

type SessionCardProps = {
  id: string;
  title: string;
  date: string;
  type: 'individual' | 'group';
  patientName?: string;
  groupName?: string;
  sessionCount?: number;
  onClick?: () => void;
  onDelete?: () => void;
};

export function SessionCard({
  title: _title,
  date,
  type,
  patientName,
  groupName,
  sessionCount,
  onClick,
  onDelete,
}: SessionCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <Card hover onClick={onClick}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar/Icon */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50">
            {type === 'individual'
              ? (
                  <User className="h-6 w-6 text-indigo-600" />
                )
              : (
                  <Users className="h-6 w-6 text-indigo-600" />
                )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-base font-semibold text-gray-900">
                {patientName || groupName}
              </h3>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Delete session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {sessionCount}
              {' '}
              {sessionCount === 1 ? 'session' : 'sessions'}
            </p>

            {/* Latest session info */}
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5" />
                <span className="capitalize">{type}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
