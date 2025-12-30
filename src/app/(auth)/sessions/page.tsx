'use client';

import type { TherapeuticDomain } from '@/models/Schema';
import { Check, ChevronDown, Filter, MessageCircle, Plus, Search, SlidersHorizontal, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GroupDetailView } from '@/components/sessions/GroupDetailView';
import { PatientDetailView } from '@/components/sessions/PatientDetailView';
import { Button } from '@/components/ui/Button';
import { StackedAvatars } from '@/components/ui/StackedAvatars';
import { useAuth } from '@/contexts/AuthContext';

// Filter and Sort types
type SessionCountFilter = 'all' | '1-5' | '6-10' | '10+';
type LastActivityFilter = 'all' | '7d' | '30d' | '3m';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'patients' | 'groups'>('patients');

  // Detail view state
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup | null>(null);

  // Filter and Sort state
  const [sessionCountFilter, setSessionCountFilter] = useState<SessionCountFilter>('all');
  const [lastActivityFilter, setLastActivityFilter] = useState<LastActivityFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Refs for click-outside handling
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          groupMembers: session.group?.members || [],
          sessionCount: 1,
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

  // Apply filters and sort to patients
  const filteredAndSortedPatients = useMemo(() => {
    let result = [...patientsWithSessions];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Apply session count filter
    if (sessionCountFilter !== 'all') {
      result = result.filter((p) => {
        switch (sessionCountFilter) {
          case '1-5': return p.sessionCount >= 1 && p.sessionCount <= 5;
          case '6-10': return p.sessionCount >= 6 && p.sessionCount <= 10;
          case '10+': return p.sessionCount > 10;
          default: return true;
        }
      });
    }

    // Apply last activity filter
    if (lastActivityFilter !== 'all') {
      const now = new Date();
      result = result.filter((p) => {
        const lastDate = new Date(p.lastOpened);
        const diffInDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        switch (lastActivityFilter) {
          case '7d': return diffInDays <= 7;
          case '30d': return diffInDays <= 30;
          case '3m': return diffInDays <= 90;
          default: return true;
        }
      });
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
  }, [patientsWithSessions, searchTerm, sessionCountFilter, lastActivityFilter, sortOption]);

  // Apply filters and sort to groups
  const filteredAndSortedGroups = useMemo(() => {
    let result = [...groupsWithSessions];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
        || g.members.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Apply session count filter
    if (sessionCountFilter !== 'all') {
      result = result.filter((g) => {
        switch (sessionCountFilter) {
          case '1-5': return g.sessionCount >= 1 && g.sessionCount <= 5;
          case '6-10': return g.sessionCount >= 6 && g.sessionCount <= 10;
          case '10+': return g.sessionCount > 10;
          default: return true;
        }
      });
    }

    // Apply last activity filter
    if (lastActivityFilter !== 'all') {
      const now = new Date();
      result = result.filter((g) => {
        const lastDate = new Date(g.lastOpened);
        const diffInDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        switch (lastActivityFilter) {
          case '7d': return diffInDays <= 7;
          case '30d': return diffInDays <= 30;
          case '3m': return diffInDays <= 90;
          default: return true;
        }
      });
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
  }, [groupsWithSessions, searchTerm, sessionCountFilter, lastActivityFilter, sortOption]);

  // Check if any filters are active
  const hasActiveFilters = sessionCountFilter !== 'all' || lastActivityFilter !== 'all';

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

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

  // Render detail view if selected
  if (selectedPatient) {
    return (
      <PatientDetailView
        patientId={selectedPatient.id}
        onBack={handleBack}
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

        {/* Patients / Groups Tabs - Underlined style */}
        <div className="mt-6 flex gap-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setViewMode('patients')}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              viewMode === 'patients'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Patients
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

        {/* Filter Dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => {
              setFilterDropdownOpen(!filterDropdownOpen);
              setSortDropdownOpen(false);
            }}
            className={`flex h-10 items-center gap-2 rounded-lg border px-4 text-sm transition-colors hover:bg-gray-50 ${
              hasActiveFilters
                ? 'border-purple-500 bg-purple-50 text-purple-600'
                : 'border-gray-300 text-gray-600'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filter
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs text-white">
                {(sessionCountFilter !== 'all' ? 1 : 0) + (lastActivityFilter !== 'all' ? 1 : 0)}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {filterDropdownOpen && (
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
              {/* Session Count Filter */}
              <div className="border-b border-gray-100 p-3">
                <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Session Count</p>
                {[
                  { value: 'all' as const, label: 'All' },
                  { value: '1-5' as const, label: '1-5 sessions' },
                  { value: '6-10' as const, label: '6-10 sessions' },
                  { value: '10+' as const, label: '10+ sessions' },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSessionCountFilter(option.value)}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-gray-50 ${
                      sessionCountFilter === option.value ? 'text-purple-600' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                    {sessionCountFilter === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>

              {/* Last Activity Filter */}
              <div className="p-3">
                <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Last Activity</p>
                {[
                  { value: 'all' as const, label: 'All time' },
                  { value: '7d' as const, label: 'Last 7 days' },
                  { value: '30d' as const, label: 'Last 30 days' },
                  { value: '3m' as const, label: 'Last 3 months' },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLastActivityFilter(option.value)}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-gray-50 ${
                      lastActivityFilter === option.value ? 'text-purple-600' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                    {lastActivityFilter === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="border-t border-gray-100 p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSessionCountFilter('all');
                      setLastActivityFilter('all');
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => {
              setSortDropdownOpen(!sortDropdownOpen);
              setFilterDropdownOpen(false);
            }}
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
                        {patientsWithSessions.length === 0 ? 'Create a session to get started' : 'Try adjusting your filters'}
                      </p>
                      {patientsWithSessions.length === 0 ? (
                        <Button
                          variant="primary"
                          onClick={() => {
                            window.location.href = '/sessions/new';
                          }}
                        >
                          <Plus className="mr-2 h-5 w-5" />
                          New Session
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSessionCountFilter('all');
                            setLastActivityFilter('all');
                            setSearchTerm('');
                          }}
                        >
                          Clear filters
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
                        {groupsWithSessions.length === 0 ? 'Create a group session to get started' : 'Try adjusting your filters'}
                      </p>
                      {groupsWithSessions.length === 0 ? (
                        <Button
                          variant="primary"
                          onClick={() => {
                            window.location.href = '/sessions/new';
                          }}
                        >
                          <Plus className="mr-2 h-5 w-5" />
                          New Group Session
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSessionCountFilter('all');
                            setLastActivityFilter('all');
                            setSearchTerm('');
                          }}
                        >
                          Clear filters
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
                              {group.members.length > 0
                                ? group.members.map(m => m.name.split(' ')[0]).join(', ')
                                : group.name}
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
    </div>
  );
}
