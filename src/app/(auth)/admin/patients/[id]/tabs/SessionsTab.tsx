'use client';

import { ArrowRight, Calendar, Clock, Filter, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type SessionsTabProps = {
  patientId: string;
};

type SessionType = 'individual' | 'group';

type Session = {
  id: string;
  title: string;
  sessionDate: string;
  sessionType: 'individual' | 'group';
  audioDurationSeconds?: number;
  patient?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  group?: {
    id: string;
    name: string;
  };
};

export function SessionsTab({ patientId }: SessionsTabProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('individual');
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch sessions from API
  useEffect(() => {
    if (!user?.uid || !patientId) return;

    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/sessions?patientId=${patientId}`, user);
        if (response.ok) {
          const data = await response.json();
          setAllSessions(data.sessions || []);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user, patientId]);

  // Format duration from seconds to HH:MM:SS
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--:--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter sessions by type and search query
  const filteredSessions = allSessions
    .filter(s => s.sessionType === sessionType)
    .filter(s =>
      searchQuery === ''
      || s.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header Controls - Figma Layout */}
      <div className="mb-6 flex items-center justify-between gap-4">
        {/* Left: Session Type Toggle */}
        <div className="flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setSessionType('individual')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              sessionType === 'individual'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setSessionType('group')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              sessionType === 'group'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Group
          </button>
        </div>

        {/* Right: Filter, Search, New Session */}
        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
            <Filter className="h-4 w-4" />
          </button>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-9 w-64 rounded-lg border border-gray-200 pr-4 pl-9 text-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button className="flex h-9 items-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-medium text-white hover:bg-purple-700">
            <Plus className="h-4 w-4" />
            New Session
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                Sessions Title
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Date</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Duration</th>
              <th className="w-12 px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No
                  {' '}
                  {sessionType}
                  {' '}
                  sessions found for this patient.
                </td>
              </tr>
            ) : (
              filteredSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(session => (
                <tr key={session.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Group sessions show group name */}
                      {session.sessionType === 'group' && session.group && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-600">
                          G
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-900">{session.title}</span>
                        {session.sessionType === 'group' && session.group && (
                          <p className="text-sm text-gray-500">{session.group.name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {formatDate(session.sessionDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {formatDuration(session.audioDurationSeconds)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/sessions/${session.id}/transcript`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select className="rounded-lg border border-gray-300 px-2 py-1 text-sm">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              Result
              {' '}
              {filteredSessions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              {' '}
              -
              {' '}
              {Math.min(currentPage * itemsPerPage, filteredSessions.length)}
              {' '}
              of
              {' '}
              {filteredSessions.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex size-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowRight className="size-4 rotate-180" />
            </button>
            {Array.from({ length: Math.min(totalPages, 4) }).map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
                    currentPage === page
                      ? 'border-purple-600 bg-purple-50 text-purple-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            {totalPages > 4 && (
              <>
                <span className="px-2 text-gray-400">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
                    currentPage === totalPages
                      ? 'border-purple-600 bg-purple-50 text-purple-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex size-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
