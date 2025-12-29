import type { TherapeuticDomain } from '@/models/Schema';
import { Calendar, Folder, Layers, Trash2, User, Users } from 'lucide-react';
import { useState } from 'react';
import { ModuleBadge } from '@/components/modules/ModuleBadge';
import { Card } from '@/components/ui/Card';
import { extractFilename } from '@/utils/Helpers';

type SessionCardProps = {
  id: string;
  title: string;
  date: string;
  type: 'individual' | 'group';
  patientName?: string;
  patientAvatarUrl?: string;
  patientReferenceImageUrl?: string;
  groupName?: string;
  sessionCount?: number;
  moduleName?: string;
  moduleDomain?: TherapeuticDomain;
  compact?: boolean; // For "Continue Your Work" section - more compact horizontal layout
  onClick?: () => void;
  onDelete?: () => void;
  onAssignModule?: () => void;
};

export function SessionCard({
  title,
  date,
  type,
  patientName,
  patientAvatarUrl,
  patientReferenceImageUrl,
  groupName,
  sessionCount: _sessionCount,
  moduleName,
  moduleDomain,
  compact = false,
  onClick,
  onDelete,
  onAssignModule,
}: SessionCardProps) {
  const [imageError, setImageError] = useState(false);

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

  const handleImageError = () => {
    setImageError(true);
  };

  // Clean up title: extract filename if it's a path
  const displayTitle = extractFilename(title);

  // Determine which image to show (prioritize referenceImageUrl over avatarUrl like patient page does)
  const patientImageUrl = patientReferenceImageUrl || patientAvatarUrl;
  const showImage = type === 'individual' && patientImageUrl && !imageError;

  return (
    <Card hover onClick={onClick} className={compact ? 'bg-white' : ''}>
      <div className={compact ? 'p-4' : 'p-5'}>
        <div className="flex items-start gap-3">
          {/* Avatar/Icon */}
          <div className={`flex ${compact ? 'h-10 w-10' : 'h-12 w-12'} flex-shrink-0 items-center justify-center rounded-full ${compact ? 'bg-gray-100' : 'bg-purple-50'} overflow-hidden`}>
            {showImage
              ? (
                  <img
                    src={patientImageUrl}
                    alt={patientName || 'Patient'}
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                  />
                )
              : type === 'individual'
                ? (
                    <User className={compact ? 'h-5 w-5 text-gray-500' : 'h-6 w-6 text-purple-600'} />
                  )
                : (
                    <Users className={compact ? 'h-5 w-5 text-gray-500' : 'h-6 w-6 text-purple-600'} />
                  )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`truncate ${compact ? 'text-sm font-semibold' : 'text-base font-semibold'} text-gray-900`} title={title}>
                {displayTitle}
              </h3>
              {onDelete && !compact && (
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
              <p className={`${compact ? 'mt-1 text-xs' : 'mt-1 text-sm'} text-gray-500`}>
                {patientName || groupName}
              </p>
            )}

            {/* Latest session info */}
            {compact
              ? (
                  // Simplified layout for Continue Your Work cards - matches Figma
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                    <span>{date}</span>
                    <span>•</span>
                    <span className="capitalize">{type}</span>
                  </div>
                )
              : (
                  // Full layout for regular session cards
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
                )}

            {/* Treatment Module Badge - Hide in compact mode */}
            {!compact && moduleName && moduleDomain ? (
              <div className="mt-3">
                <ModuleBadge
                  moduleName={moduleName}
                  domain={moduleDomain}
                  size="sm"
                  onClick={onAssignModule}
                />
              </div>
            ) : !compact && onAssignModule ? (
              <div className="mt-3">
                <button
                  onClick={handleAssignModule}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
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
