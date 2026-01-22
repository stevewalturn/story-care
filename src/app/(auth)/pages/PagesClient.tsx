'use client';

import {
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Edit2,
  FileText,
  Link2,
  Plus,
  QrCode,
  Search,
  Share2,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedDelete, authenticatedFetch, authenticatedPost, authenticatedPut } from '@/utils/AuthenticatedFetch';
import 'react-day-picker/dist/style.css';

type StoryPage = {
  id: string;
  title: string;
  patientName: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  blockCount: number;
  status: 'draft' | 'published' | 'archived';
  patientId: string;
};

type Patient = {
  id: string;
  name: string;
};

export function PagesClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [showPatientsFilter, setShowPatientsFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  // Refs for filter buttons
  const patientsButtonRef = useRef<HTMLDivElement>(null);
  const statusButtonRef = useRef<HTMLDivElement>(null);

  // Dropdown positions
  const [patientsFilterPos, setPatientsFilterPos] = useState({ top: 0, left: 0 });
  const [statusFilterPos, setStatusFilterPos] = useState({ top: 0, left: 0 });

  // Selection mode states for bulk operations
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePageId, setSharePageId] = useState<string | null>(null);
  const [shareLinks, setShareLinks] = useState<any[]>([]);
  const [loadingShare, setLoadingShare] = useState(false);
  const [expiryMinutes, setExpiryMinutes] = useState(60);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/pages', user);
      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      const data = await response.json();
      setPages(data.pages.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      })));
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPatients = useCallback(async () => {
    if (!user) return;

    try {
      const response = await authenticatedFetch('/api/patients', user);
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();
      setPatients(data.patients);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      setPatients([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPages();
      fetchPatients();
    }
  }, [user, fetchPages, fetchPatients]);

  // Helper function to close all dropdowns
  const closeAllDropdowns = () => {
    setShowPatientsFilter(false);
    setShowStatusFilter(false);
  };

  // Toggle functions with mutual exclusivity
  const togglePatientsFilter = () => {
    const newState = !showPatientsFilter;
    setShowStatusFilter(false);
    setShowPatientsFilter(newState);
  };

  const toggleStatusFilter = () => {
    const newState = !showStatusFilter;
    setShowPatientsFilter(false);
    setShowStatusFilter(newState);
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutside
        = !patientsButtonRef.current?.contains(target)
          && !statusButtonRef.current?.contains(target);

      const clickedElement = event.target as HTMLElement;
      const isInsideDropdown = clickedElement.closest('.fixed.z-50');

      if (isOutside && !isInsideDropdown) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate position for Patients filter
  useEffect(() => {
    if (showPatientsFilter && patientsButtonRef.current) {
      const rect = patientsButtonRef.current.getBoundingClientRect();
      const dropdownWidth = 256;
      let left = rect.left;

      if (left + dropdownWidth > window.innerWidth - 16) {
        left = window.innerWidth - dropdownWidth - 16;
      }

      setPatientsFilterPos({
        top: rect.bottom + 8,
        left: Math.max(16, left),
      });
    }
  }, [showPatientsFilter]);

  // Calculate position for Status filter
  useEffect(() => {
    if (showStatusFilter && statusButtonRef.current) {
      const rect = statusButtonRef.current.getBoundingClientRect();
      const dropdownWidth = 200;
      let left = rect.left;

      if (left + dropdownWidth > window.innerWidth - 16) {
        left = window.innerWidth - dropdownWidth - 16;
      }

      setStatusFilterPos({
        top: rect.bottom + 8,
        left: Math.max(16, left),
      });
    }
  }, [showStatusFilter]);

  // Filter pages based on search, patient, and status
  const filteredPages = useMemo(() => {
    let filtered = pages;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        page =>
          page.title.toLowerCase().includes(search)
          || page.patientName?.toLowerCase().includes(search),
      );
    }

    // Patient filter
    if (selectedPatientIds.length > 0) {
      filtered = filtered.filter(page => selectedPatientIds.includes(page.patientId));
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(page => page.status === selectedStatus);
    }

    return filtered;
  }, [pages, searchTerm, selectedPatientIds, selectedStatus]);

  // Get recent pages for "Continue Your Work" section
  const recentPages = useMemo(() => {
    return [...pages]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 3);
  }, [pages]);

  // Group pages by patient
  const groupedPages = useMemo(() => {
    const groups: Record<string, { patient: { id: string; name: string }; pages: StoryPage[] }> = {};

    filteredPages.forEach((page) => {
      const patientId = page.patientId || 'unassigned';
      if (!groups[patientId]) {
        groups[patientId] = {
          patient: {
            id: patientId,
            name: page.patientName || 'Unassigned',
          },
          pages: [],
        };
      }
      groups[patientId].pages.push(page);
    });

    return Object.values(groups).sort((a, b) =>
      a.patient.name.localeCompare(b.patient.name),
    );
  }, [filteredPages]);

  // Selection mode handlers
  const togglePageSelection = (pageId: string) => {
    setSelectedPageIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedPageIds(new Set());
    setIsSelectionMode(false);
  };

  // Navigate to create new page (full screen)
  const handleCreatePage = () => {
    router.push('/pages/new');
  };

  // Navigate to edit page (full screen)
  const handleEditPage = (pageId: string) => {
    router.push(`/pages/${pageId}/edit`);
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) {
      return;
    }

    try {
      const response = await authenticatedDelete(`/api/pages/${pageId}`, user);

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      await fetchPages();
    } catch (error) {
      console.error('Failed to delete page:', error);
      alert('Failed to delete page. Please try again.');
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedPageIds.size === 0) return;

    const count = selectedPageIds.size;
    if (!confirm(`Delete ${count} page${count > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      for (const pageId of selectedPageIds) {
        const response = await authenticatedDelete(`/api/pages/${pageId}`, user);
        if (!response.ok) {
          throw new Error('Failed to delete page');
        }
      }

      setSelectedPageIds(new Set());
      setIsSelectionMode(false);
      await fetchPages();
    } catch (error) {
      alert('Failed to delete some pages. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (pageId: string, currentStatus: 'draft' | 'published' | 'archived') => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const action = newStatus === 'published' ? 'publish' : 'unpublish';

    try {
      const response = await authenticatedPut(`/api/pages/${pageId}`, user, { status: newStatus });

      if (!response.ok) {
        throw new Error(`Failed to ${action} page`);
      }

      await fetchPages();
    } catch (error) {
      console.error(`Failed to ${action} page:`, error);
      alert(`Failed to ${action} page. Please try again.`);
    }
  };

  const handleOpenShareModal = async (pageId: string) => {
    setSharePageId(pageId);
    setShowShareModal(true);
    await fetchShareLinks(pageId);
  };

  const fetchShareLinks = async (pageId: string) => {
    setLoadingShare(true);
    try {
      const response = await authenticatedFetch(`/api/pages/${pageId}/share`, user);
      if (response.ok) {
        const data = await response.json();
        setShareLinks(data.shareLinks || []);
      }
    } catch (error) {
      console.error('Failed to fetch share links:', error);
    } finally {
      setLoadingShare(false);
    }
  };

  const handleCreateShareLink = async () => {
    if (!sharePageId) return;

    setLoadingShare(true);
    try {
      const response = await authenticatedPost(`/api/pages/${sharePageId}/share`, user, {
        expiryMinutes,
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      await fetchShareLinks(sharePageId);
    } catch (error) {
      console.error('Failed to create share link:', error);
      alert('Failed to create share link. Please try again.');
    } finally {
      setLoadingShare(false);
    }
  };

  const handleRevokeShareLink = async (linkId: string) => {
    if (!sharePageId) return;

    try {
      const response = await authenticatedDelete(`/api/pages/${sharePageId}/share/${linkId}`, user);

      if (!response.ok) {
        throw new Error('Failed to revoke share link');
      }

      await fetchShareLinks(sharePageId);
    } catch (error) {
      console.error('Failed to revoke share link:', error);
      alert('Failed to revoke share link. Please try again.');
    }
  };

  const handleCopyLink = (shareUrl: string, linkId: string) => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(linkId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  // Get avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-pink-100 text-pink-600',
      'bg-yellow-100 text-yellow-600',
      'bg-indigo-100 text-indigo-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="relative p-8">
      {/* Full-screen Loading Overlay for Bulk Delete */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            <p className="text-lg font-medium text-gray-900">Deleting pages...</p>
            <p className="mt-1 text-sm text-gray-500">Please wait</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Story Pages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back,
            {' '}
            {user?.displayName || 'Therapist'}
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
          <Button variant="primary" onClick={handleCreatePage}>
            <Plus className="mr-2 h-5 w-5" />
            Create Page
          </Button>
        </div>
      </div>

      {/* Continue Your Work Section */}
      {recentPages.length > 0 && !loading && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Clock className="h-4 w-4" />
            Continue Your Work
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentPages.map(page => (
              <div
                key={page.id}
                onClick={() => handleEditPage(page.id)}
                className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${getAvatarColor(page.patientName || 'U')}`}>
                    <span className="text-sm font-semibold">{getInitials(page.patientName || 'U')}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-gray-900">{page.title}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">{page.patientName || 'Unassigned'}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                      <span>{formatDate(page.updatedAt)}</span>
                      <span>•</span>
                      <span>
                        {page.blockCount}
                        {' '}
                        blocks
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[300px] flex-1">
          <Input
            placeholder="Search by title or patient name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-gray-400" />}
          />
        </div>

        {/* Patients Filter */}
        <div className="relative" ref={patientsButtonRef}>
          <Button
            variant="secondary"
            className={`justify-start gap-2 ${selectedPatientIds.length > 0 ? 'border-purple-500 bg-purple-50' : ''}`}
            onClick={togglePatientsFilter}
          >
            <Users className="h-4 w-4" />
            Patients
            {selectedPatientIds.length > 0 && (
              <span className="ml-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                {selectedPatientIds.length}
              </span>
            )}
          </Button>
          {showPatientsFilter && (
            <div
              className="fixed z-50 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
              style={{ top: `${patientsFilterPos.top}px`, left: `${patientsFilterPos.left}px` }}
            >
              <div className="mb-2 text-sm font-medium text-gray-700">Select Patients</div>
              {patients.length === 0 ? (
                <p className="text-sm text-gray-500">No patients found</p>
              ) : (
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {patients.map(patient => (
                    <label key={patient.id} className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedPatientIds.includes(patient.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPatientIds([...selectedPatientIds, patient.id]);
                          } else {
                            setSelectedPatientIds(selectedPatientIds.filter(id => id !== patient.id));
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{patient.name}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2 border-t border-gray-200 pt-3">
                <button
                  onClick={() => {
                    setSelectedPatientIds([]);
                    setShowPatientsFilter(false);
                  }}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowPatientsFilter(false)}
                  className="flex-1 rounded-md bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative" ref={statusButtonRef}>
          <Button
            variant="secondary"
            className={`justify-start gap-2 ${selectedStatus !== 'all' ? 'border-purple-500 bg-purple-50' : ''}`}
            onClick={toggleStatusFilter}
          >
            <FileText className="h-4 w-4" />
            {selectedStatus === 'all' ? 'All Status' : selectedStatus === 'published' ? 'Published' : 'Draft'}
          </Button>
          {showStatusFilter && (
            <div
              className="fixed z-50 w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
              style={{ top: `${statusFilterPos.top}px`, left: `${statusFilterPos.left}px` }}
            >
              {['all', 'draft', 'published'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status as 'all' | 'draft' | 'published');
                    setShowStatusFilter(false);
                  }}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedStatus === status
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {isSelectionMode && selectedPageIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-purple-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-purple-700">
              {selectedPageIds.size}
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

      {/* Patient-Grouped Page List */}
      {filteredPages.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            {searchTerm || selectedPatientIds.length > 0 || selectedStatus !== 'all' ? (
              <Search className="h-8 w-8 text-gray-400" />
            ) : (
              <FileText className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            {searchTerm || selectedPatientIds.length > 0 || selectedStatus !== 'all'
              ? 'No pages found'
              : 'No story pages yet'}
          </h3>
          <p className="mb-6 text-gray-500">
            {searchTerm || selectedPatientIds.length > 0 || selectedStatus !== 'all'
              ? 'Try adjusting your filters or search'
              : 'Create interactive story pages for your patients'}
          </p>
          {!searchTerm && selectedPatientIds.length === 0 && selectedStatus === 'all' && (
            <Button variant="primary" onClick={handleCreatePage}>
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Page
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedPages.map(group => (
            <div
              key={group.patient.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-sm"
            >
              {/* Patient Header */}
              <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-6 py-4">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${getAvatarColor(group.patient.name)}`}>
                  <span className="text-sm font-semibold">{getInitials(group.patient.name)}</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{group.patient.name}</h3>
                  <p className="text-sm text-gray-500">
                    {group.pages.length}
                    {' '}
                    {group.pages.length === 1 ? 'page' : 'pages'}
                  </p>
                </div>
              </div>

              {/* Pages Grid */}
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
                {group.pages.map(page => (
                  <div
                    key={page.id}
                    className={`group relative overflow-hidden rounded-lg border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                      selectedPageIds.has(page.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    {isSelectionMode && (
                      <div className="absolute top-3 left-3 z-10">
                        <input
                          type="checkbox"
                          checked={selectedPageIds.has(page.id)}
                          onChange={() => togglePageSelection(page.id)}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    )}

                    {/* Card Header */}
                    <div
                      className={`cursor-pointer border-b border-gray-100 bg-gradient-to-br from-purple-50 to-indigo-50 p-4 ${isSelectionMode ? 'pl-10' : ''}`}
                      onClick={() => !isSelectionMode && handleEditPage(page.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-semibold text-gray-900">
                            {page.title}
                          </h4>
                        </div>
                        <div className={`ml-2 flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          page.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        >
                          {page.status === 'published' ? 'Published' : 'Draft'}
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4">
                      <div className="mb-3 flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>
                            {page.blockCount}
                            {' '}
                            blocks
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(page.updatedAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPage(page.id);
                          }}
                          className="flex-1"
                        >
                          <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant={page.status === 'published' ? 'ghost' : 'primary'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePublish(page.id, page.status);
                          }}
                          title={page.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {page.status === 'published' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenShareModal(page.id);
                          }}
                          title="Share"
                        >
                          <Share2 className="h-4 w-4 text-purple-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(page.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Share Page</h3>
                <p className="text-sm text-gray-600">Create time-limited shareable links</p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {/* Create New Link */}
              <div className="mb-6 rounded-xl border border-purple-200 bg-purple-50 p-4">
                <h4 className="mb-3 font-medium text-purple-900">Create New Share Link</h4>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Expires in (minutes)
                    </label>
                    <input
                      type="number"
                      value={expiryMinutes}
                      onChange={e => setExpiryMinutes(parseInt(e.target.value) || 60)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      placeholder="60"
                      min="1"
                      max="10080"
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      Common: 60 (1 hour), 1440 (1 day), 10080 (7 days)
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleCreateShareLink}
                    disabled={loadingShare}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Generate Link
                  </Button>
                </div>
              </div>

              {/* Active Share Links */}
              <div>
                <h4 className="mb-3 font-medium text-gray-900">Active Share Links</h4>
                {loadingShare && (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                  </div>
                )}

                {!loadingShare && shareLinks.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-gray-300 py-12 text-center">
                    <Link2 className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                    <p className="text-sm text-gray-600">No active share links</p>
                    <p className="text-xs text-gray-500">Create a link above to get started</p>
                  </div>
                )}

                {!loadingShare && shareLinks.length > 0 && (
                  <div className="space-y-3">
                    {shareLinks.map((link) => {
                      const isExpired = link.isExpired || new Date(link.expiresAt) < new Date();
                      return (
                        <div
                          key={link.id}
                          className={`rounded-xl border p-4 ${
                            isExpired ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                isExpired
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                              >
                                {isExpired ? 'Expired' : 'Active'}
                              </span>
                              <span className="text-xs text-gray-600">
                                Expires:
                                {' '}
                                {new Date(link.expiresAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {!isExpired && (
                                <>
                                  <button
                                    onClick={() => setShowQrCode(showQrCode === link.id ? null : link.id)}
                                    className={`rounded-lg p-2 transition-colors ${showQrCode === link.id ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100 hover:text-purple-600'}`}
                                    title="Show QR Code"
                                  >
                                    <QrCode className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCopyLink(link.shareUrl, link.id)}
                                    className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-purple-600"
                                    title="Copy link"
                                  >
                                    {copiedLink === link.id ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleRevokeShareLink(link.id)}
                                className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-red-100 hover:text-red-600"
                                title="Revoke link"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* QR Code Section */}
                          {showQrCode === link.id && !isExpired && (
                            <div className="mb-3 flex flex-col items-center rounded-lg border border-purple-200 bg-purple-50 p-4">
                              <div className="rounded-lg bg-white p-3 shadow-sm">
                                <QRCodeSVG
                                  value={link.shareUrl}
                                  size={180}
                                  level="H"
                                  includeMargin
                                />
                              </div>
                              <p className="mt-3 text-center text-sm text-purple-700">
                                Scan to open story page on mobile
                              </p>
                            </div>
                          )}

                          <div className="group relative">
                            <input
                              type="text"
                              value={link.shareUrl}
                              readOnly
                              className="w-full truncate rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                            />
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                            <span>
                              Duration:
                              {link.expiryDurationMinutes}
                              {' '}
                              minutes
                            </span>
                            <span>
                              Accessed:
                              {link.accessCount}
                              {' '}
                              times
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-gray-200 p-4">
              <Button variant="ghost" onClick={() => setShowShareModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
