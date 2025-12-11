/**
 * Therapist Sessions Tab Component
 * Displays list of sessions created by therapist
 */

'use client';

import { Calendar, Clock, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type Session = {
  id: string;
  title: string;
  sessionDate: string;
  sessionType: 'individual' | 'group';
  patientName: string;
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  audioDurationSeconds?: number | null;
  createdAt: string;
};

type TherapistSessionsTabProps = {
  sessions: Session[];
};

export function TherapistSessionsTab({ sessions }: TherapistSessionsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'group'>('all');

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch
      = session.title.toLowerCase().includes(searchQuery.toLowerCase())
      || session.patientName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || session.sessionType === filterType;

    return matchesSearch && matchesType;
  });

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds)
      return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No sessions yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          This therapist hasn't created any sessions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="block w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType('individual')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'individual'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Individual
          </button>
          <button
            type="button"
            onClick={() => setFilterType('group')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'group'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Group
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Session
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Patient
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Duration
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Status
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredSessions.length === 0
              ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-sm text-gray-500">No sessions found matching your filters</p>
                    </td>
                  </tr>
                )
              : (
                  filteredSessions.map(session => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <FileText className="mr-3 h-5 w-5 text-gray-400" />
                          <div className="text-sm font-medium text-gray-900">{session.title}</div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            session.sessionType === 'individual'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {session.sessionType === 'individual'
                            ? (
                                <>
                                  <Users className="mr-1 h-3 w-3" />
                                  Individual
                                </>
                              )
                            : (
                                <>
                                  <Users className="mr-1 h-3 w-3" />
                                  Group
                                </>
                              )}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {session.patientName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                          {new Date(session.sessionDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4 text-gray-400" />
                          {formatDuration(session.audioDurationSeconds)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            session.transcriptionStatus === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : session.transcriptionStatus === 'processing'
                                ? 'bg-yellow-100 text-yellow-700'
                                : session.transcriptionStatus === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {session.transcriptionStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <Link
                          href={`/org-admin/sessions/${session.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          Showing {filteredSessions.length} of {sessions.length} sessions
        </p>
      </div>
    </div>
  );
}
