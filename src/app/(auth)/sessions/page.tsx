'use client';

import type { TherapeuticDomain } from '@/models/Schema';
import { Archive, Check, ChevronDown, MessageCircle, Mic, Plus, Search, SlidersHorizontal, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GroupDetailView } from '@/components/sessions/GroupDetailView';
import { PatientDetailView } from '@/components/sessions/PatientDetailView';
import { SessionActionMenu } from '@/components/sessions/SessionActionMenu';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog';
import { StackedAvatars } from '@/components/ui/StackedAvatars';
import { useAuth } from '@/contexts/AuthContext';

// Sort types
type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'sessions-desc' | 'sessions-asc';

type GroupMember = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type Session = {
  id: string;
  title: string;
  date: string;
  sessionDate: string; // The date set by user when creating the session
  type: 'individual' | 'group';
  patientId?: string | null;
  patientName?: string;
  patientAvatarUrl?: string;
  patientReferenceImageUrl?: string;
  groupId?: string | null;
  groupName?: string;
  groupMembers?: GroupMember[];
  sessionCount?: number;
  moduleName?: string;
  moduleDomain?: TherapeuticDomain;
  moduleId?: string;
  archivedAt?: string | null;
};

type SelectedPatient = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type SelectedGroup = {
  id: string;
  name: string;
  members: GroupMember[];
};

