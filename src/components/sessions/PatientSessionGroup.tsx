'use client';

import type { PatientSessionGroup as PatientSessionGroupType } from '@/utils/groupSessionsByPatient';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

type PatientSessionGroupProps = {
  group: PatientSessionGroupType;
  onSessionClick: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string, sessionTitle: string) => void;
  // Selection mode props
  isSelectionMode?: boolean;
  selectedSessionIds?: Set<string>;
  onToggleSelection?: (sessionId: string) => void;
};

export function PatientSessionGroup({
  group,
  onSessionClick,
  onDeleteSession,
  isSelectionMode,
  selectedSessionIds,
  onToggleSelection,
}: PatientSessionGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const isGroupSession = group.patient.id.startsWith('group-');
  const avatarUrl = group.patient.avatarUrl;

  // Get initials for fallback avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get background color for initial avatar (based on first letter)
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-pink-100 text-pink-600',
      'bg-yellow-100 text-yellow-600',
      'bg-purple-100 text-purple-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-sm">
      {/* Patient/Group Row - Clickable Header */}
      <button
        onClick={toggleExpand}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
        type="button"
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full ${!avatarUrl ? getAvatarColor(group.patient.name) : 'bg-gray-100'}`}>
            {avatarUrl
              ? (
                  <img
                    src={avatarUrl}
                    alt={group.patient.name}
                    className="h-full w-full object-cover"
                  />
                )
              : isGroupSession
                ? (
                    <Users className="h-5 w-5" />
                  )
                : (
                    <span className="text-sm font-semibold">{getInitials(group.patient.name)}</span>
                  )}
          </div>

          {/* Patient Info */}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-medium text-gray-900">{group.patient.name}</h3>
            <p className="text-sm text-gray-500">
              {group.sessionCount}
              {' '}
              {group.sessionCount === 1 ? 'Session' : 'Sessions'}
            </p>
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0">
          {isExpanded
            ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )
            : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
        </div>
      </button>

      {/* Expanded Session List */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="divide-y divide-gray-100">
            {group.sessions.map((session) => {
              const formattedDate = session.sessionDate
                ? format(new Date(session.sessionDate), 'MMM d, yyyy')
                : 'Unknown date';

              return (
                <div
                  key={session.id}
                  className="flex w-full items-center justify-between px-4 py-3 pl-16 transition-colors hover:bg-gray-100"
                >
                  {/* Selection checkbox */}
                  {isSelectionMode && (
                    <input
                      type="checkbox"
                      checked={selectedSessionIds?.has(session.id) || false}
                      onChange={() => onToggleSelection?.(session.id)}
                      className="mr-3 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      onClick={e => e.stopPropagation()}
                    />
                  )}
                  <button
                    onClick={() => onSessionClick(session.id)}
                    className="min-w-0 flex-1 text-left"
                    type="button"
                  >
                    <h4 className="truncate text-sm font-medium text-gray-900">
                      {session.title}
                    </h4>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <span>{formattedDate}</span>
                      <span className="capitalize">{session.sessionType}</span>
                      {session.transcriptionStatus && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            session.transcriptionStatus === 'completed'
                              ? 'bg-green-50 text-green-700'
                              : session.transcriptionStatus === 'processing'
                                ? 'bg-blue-50 text-blue-700'
                                : session.transcriptionStatus === 'failed'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {session.transcriptionStatus}
                        </span>
                      )}
                    </div>
                  </button>
                  {onDeleteSession && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id, session.title);
                      }}
                      className="ml-4 flex-shrink-0 rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      type="button"
                      title="Delete session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
