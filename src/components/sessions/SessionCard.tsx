import type { TherapeuticDomain } from '@/models/Schema';
import { Calendar, Folder, Layers, Trash2, User, Users } from 'lucide-react';
import { ModuleBadge } from '@/components/modules/ModuleBadge';
import { Card } from '@/components/ui/Card';
import { extractFilename } from '@/utils/Helpers';

type SessionCardProps = {
  id: string;
  title: string;
  date: string;
  type: 'individual' | 'group';
  patientName?: string;
  groupName?: string;
  sessionCount?: number;
  moduleName?: string;
  moduleDomain?: TherapeuticDomain;
  onClick?: () => void;
  onDelete?: () => void;
  onAssignModule?: () => void;
};

export function SessionCard({
  title,
  date,
  type,
  patientName,
  groupName,
  sessionCount: _sessionCount,
  moduleName,
  moduleDomain,
  onClick,
  onDelete,
  onAssignModule,
}: SessionCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onDelete) {
      onDelete();
    }
  };

  const handleAssignModule = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onAssignModule) {
      onAssignModule();
    }
  };

  // Clean up title: extract filename if it's a path
  const displayTitle = extractFilename(title);

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
              <h3 className="truncate text-base font-semibold text-gray-900" title={title}>
                {displayTitle}
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
            {(patientName || groupName) && (
              <p className="mt-1 text-sm text-gray-500">
                {patientName || groupName}
              </p>
            )}

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

            {/* Treatment Module Badge */}
            {moduleName && moduleDomain ? (
              <div className="mt-3">
                <ModuleBadge
                  moduleName={moduleName}
                  domain={moduleDomain}
                  size="sm"
                  onClick={onAssignModule}
                />
              </div>
            ) : onAssignModule ? (
              <div className="mt-3">
                <button
                  onClick={handleAssignModule}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  type="button"
                >
                  <Layers className="h-3 w-3" />
                  <span>Assign Module</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