export default function SessionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'patients' | 'groups'>('all');
  const [archiveView, setArchiveView] = useState<'active' | 'archived'>('active');

  // Inline editing state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Delete confirmation state
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail view state
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup | null>(null);

  // Sort state
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Refs for click-outside handling
  const sortRef = useRef<HTMLDivElement>(null);

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSessions = useCallback(async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setIsLoading(true);
      const idToken = await user.getIdToken();
      const archivedParam = archiveView === 'archived' ? '&archived=true' : '';
      const response = await fetch(`/api/sessions?therapistId=${user.uid}${archivedParam}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        const formattedSessions = data.sessions.map((session: any) => ({
          id: session.id,
          title: session.title,
          date: session.lastOpenedAt
            ? new Date(session.lastOpenedAt).toISOString()
            : (session.updatedAt
                ? new Date(session.updatedAt).toISOString()
                : new Date(session.sessionDate).toLocaleDateString()),
          sessionDate: session.sessionDate,
          type: session.sessionType,
          patientId: session.patientId,
          patientName: session.patient?.name,
          patientAvatarUrl: session.patient?.avatarUrl,
          patientReferenceImageUrl: session.patient?.referenceImageUrl,
          groupId: session.groupId,
          groupName: session.group?.name,
          groupMembers: session.group?.members || [],
          sessionCount: 1,
          moduleId: session.moduleId,
          moduleName: session.module?.name,
          moduleDomain: session.module?.domain,
          archivedAt: session.archivedAt,
        }));

        setSessions(formattedSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, archiveView]);

  // Fetch sessions from API when user is available or archive view changes
  useEffect(() => {
    if (user?.uid) {
      fetchSessions();
    }
  }, [user, fetchSessions]);

  // Get patients with their session counts for card view
  const patientsWithSessions = useMemo(() => {
    const patientMap = new Map<string, {
      id: string;
      name: string;
      avatarUrl?: string;
      sessionCount: number;
      lastOpened: string;
    }>();

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

  // Get groups with their session counts and members for card view
  const groupsWithSessions = useMemo(() => {
    const groupMap = new Map<string, {
      id: string;
      name: string;
      members: GroupMember[];
      sessionCount: number;
      lastOpened: string;
    }>();

    sessions
      .filter(s => s.type === 'group' && s.groupId && s.groupName)
      .forEach((s) => {
        const existing = groupMap.get(s.groupId!);
        if (existing) {
          existing.sessionCount += 1;
          if (new Date(s.date) > new Date(existing.lastOpened)) {
            existing.lastOpened = s.date;
          }
          // Update members if we have more in this session
          if (s.groupMembers && s.groupMembers.length > existing.members.length) {
            existing.members = s.groupMembers;
          }
        } else {
          groupMap.set(s.groupId!, {
            id: s.groupId!,
            name: s.groupName!,
            members: s.groupMembers || [],
            sessionCount: 1,
            lastOpened: s.date,
          });
        }
      });

    return Array.from(groupMap.values()).sort((a, b) =>
      new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime(),
    );
  }, [sessions]);

  // Apply search and sort to patients
  const filteredAndSortedPatients = useMemo(() => {
    let result = [...patientsWithSessions];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'date-desc': return new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime();
        case 'date-asc': return new Date(a.lastOpened).getTime() - new Date(b.lastOpened).getTime();
        case 'sessions-desc': return b.sessionCount - a.sessionCount;
        case 'sessions-asc': return a.sessionCount - b.sessionCount;
        default: return 0;
      }
    });

    return result;
  }, [patientsWithSessions, searchTerm, sortOption]);

  // Apply search and sort to groups
  const filteredAndSortedGroups = useMemo(() => {
    let result = [...groupsWithSessions];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
        || g.members.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'date-desc': return new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime();
        case 'date-asc': return new Date(a.lastOpened).getTime() - new Date(b.lastOpened).getTime();
        case 'sessions-desc': return b.sessionCount - a.sessionCount;
        case 'sessions-asc': return a.sessionCount - b.sessionCount;
        default: return 0;
      }
    });

    return result;
  }, [groupsWithSessions, searchTerm, sortOption]);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Format session date nicely (e.g., "Jan 2, 2026")
  const formatSessionDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  // Get display name for groups - prefer custom name, fallback to member names
  const getDisplayGroupName = (group: { name?: string; members: GroupMember[] }) => {
    // If group has a custom name (not auto-generated pattern), use it
    if (group.name && !group.name.startsWith('Session - ')) {
      return group.name;
    }
    // Otherwise, generate from member names
    if (group.members.length > 0) {
      return group.members.map(m => m.name.split(' ')[0]).join(' + ');
    }
    return group.name || 'Unnamed Group';
  };

  // Get recent sessions (last 5 across all types)
  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [sessions]);

  // Get all sessions sorted for the "All" view
  const allSessionsSorted = useMemo(() => {
    let result = [...sessions];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(s =>
        s.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
        || s.groupName?.toLowerCase().includes(searchTerm.toLowerCase())
        || s.groupMembers?.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
        || s.title.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Helper to get display name for sorting
    const getDisplayName = (s: Session) => {
      if (s.type === 'group') {
        return s.groupName || s.groupMembers?.map(m => m.name).join(' + ') || '';
      }
      return s.patientName || '';
    };

    // Apply sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc': return getDisplayName(a).localeCompare(getDisplayName(b));
        case 'name-desc': return getDisplayName(b).localeCompare(getDisplayName(a));
        case 'date-desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
        // For sessions view, sessions-desc/asc sorts by date since individual sessions don't have count
        case 'sessions-desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'sessions-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
        default: return 0;
      }
    });

    return result;
  }, [sessions, searchTerm, sortOption]);

  // Handle patient card click
  const handlePatientClick = (patient: typeof patientsWithSessions[0]) => {
    setSelectedPatient({
      id: patient.id,
      name: patient.name,
      avatarUrl: patient.avatarUrl,
    });
  };

  // Handle group card click
  const handleGroupClick = (group: typeof groupsWithSessions[0]) => {
    setSelectedGroup({
      id: group.id,
      name: group.name,
      members: group.members,
    });
  };

  // Handle back from detail view
  const handleBack = () => {
    setSelectedPatient(null);
    setSelectedGroup(null);
  };

  // Handle new session with patient pre-selection
  const handleNewSession = (patientId?: string) => {
    if (patientId) {
      router.push(`/sessions/new?patientId=${patientId}`);
    } else {
      router.push('/sessions/new');
    }
  };

  // Session lifecycle handlers
  const handleSaveTitle = async (sessionId: string) => {
    if (!user?.uid || !editingTitle.trim()) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });
      if (response.ok) {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: editingTitle.trim() } : s));
      }
    } catch (error) {
      console.error('Error renaming session:', error);
    } finally {
      setEditingSessionId(null);
      setEditingTitle('');
    }
  };

  const handleArchiveSession = async (sessionId: string) => {
    if (!user?.uid) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/sessions/${sessionId}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (error) {
      console.error('Error archiving session:', error);
    }
  };

  const handleUnarchiveSession = async (sessionId: string) => {
    if (!user?.uid) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/sessions/${sessionId}/archive`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (error) {
      console.error('Error unarchiving session:', error);
    }
  };

  const handleDeleteSession = async () => {
    if (!user?.uid || !deleteSessionId) return;
    try {
      setIsDeleting(true);
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/sessions/${deleteSessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== deleteSessionId));
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    } finally {
      setIsDeleting(false);
      setDeleteSessionId(null);
    }
  };

  const deleteSessionTitle = sessions.find(s => s.id === deleteSessionId)?.title || 'this session';

  // Render detail view if selected
  if (selectedPatient) {
    return (
      <PatientDetailView
        patientId={selectedPatient.id}
        onBack={handleBack}
        onNewSession={() => handleNewSession(selectedPatient.id)}
      />
    );
  }

  if (selectedGroup) {
    return (
      <GroupDetailView
        groupId={selectedGroup.id}
        groupName={selectedGroup.name}
        members={selectedGroup.members}
        onBack={handleBack}
      />
    );
  }

  // Main sessions list view
  return (
    <div className="relative p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review therapy sessions with transcripts, notes, and audio uploads.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push('/sessions/recordings/new')}
            >
              <Mic className="mr-2 h-5 w-5" />
              Record
            </Button>
            <Button
              variant="primary"
              onClick={() => handleNewSession()}
            >
              <Plus className="mr-2 h-5 w-5" />
              New Session
            </Button>
          </div>
        </div>

        {/* Active / Archived Toggle */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setArchiveView('active')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              archiveView === 'active'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setArchiveView('archived')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              archiveView === 'archived'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            Archived
          </button>
        </div>

        {/* Recent Sessions Section */}
        {archiveView === 'active' && recentSessions.length > 0 && (
          <div className="mt-6 mb-4">
            <h2 className="mb-3 text-sm font-medium text-gray-700">Recent</h2>
            <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex gap-3 overflow-x-auto pb-2">
              {recentSessions.map(session => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => router.push(`/sessions/${session.id}/transcript`)}
                  className="flex min-w-[200px] flex-shrink-0 flex-col rounded-lg border border-gray-200 bg-white p-3 text-left transition-all hover:border-purple-300 hover:bg-purple-50"
                >
                  {/* Session type badge + avatar */}
                  <div className="mb-2 flex items-center gap-2">
                    {session.type === 'group'
                      ? (
                          <StackedAvatars members={session.groupMembers || []} size="sm" maxVisible={3} />
                        )
                      : (
                          session.patientAvatarUrl || session.patientReferenceImageUrl
                            ? (
                                <img
                                  src={session.patientAvatarUrl || session.patientReferenceImageUrl}
                                  alt={session.patientName || ''}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              )
                            : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                                  <span className="text-sm font-medium text-purple-700">
                                    {session.patientName?.charAt(0) || '?'}
                                  </span>
                                </div>
                              )
                        )}
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {session.type === 'group' ? 'Group' : 'Individual'}
                    </span>
                  </div>
                  {/* Session name */}
                  <p className="truncate text-sm font-medium text-gray-900">
                    {session.type === 'group'
                      ? getDisplayGroupName({ name: session.groupName, members: session.groupMembers || [] })
                      : session.patientName}
                  </p>
                  {/* Session date */}
                  {session.sessionDate && (
                    <p className="text-xs text-gray-600">
                      {formatSessionDate(session.sessionDate)}
                    </p>
                  )}
                  {/* Time ago */}
                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatRelativeTime(session.date)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All / Individuals / Groups Tabs - Underlined style */}
        <div className="mt-4 flex gap-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              viewMode === 'all'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setViewMode('patients')}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              viewMode === 'patients'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Individuals
          </button>
          <button
            type="button"
            onClick={() => setViewMode('groups')}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              viewMode === 'groups'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div className="flex-1" />

        {/* Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Sort by
            <ChevronDown className={`h-4 w-4 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {sortDropdownOpen && (
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
              {[
                { value: 'date-desc' as const, label: 'Last opened (newest)' },
                { value: 'date-asc' as const, label: 'Last opened (oldest)' },
                { value: 'name-asc' as const, label: 'Name (A-Z)' },
                { value: 'name-desc' as const, label: 'Name (Z-A)' },
                { value: 'sessions-desc' as const, label: 'Most sessions' },
                { value: 'sessions-asc' as const, label: 'Least sessions' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSortOption(option.value);
                    setSortDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                    sortOption === option.value ? 'bg-purple-50 text-purple-600' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                  {sortOption === option.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Grid View */}
      {isLoading
        ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
              <p className="text-gray-500">Loading sessions...</p>
            </div>
          )
        : viewMode === 'all'
          ? (
              // All Sessions View (Unified chronological list)
              allSessionsSorted.length === 0
                ? (
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        {archiveView === 'archived'
                          ? <Archive className="h-8 w-8 text-gray-400" />
                          : <Users className="h-8 w-8 text-gray-400" />}
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-gray-900">
                        {archiveView === 'archived'
                          ? 'No archived sessions'
                          : sessions.length === 0 ? 'No sessions yet' : 'No matching sessions'}
                      </h3>
                      <p className="mb-6 text-gray-500">
                        {archiveView === 'archived'
                          ? 'Sessions you archive will appear here'
                          : sessions.length === 0 ? 'Create a session to get started' : 'Try adjusting your search'}
                      </p>
                      {archiveView === 'active' && sessions.length === 0 ? (
                        <Button
                          variant="primary"
                          onClick={() => handleNewSession()}
                        >
                          <Plus className="mr-2 h-5 w-5" />
                          New Session
                        </Button>
                      ) : archiveView === 'active' && searchTerm ? (
                        <Button
                          variant="secondary"
                          onClick={() => setSearchTerm('')}
                        >
                          Clear search
                        </Button>
                      ) : null}
                    </div>
                  )
                : (
                    <div className="space-y-2">
                      {allSessionsSorted.map(session => (
                        <div
                          key={session.id}
                          className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition-all hover:border-purple-300 hover:bg-purple-50"
                        >
                          {/* Clickable area */}
                          <button
                            type="button"
                            onClick={() => router.push(`/sessions/${session.id}/transcript`)}
                            className="flex min-w-0 flex-1 items-center gap-3"
                          >
                            {/* Avatar */}
                            {session.type === 'group'
                              ? (
                                  <StackedAvatars members={session.groupMembers || []} size="md" maxVisible={3} />
                                )
                              : (
                                  session.patientAvatarUrl || session.patientReferenceImageUrl
                                    ? (
                                        <img
                                          src={session.patientAvatarUrl || session.patientReferenceImageUrl}
                                          alt={session.patientName || ''}
                                          className="h-10 w-10 rounded-full object-cover"
                                        />
                                      )
                                    : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                                          <span className="text-sm font-medium text-purple-700">
                                            {session.patientName?.charAt(0) || '?'}
                                          </span>
                                        </div>
                                      )
                                )}

                            {/* Session info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium text-gray-900">
                                  {session.type === 'group'
                                    ? getDisplayGroupName({ name: session.groupName, members: session.groupMembers || [] })
                                    : session.patientName}
                                </p>
                                {session.sessionDate && (
                                  <span className="text-sm text-gray-500">
                                    {formatSessionDate(session.sessionDate)}
                                  </span>
                                )}
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                  {session.type === 'group' ? 'Group' : 'Individual'}
                                </span>
                              </div>
                              {editingSessionId === session.id
                                ? (
                                    <input
                                      type="text"
                                      value={editingTitle}
                                      onChange={e => setEditingTitle(e.target.value)}
                                      onBlur={() => handleSaveTitle(session.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle(session.id);
                                        if (e.key === 'Escape') {
                                          setEditingSessionId(null);
                                          setEditingTitle('');
                                        }
                                      }}
                                      onClick={e => e.stopPropagation()}
                                      // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: user just clicked Rename
                                      autoFocus
                                      className="w-full rounded border border-purple-300 px-1.5 py-0.5 text-sm text-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                                    />
                                  )
                                : (
                                    <p className="truncate text-sm text-gray-500">{session.title}</p>
                                  )}
                            </div>

                            {/* Date */}
                            <p className="text-sm whitespace-nowrap text-gray-500">
                              {formatRelativeTime(session.date)}
                            </p>
                          </button>

                          {/* Action Menu */}
                          <SessionActionMenu
                            isArchived={archiveView === 'archived'}
                            onRename={() => {
                              setEditingSessionId(session.id);
                              setEditingTitle(session.title);
                            }}
                            onArchive={() => handleArchiveSession(session.id)}
                            onUnarchive={() => handleUnarchiveSession(session.id)}
                            onDelete={() => setDeleteSessionId(session.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )
            )
          : viewMode === 'patients'
            ? (
                // Patients View
                filteredAndSortedPatients.length === 0
                  ? (
                      <div className="py-16 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">
                          {patientsWithSessions.length === 0 ? 'No patients yet' : 'No matching patients'}
                        </h3>
                        <p className="mb-6 text-gray-500">
                          {patientsWithSessions.length === 0 ? 'Create a session to get started' : 'Try adjusting your search'}
                        </p>
                        {patientsWithSessions.length === 0 ? (
                          <Button
                            variant="primary"
                            onClick={() => handleNewSession()}
                          >
                            <Plus className="mr-2 h-5 w-5" />
                            New Session
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={() => setSearchTerm('')}
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    )
                  : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {filteredAndSortedPatients.map(patient => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => handlePatientClick(patient)}
                            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-purple-200 hover:shadow-md"
                          >
                            {/* Avatar - Large circular */}
                            {patient.avatarUrl
                              ? (
                                  <img
                                    src={patient.avatarUrl}
                                    alt={patient.name}
                                    className="h-14 w-14 rounded-full object-cover"
                                  />
                                )
                              : (
                                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-lg font-medium text-white">
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
                            <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600">
                              <MessageCircle className="h-4 w-4" />
                              {patient.sessionCount}
                              {' '}
                              {patient.sessionCount === 1 ? 'Session' : 'Sessions'}
                            </div>
                          </button>
                        ))}
                      </div>
                    )
              )
            : (
              // Groups View
                filteredAndSortedGroups.length === 0
                  ? (
                      <div className="py-16 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">
                          {groupsWithSessions.length === 0 ? 'No groups yet' : 'No matching groups'}
                        </h3>
                        <p className="mb-6 text-gray-500">
                          {groupsWithSessions.length === 0 ? 'Create a group session to get started' : 'Try adjusting your search'}
                        </p>
                        {groupsWithSessions.length === 0 ? (
                          <Button
                            variant="primary"
                            onClick={() => handleNewSession()}
                          >
                            <Plus className="mr-2 h-5 w-5" />
                            New Group Session
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={() => setSearchTerm('')}
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    )
                  : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {filteredAndSortedGroups.map(group => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => handleGroupClick(group)}
                            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-purple-200 hover:shadow-md"
                          >
                            {/* Top row: Stacked avatars + session count */}
                            <div className="flex items-center justify-between">
                              <StackedAvatars members={group.members} size="md" maxVisible={3} />
                              <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600">
                                <MessageCircle className="h-4 w-4" />
                                {group.sessionCount}
                                {' '}
                                {group.sessionCount === 1 ? 'Session' : 'Sessions'}
                              </div>
                            </div>

                            {/* Group name and last opened */}
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {getDisplayGroupName(group)}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Last opened
                                {' '}
                                {formatRelativeTime(group.lastOpened)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
              )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationDialog
        isOpen={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        onConfirm={handleDeleteSession}
        title="Delete Session"
        message={`Are you sure you want to delete "${deleteSessionTitle}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
