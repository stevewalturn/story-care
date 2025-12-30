'use client';

import { ArrowLeft, ArrowRight, Calendar, Clock, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StackedAvatars } from '@/components/ui/StackedAvatars';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type Tab = 'sessions' | 'general-info';

type GroupMember = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type GroupDetailViewProps = {
  groupId: string;
  groupName: string;
  members: GroupMember[];
  onBack: () => void;
};

type Session = {
  id: string;
  title: string;
  sessionDate: string;
  audioDurationSeconds?: number;
};

type GroupInfo = {
  description?: string;
  createdAt?: string;
  memberCount: number;
};

function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--:--';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function GroupDetailView({ groupId, groupName, members, onBack }: GroupDetailViewProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user?.uid || !groupId) return;

    const fetchGroupData = async () => {
      try {
        setLoading(true);

        // Fetch sessions for this group
        const sessionsResponse = await authenticatedFetch(`/api/sessions?groupId=${groupId}`, user);
        if (sessionsResponse.ok) {
          const data = await sessionsResponse.json();
          setSessions(data.sessions || []);
        }

        // Fetch group info
        const groupResponse = await authenticatedFetch(`/api/groups/${groupId}`, user);
        if (groupResponse.ok) {
          const data = await groupResponse.json();
          setGroupInfo({
            description: data.group?.description,
            createdAt: data.group?.createdAt,
            memberCount: data.group?.members?.length || members.length,
          });
        }
      } catch (err) {
        console.error('Error fetching group data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [user, groupId, members.length]);

  // Filter sessions by search
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Paginate
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  const lastSeen = sortedSessions.length > 0 && sortedSessions[0]
    ? formatDate(sortedSessions[0].sessionDate)
    : 'Never';

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'sessions', label: 'Sessions' },
    { id: 'general-info', label: 'General Information' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="bg-white px-8 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Sessions</span>
        </button>
      </div>

      {/* Group Header */}
      <div className="bg-white px-8 py-6">
        <div className="flex items-start gap-4">
          {/* Stacked Avatars */}
          <StackedAvatars members={members} size="lg" maxVisible={3} />

          {/* Info */}
          <div className="flex-1">
            <h1 className="mb-2 text-xl font-semibold text-gray-900">{groupName}</h1>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {sessions.length}
                  {' '}
                  Sessions
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  Last seen
                  {lastSeen}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 bg-white px-8">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white px-8 py-6">
        {activeTab === 'sessions' && (
          <div>
            {/* Search */}
            <div className="mb-6 flex items-center gap-4">
              <div className="relative max-w-md flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <Button
                variant="primary"
                onClick={() => window.location.href = '/sessions/new'}
              >
                + New Session
              </Button>
            </div>

            {/* Sessions Table */}
            {loading ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                <p className="text-gray-500">Loading sessions...</p>
              </div>
            ) : paginatedSessions.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">No sessions yet</h3>
                <p className="text-gray-500">Create a session to get started</p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
                      <th className="pb-3 font-medium">Sessions Title</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Duration</th>
                      <th className="w-12 pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSessions.map(session => (
                      <tr
                        key={session.id}
                        className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50"
                        onClick={() => window.location.href = `/sessions/${session.id}/transcript`}
                      >
                        <td className="py-4 font-medium text-gray-900">{session.title}</td>
                        <td className="py-4 text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(session.sessionDate)}
                          </div>
                        </td>
                        <td className="py-4 text-gray-500">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {formatDuration(session.audioDurationSeconds)}
                          </div>
                        </td>
                        <td className="py-4">
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Result
                      {' '}
                      {(currentPage - 1) * itemsPerPage + 1}
                      {' '}
                      -
                      {' '}
                      {Math.min(currentPage * itemsPerPage, filteredSessions.length)}
                      {' '}
                      of
                      {' '}
                      {filteredSessions.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-purple-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'general-info' && (
          <div className="space-y-6">
            {/* Group Description */}
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Group Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Description</label>
                  <p className="mt-1 text-gray-900">{groupInfo?.description || 'No description'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Created</label>
                  <p className="mt-1 text-gray-900">
                    {groupInfo?.createdAt ? formatDate(groupInfo.createdAt) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Members (
                {members.length}
                )
              </h3>
              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.id} className="flex items-center gap-3">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{member.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
