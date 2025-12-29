'use client';

import { MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

type RecentSession = {
  id: string;
  title: string;
  groupName?: string;
  participants: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
    initials: string;
  }>;
  timeAgo: string;
};

type ContinueYourWorkProps = {
  sessions: RecentSession[];
  loading?: boolean;
};

export function ContinueYourWork({ sessions, loading = false }: ContinueYourWorkProps) {
  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Continue your work</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse p-4">
              <div className="mb-3 h-5 w-24 rounded bg-gray-200" />
              <div className="mb-3 h-4 w-32 rounded bg-gray-200" />
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-8 w-8 rounded-full bg-gray-200" />
                  ))}
                </div>
                <div className="h-4 w-16 rounded bg-gray-200" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Continue your work</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {sessions.slice(0, 3).map((session, index) => (
          <Card
            key={session.id}
            className={`group relative p-4 transition-all hover:shadow-md ${
              index === 1 ? 'ring-2 ring-purple-200' : ''
            }`}
          >
            <Link href={`/sessions/${session.id}/transcript`} className="block">
              {/* Header with title and menu */}
              <div className="mb-1 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{session.title}</h3>
                <button
                  type="button"
                  className="rounded p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {/* Group/participant names */}
              <p className="mb-3 text-sm text-gray-500">
                {session.groupName || session.participants.map(p => p.name).join(', ')}
              </p>

              {/* Avatars and time */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {session.participants.slice(0, 3).map(participant => (
                    <div
                      key={participant.id}
                      className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-gray-200"
                      title={participant.name}
                    >
                      {participant.avatarUrl
                        ? (
                            <img
                              src={participant.avatarUrl}
                              alt={participant.name}
                              className="h-full w-full object-cover"
                            />
                          )
                        : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-400 to-purple-600 text-xs font-medium text-white">
                              {participant.initials}
                            </div>
                          )}
                    </div>
                  ))}
                  {session.participants.length > 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-medium text-gray-600">
                      +
                      {session.participants.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-400">{session.timeAgo}</span>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
