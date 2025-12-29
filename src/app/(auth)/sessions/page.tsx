'use client';

import type { TherapeuticDomain } from '@/models/Schema';
import { ArrowRight, Clock, Filter, Plus, Search, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AssignModuleModal } from '@/components/sessions/AssignModuleModal';
import { SessionCard } from '@/components/sessions/SessionCard';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

type Session = {
  id: string;
  title: string;
  date: string;
  type: 'individual' | 'group';
  patientId?: string | null;
  patientName?: string;
  patientAvatarUrl?: string;
  patientReferenceImageUrl?: string;
  groupId?: string | null;
  groupName?: string;
  sessionCount?: number;
  moduleName?: string;
  moduleDomain?: TherapeuticDomain;
  moduleId?: string;
};

export default function SessionsPage() {
  const { user } = useAuth();
  const [_isAssignModuleModalOpen, setIsAssignModuleModalOpen] = useState(false);
  const [selectedSessionForModule, setSelectedSessionForModule] = useState<Session | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'patients' | 'groups'>('patients');

  // Selection mode states for bulk delete
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch sessions from API when user is available
  useEffect(() => {
    if (user?.uid) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setIsLoading(true);
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/sessions?therapistId=${user.uid}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        const formattedSessions = data.sessions.map((session: any) => ({
          id: session.id,
          title: session.title,
          date: new Date(session.sessionDate).toLocaleDateString(),
          type: session.sessionType,
          patientId: session.patientId,
          patientName: session.patient?.name,
          patientAvatarUrl: session.patient?.avatarUrl,
          patientReferenceImageUrl: session.patient?.referenceImageUrl,
          groupId: session.groupId,
          groupName: session.group?.name,
          sessionCount: 1, // TODO: Calculate from database
          moduleId: session.moduleId,
          moduleName: session.module?.name,
          moduleDomain: session.module?.domain,
        }));

        setSessions(formattedSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get recent sessions for "Continue Your Work" section (top 3)
  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [sessions]);

  // Get patients with their session counts for card view
  const patientsWithSessions = useMemo(() => {
    const patientMap = new Map<string, { id: string; name: string; avatarUrl?: string; sessionCount: number; lastOpened: string }>();

    sessions
      .filter(s => s.type === 'individual' && s.patientId && s.patientName)
      .forEach((s) => {
        const existing = patientMap.get(s.patientId!);
        if (existing) {
          existing.sessionCount += 1;
          if (new Date(s.date) > new Date(existing.lastOpened)) {
            existing.lastOpened = s.date;
          }
        } else {
          patientMap.set(s.patientId!, {
            id: s.patientId!,
            name: s.patientName!,
            avatarUrl: s.patientAvatarUrl || s.patientReferenceImageUrl,
            sessionCount: 1,
            lastOpened: s.date,
          });
        }
      });

    return Array.from(patientMap.values()).sort((a, b) =>
      new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime(),
    );
  }, [sessions]);

  // Get groups with their session counts for card view
  const groupsWithSessions = useMemo(() => {
    const groupMap = new Map<string, { id: string; name: string; sessionCount: number; lastOpened: string }>();

    sessions
      .filter(s => s.type === 'group' && s.groupId && s.groupName)
      .forEach((s) => {
        const existing = groupMap.get(s.groupId!);
        if (existing) {
          existing.sessionCount += 1;
          if (new Date(s.date) > new Date(existing.lastOpened)) {
            existing.lastOpened = s.date;
          }
        } else {
          groupMap.set(s.groupId!, {
            id: s.groupId!,
            name: s.groupName!,
            sessionCount: 1,
            lastOpened: s.date,
          });
        }
      });

    return Array.from(groupMap.values()).sort((a, b) =>
      new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime(),
    );
  }, [sessions]);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const clearSelection = () => {
    setSelectedSessionIds(new Set());
    setIsSelectionMode(false);
  };

  // Single session delete (without confirmation, used for bulk)
  const handleDeleteSessionSingle = async (sessionId: string) => {
    if (!user?.uid) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedSessionIds.size === 0) return;

    const count = selectedSessionIds.size;
    if (!confirm(`Delete ${count} session${count > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete all selected sessions
      for (const sessionId of selectedSessionIds) {
        await handleDeleteSessionSingle(sessionId);
      }

      // Clear selection and exit selection mode
      setSelectedSessionIds(new Set());
      setIsSelectionMode(false);
      await fetchSessions();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete some sessions. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // TODO: Assign module handler - reserved for future implementation
  // const handleAssignModule = (session: Session) => {
  //   setSelectedSessionForModule(session);
  //   setIsAssignModuleModalOpen(true);
  // };

  const handleModuleAssigned = async () => {
    setIsAssignModuleModalOpen(false);
    setSelectedSessionForModule(null);
    await fetchSessions();
  };

  return (
    <div className="relative p-8">
      {/* Full-screen Loading Overlay for Bulk Delete */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            <p className="text-lg font-medium text-gray-900">Deleting sessions...</p>
            <p className="mt-1 text-sm text-gray-500">Please wait</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your therapy sessions by patient or group
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (isSelectionMode) {
                  clearSelection();
                } else {
                  setIsSelectionMode(true);
                }
              }}
            >
              {isSelectionMode ? 'Done' : 'Select'}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                window.location.href = '/sessions/new';
              }}
            >
              <Plus className="mr-2 h-5 w-5" />
              New Session
            </Button>
          </div>
        </div>

        {/* Patients / Groups Tabs */}
        <div className="mt-6 flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode('patients')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'patients'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Patients
          </button>
          <button
            type="button"
            onClick={() => setViewMode('groups')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'groups'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Continue Your Work Section */}
      {recentSessions.length > 0 && !isLoading && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Clock className="h-4 w-4" />
            Continue Your Work
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentSessions.map(session => (
              <SessionCard
                key={session.id}
                {...session}
                compact
                onClick={() => {
                  window.location.href = `/sessions/${session.id}/transcript`;
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
        </button>
        <select className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
          <option>Sort by</option>
          <option>Name A-Z</option>
          <option>Name Z-A</option>
          <option>Most Sessions</option>
          <option>Last Opened</option>
        </select>
      </div>

      {/* Bulk Delete Action Bar */}
      {isSelectionMode && selectedSessionIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-purple-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-purple-700">
              {selectedSessionIds.size}
              {' '}
              selected
            </span>
            <button
              onClick={clearSelection}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
          <Button
            variant="primary"
            onClick={handleBulkDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Card Grid View */}
      {isLoading
        ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
              <p className="text-gray-500">Loading sessions...</p>
            </div>
          )
        : viewMode === 'patients'
          ? (
              // Patients View
              patientsWithSessions.length === 0
                ? (
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-gray-900">No patients yet</h3>
                      <p className="mb-6 text-gray-500">Create a session to get started</p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          window.location.href = '/sessions/new';
                        }}
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        New Session
                      </Button>
                    </div>
                  )
                : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {patientsWithSessions
                        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(patient => (
                          <Link
                            key={patient.id}
                            href={`/admin/patients/${patient.id}`}
                            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-purple-200 hover:shadow-md"
                          >
                            {/* Avatar */}
                            {patient.avatarUrl
                              ? (
                                  <img
                                    src={patient.avatarUrl}
                                    alt={patient.name}
                                    className="h-12 w-12 rounded-full object-cover"
                                  />
                                )
                              : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-sm font-medium text-white">
                                    {getInitials(patient.name)}
                                  </div>
                                )}

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-gray-900">{patient.name}</h3>
                              <p className="text-sm text-gray-500">
                                Last opened
                                {' '}
                                {formatRelativeTime(patient.lastOpened)}
                              </p>
                            </div>

                            {/* Session Badge */}
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
                                {patient.sessionCount}
                                {' '}
                                {patient.sessionCount === 1 ? 'Session' : 'Sessions'}
                              </span>
                              <ArrowRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </Link>
                        ))}
                    </div>
                  )
            )
          : (
              // Groups View
              groupsWithSessions.length === 0
                ? (
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-gray-900">No groups yet</h3>
                      <p className="mb-6 text-gray-500">Create a group session to get started</p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          window.location.href = '/sessions/new';
                        }}
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        New Group Session
                      </Button>
                    </div>
                  )
                : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {groupsWithSessions
                        .filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(group => (
                          <div
                            key={group.id}
                            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-purple-200 hover:shadow-md"
                          >
                            {/* Group Icon */}
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                              <Users className="h-5 w-5" />
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-gray-900">{group.name}</h3>
                              <p className="text-sm text-gray-500">
                                Last opened
                                {' '}
                                {formatRelativeTime(group.lastOpened)}
                              </p>
                            </div>

                            {/* Session Badge */}
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                                {group.sessionCount}
                                {' '}
                                {group.sessionCount === 1 ? 'Session' : 'Sessions'}
                              </span>
                              <ArrowRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        ))}
                    </div>
                  )
            )}

      {/* Assign Module Modal */}
      {selectedSessionForModule && (
        <AssignModuleModal
          sessionId={selectedSessionForModule.id}
          sessionTitle={selectedSessionForModule.title}
          currentModuleId={selectedSessionForModule.moduleId}
          onClose={() => {
            setIsAssignModuleModalOpen(false);
            setSelectedSessionForModule(null);
          }}
          onAssigned={handleModuleAssigned}
        />
      )}
    </div>
  );
}
