'use client';

import {
  ChevronDown,
  Clapperboard,
  FileText,
  Image as ImageIcon,
  Music,
  Search,
  StickyNote,
  User,
  Video,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type AssetType = 'media' | 'quotes' | 'notes' | 'scenes';
type MediaTypeFilter = 'all' | 'image' | 'video' | 'audio';

type Patient = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type MediaAsset = {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
  title: string | null;
  createdAt: string;
};

type QuoteAsset = {
  id: string;
  quoteText: string;
  context: string | null;
  tags: string[];
  createdAt: string;
};

type NoteAsset = {
  id: string;
  title: string | null;
  content: string;
  tags: string[] | null;
  createdAt: string;
};

type SceneAsset = {
  id: string;
  title: string;
  description: string | null;
  assembledVideoUrl: string | null; // API returns assembledVideoUrl, not videoUrl
  thumbnailUrl: string | null;
  durationSeconds: string | null; // API returns durationSeconds as string
  status: string;
  createdAt: string;
};

type AssetPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: { type: AssetType; data: MediaAsset | QuoteAsset | NoteAsset | SceneAsset }) => void;
  patientId?: string;
  filterType?: 'image' | 'video' | 'text' | 'all';
};

export function AssetPickerModal({
  isOpen,
  onClose,
  onSelect,
  patientId,
  filterType = 'all',
}: AssetPickerModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AssetType>('media');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>('all');
  const [search, setSearch] = useState('');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [quoteAssets, setQuoteAssets] = useState<QuoteAsset[]>([]);
  const [noteAssets, setNoteAssets] = useState<NoteAsset[]>([]);
  const [sceneAssets, setSceneAssets] = useState<SceneAsset[]>([]);
  const [loading, setLoading] = useState(false);

  // Patient filter state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | 'all'>(patientId || 'all');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Fetch patients list
  useEffect(() => {
    if (isOpen && user) {
      fetchPatients();
    }
  }, [isOpen, user]);

  // Update selected patient when prop changes
  useEffect(() => {
    if (patientId) {
      setSelectedPatientId(patientId);
    }
  }, [patientId]);

  // Auto-set media type filter AND active tab based on filterType prop
  // Also trigger immediate fetch with correct values to avoid race condition
  useEffect(() => {
    if (!isOpen) return; // Only run when modal is open

    let newMediaType: MediaTypeFilter = 'all';
    let newTab: AssetType = activeTab;

    if (filterType === 'image') {
      newMediaType = 'image';
      newTab = 'media';
    } else if (filterType === 'video') {
      newMediaType = 'video';
      newTab = 'media';
    } else if (filterType === 'text') {
      newMediaType = 'all';
      newTab = 'quotes'; // Default to quotes tab for text/quote blocks
    }

    setMediaTypeFilter(newMediaType);
    setActiveTab(newTab);

    // Fetch immediately with correct values to avoid race condition
    fetchAssets({ overrideTab: newTab, overrideMediaType: newMediaType });
  }, [filterType, isOpen]);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await authenticatedFetch('/api/patients', user);
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen, activeTab, selectedPatientId, mediaTypeFilter]);

  // Clear search when switching tabs
  useEffect(() => {
    setSearch('');
  }, [activeTab]);

  const fetchAssets = async (options?: {
    overrideTab?: AssetType;
    overrideMediaType?: MediaTypeFilter;
  }) => {
    const tab = options?.overrideTab ?? activeTab;
    const mediaType = options?.overrideMediaType ?? mediaTypeFilter;

    setLoading(true);
    try {
      const patientParam = selectedPatientId !== 'all' ? selectedPatientId : '';

      if (tab === 'media') {
        const params = new URLSearchParams();
        if (patientParam) params.append('patientId', patientParam);
        if (mediaType !== 'all') params.append('type', mediaType);
        const url = `/api/media${params.toString() ? `?${params.toString()}` : ''}`;
        console.log('[AssetPickerModal] Fetching media from:', url, 'mediaType:', mediaType);
        const res = await authenticatedFetch(url, user);
        if (res.ok) {
          const data = await res.json();
          console.log('[AssetPickerModal] Media count:', data.media?.length || 0);
          setMediaAssets(data.media || []);
        } else {
          console.error('[AssetPickerModal] Media fetch failed:', res.status, res.statusText);
        }
      } else if (tab === 'quotes') {
        const url = `/api/quotes${patientParam ? `?patientId=${patientParam}` : ''}`;
        const res = await authenticatedFetch(url, user);
        if (res.ok) {
          const data = await res.json();
          setQuoteAssets(data.quotes || []);
        }
      } else if (tab === 'notes') {
        const url = `/api/notes${patientParam ? `?patientId=${patientParam}` : ''}`;
        const res = await authenticatedFetch(url, user);
        if (res.ok) {
          const data = await res.json();
          setNoteAssets(data.notes || []);
        }
      } else if (tab === 'scenes') {
        const url = `/api/scenes${patientParam ? `?patientId=${patientParam}` : ''}`;
        const res = await authenticatedFetch(url, user);
        if (res.ok) {
          const data = await res.json();
          setSceneAssets(data.scenes || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (asset: MediaAsset | QuoteAsset | NoteAsset | SceneAsset) => {
    onSelect({ type: activeTab, data: asset });
    onClose();
  };

  const filteredMediaAssets = mediaAssets.filter((asset) => {
    if (filterType !== 'all' && filterType !== asset.mediaType) return false;
    if (!search) return true;
    return asset.title?.toLowerCase().includes(search.toLowerCase());
  });

  const filteredQuoteAssets = quoteAssets.filter((asset) => {
    if (filterType !== 'all' && filterType !== 'text') return false;
    if (!search) return true;
    return asset.quoteText.toLowerCase().includes(search.toLowerCase());
  });

  const filteredNoteAssets = noteAssets.filter((asset) => {
    if (filterType !== 'all' && filterType !== 'text') return false;
    if (!search) return true;
    return asset.content.toLowerCase().includes(search.toLowerCase())
      || asset.title?.toLowerCase().includes(search.toLowerCase());
  });

  const filteredSceneAssets = sceneAssets.filter((asset) => {
    if (!search) return true;
    return asset.title.toLowerCase().includes(search.toLowerCase())
      || asset.description?.toLowerCase().includes(search.toLowerCase());
  });

  const getSelectedPatientName = () => {
    if (selectedPatientId === 'all') return 'All Patients';
    const patient = patients.find(p => p.id === selectedPatientId);
    return patient?.name || 'Select Patient';
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Browse Assets Library</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Patient Filter */}
        <div className="border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Filter by patient:</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {selectedPatientId !== 'all' ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-xs font-medium text-white">
                    {getInitials(getSelectedPatientName())}
                  </div>
                ) : (
                  <User className="h-4 w-4 text-gray-400" />
                )}
                <span className="max-w-[150px] truncate">{getSelectedPatientName()}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {showPatientDropdown && (
                <div className="absolute top-full left-0 z-10 mt-1 max-h-60 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatientId('all');
                      setShowPatientDropdown(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                      selectedPatientId === 'all' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                    }`}
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    All Patients
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  {loadingPatients
                    ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Loading patients...</div>
                      )
                    : patients.length === 0
                      ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No patients found</div>
                        )
                      : (
                          patients.map(patient => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => {
                                setSelectedPatientId(patient.id);
                                setShowPatientDropdown(false);
                              }}
                              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                                selectedPatientId === patient.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                              }`}
                            >
                              {patient.avatarUrl
                                ? (
                                    <img
                                      src={patient.avatarUrl}
                                      alt={patient.name}
                                      className="h-6 w-6 rounded-full object-cover"
                                    />
                                  )
                                : (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-xs font-medium text-white">
                                      {getInitials(patient.name)}
                                    </div>
                                  )}
                              <span className="truncate">{patient.name}</span>
                            </button>
                          ))
                        )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex border-b border-gray-200">
          {(filterType === 'all' || filterType === 'image' || filterType === 'video') && (
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'media'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              Media
            </button>
          )}
          {(filterType === 'all' || filterType === 'text') && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('quotes')}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'quotes'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="h-4 w-4" />
                Quotes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <StickyNote className="h-4 w-4" />
                Notes
              </button>
            </>
          )}
          {filterType === 'all' && (
            <button
              type="button"
              onClick={() => setActiveTab('scenes')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'scenes'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clapperboard className="h-4 w-4" />
              Scenes
            </button>
          )}
        </div>

        {/* Media Type Sub-tabs (only shown for Media tab when filterType is 'all') */}
        {activeTab === 'media' && filterType === 'all' && (
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-6 py-2">
            <span className="text-xs font-medium text-gray-500">Type:</span>
            <div className="flex gap-1">
              {[
                { value: 'all', label: 'All', icon: ImageIcon },
                { value: 'image', label: 'Images', icon: ImageIcon },
                { value: 'video', label: 'Videos', icon: Video },
                { value: 'audio', label: 'Audio', icon: Music },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMediaTypeFilter(value as MediaTypeFilter)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    mediaTypeFilter === value
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="border-b border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={
                activeTab === 'media' ? 'Search media files...'
                  : activeTab === 'quotes' ? 'Search quotes...'
                    : activeTab === 'notes' ? 'Search notes...'
                      : 'Search scenes...'
              }
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
          ) : activeTab === 'media' ? (
            // Media Grid
            <div className="grid grid-cols-3 gap-4">
              {filteredMediaAssets.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelect(asset)}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 transition-all hover:border-purple-500 hover:shadow-lg"
                >
                  {asset.mediaType === 'image' ? (
                    <img src={asset.mediaUrl} alt={asset.title || 'Media'} className="h-full w-full object-cover" />
                  ) : asset.mediaType === 'video' ? (
                    <div className="flex h-full flex-col items-center justify-center bg-gray-100">
                      <Video className="h-12 w-12 text-gray-400" />
                      <span className="mt-2 text-xs text-gray-500">Video</span>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center bg-gray-100">
                      <Music className="h-12 w-12 text-gray-400" />
                      <span className="mt-2 text-xs text-gray-500">Audio</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/50">
                    <span className="translate-y-4 text-sm font-medium text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                      Select
                    </span>
                  </div>
                  {/* Media type badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      asset.mediaType === 'image' ? 'bg-blue-100 text-blue-700'
                        : asset.mediaType === 'video' ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                    >
                      {asset.mediaType}
                    </span>
                  </div>
                </button>
              ))}
              {filteredMediaAssets.length === 0 && (
                <div className="col-span-3 py-12 text-center">
                  <ImageIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <p className="text-sm font-medium text-gray-900">No media assets found</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedPatientId !== 'all'
                      ? 'Try selecting a different patient or "All Patients"'
                      : 'Upload some media to get started'}
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === 'quotes' ? (
            // Quotes List
            <div className="space-y-3">
              {filteredQuoteAssets.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelect(asset)}
                  className="w-full rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-purple-500 hover:shadow-md"
                >
                  <div className="prose prose-sm prose-gray max-w-none line-clamp-4 text-gray-900">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {`"${asset.quoteText}"`}
                    </ReactMarkdown>
                  </div>
                  {asset.context && (
                    <p className="mt-2 text-xs text-gray-600">{asset.context}</p>
                  )}
                  {asset.tags && asset.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {asset.tags.map((tag, i) => (
                        <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
              {filteredQuoteAssets.length === 0 && (
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <p className="text-sm font-medium text-gray-900">No quotes found</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedPatientId !== 'all'
                      ? 'Try selecting a different patient or "All Patients"'
                      : 'Save some quotes to get started'}
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === 'notes' ? (
            // Notes List
            <div className="space-y-3">
              {filteredNoteAssets.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelect(asset)}
                  className="w-full rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-purple-500 hover:shadow-md"
                >
                  {asset.title && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {asset.title}
                      </span>
                    </div>
                  )}
                  <div className="prose prose-sm prose-gray max-w-none line-clamp-6 text-gray-900">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {asset.content}
                    </ReactMarkdown>
                  </div>
                  {asset.tags && asset.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {asset.tags.map((tag, i) => (
                        <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
              {filteredNoteAssets.length === 0 && (
                <div className="py-12 text-center">
                  <StickyNote className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <p className="text-sm font-medium text-gray-900">No notes found</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedPatientId !== 'all'
                      ? 'Try selecting a different patient or "All Patients"'
                      : 'Save some notes to get started'}
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === 'scenes' ? (
            // Scenes Grid
            <div className="grid grid-cols-2 gap-4">
              {filteredSceneAssets.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelect(asset)}
                  className="group overflow-hidden rounded-lg border border-gray-200 transition-all hover:border-purple-500 hover:shadow-lg"
                >
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    {asset.thumbnailUrl ? (
                      <img src={asset.thumbnailUrl} alt={asset.title} className="h-full w-full object-cover" />
                    ) : asset.assembledVideoUrl ? (
                      <div className="flex h-full items-center justify-center bg-gray-900">
                        <Clapperboard className="h-12 w-12 text-white opacity-50" />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Clapperboard className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {asset.durationSeconds && Number(asset.durationSeconds) > 0 && (
                      <div className="absolute right-2 bottom-2 rounded bg-black/75 px-2 py-1 text-xs text-white">
                        {Math.floor(Number(asset.durationSeconds) / 60)}
                        :
                        {(Number(asset.durationSeconds) % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-gray-900">{asset.title}</p>
                    {asset.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">{asset.description}</p>
                    )}
                  </div>
                </button>
              ))}
              {filteredSceneAssets.length === 0 && (
                <div className="col-span-2 py-12 text-center">
                  <Clapperboard className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <p className="text-sm font-medium text-gray-900">No scenes found</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedPatientId !== 'all'
                      ? 'Try selecting a different patient or "All Patients"'
                      : 'Create some scenes to get started'}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 p-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Click outside to close patient dropdown */}
      {showPatientDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowPatientDropdown(false)}
        />
      )}
    </div>
  );
}
