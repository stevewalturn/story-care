'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  mediaType: 'image' | 'video' | 'audio';
  mediaUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  sourceType: string;
  tags: string[] | null;
  createdAt: string;
  patientName: string;
};

export function AssetsClient() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'media' | 'quotes' | 'notes' | 'profile'>('media');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [patients, setPatients] = useState<any[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [notesData, setNotesData] = useState<any[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio'>('all');

  // Load patients on mount (only when user is available)
  useEffect(() => {
    if (user) {
      loadPatients();
    }
  }, [user]);

  // Load media when patient or filters change
  useEffect(() => {
    if (selectedPatient && activeTab === 'media') {
      loadMedia();
    }
  }, [selectedPatient, activeTab, filterType, searchQuery]);

  // Load quotes when patient changes and on quotes tab
  useEffect(() => {
    if (selectedPatient && activeTab === 'quotes') {
      loadQuotes();
    }
  }, [selectedPatient, activeTab, searchQuery]);

  // Load notes when patient changes and on notes tab
  useEffect(() => {
    if (selectedPatient && activeTab === 'notes') {
      loadNotes();
    }
  }, [selectedPatient, activeTab, searchQuery]);

  const loadPatients = async () => {
    if (!user) {
      return;
    }

    try {
      // Pass the therapist's Firebase UID to filter patients
      const params = new URLSearchParams({
        therapistId: user.uid,
      });

      const response = await authenticatedFetch(`/api/patients?${params.toString()}`, user);
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
        if (data.patients && data.patients.length > 0) {
          setSelectedPatient(data.patients[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadMedia = async () => {
    try {
      setIsLoadingMedia(true);
      const params = new URLSearchParams({
        patientId: selectedPatient,
      });

      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await authenticatedFetch(`/api/media?${params.toString()}`, user);
      if (response.ok) {
        const data = await response.json();
        setMedia(data.media || []);
      }
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const loadQuotes = async () => {
    try {
      setIsLoadingQuotes(true);
      const params = new URLSearchParams({
        patientId: selectedPatient,
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await authenticatedFetch(`/api/quotes?${params.toString()}`, user);
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const loadNotes = async () => {
    try {
      setIsLoadingNotes(true);
      const params = new URLSearchParams({
        patientId: selectedPatient,
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await authenticatedFetch(`/api/notes?${params.toString()}`, user);
      if (response.ok) {
        const data = await response.json();
        setNotesData(data.notes || []);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'today';
    }
    if (diffDays === 1) {
      return '1 day ago';
    }
    if (diffDays < 30) {
      return `${diffDays} days ago`;
    }
    if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} months ago`;
    }
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Get counts by type
  const videosCount = media.filter(m => m.mediaType === 'video').length;
  const imagesCount = media.filter(m => m.mediaType === 'image').length;
  const audioCount = media.filter(m => m.mediaType === 'audio').length;

  const selectedPatientData = patients.find(p => p.id === selectedPatient);

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
            <p className="mt-1 text-sm text-gray-500">Browse and manage patient content across sessions</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Import
            </button>
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Create Media
            </button>
          </div>
        </div>

        {/* Patient Selector */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">Viewing library for:</span>
          <select
            value={selectedPatient}
            onChange={e => setSelectedPatient(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
          >
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="-mb-px flex gap-1 border-b border-gray-200">
          {['Media', 'Quotes', 'Notes', 'Profile'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase() as any)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Media Tab */}
      {activeTab === 'media' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Controls */}
          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedPatientData?.name}
                's Library
              </h2>
              <div className="flex items-center gap-2">
                <button className="text-gray-500 hover:text-gray-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search media..."
                  className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <svg className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={filterSource}
                onChange={e => setFilterSource(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Sources</option>
                <option value="generated">Generated</option>
                <option value="uploaded">Uploaded</option>
              </select>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
              </select>
            </div>

            {/* Type Filters */}
            <div className="flex gap-4 text-sm">
              <button
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
              >
                All (
                {media.length}
                )
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={filterType === 'video' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
              >
                Videos (
                {videosCount}
                )
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={filterType === 'image' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
              >
                Images (
                {imagesCount}
                )
              </button>
              <button
                onClick={() => setFilterType('audio')}
                className={filterType === 'audio' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
              >
                Music (
                {audioCount}
                )
              </button>
            </div>
          </div>

          {/* Media Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingMedia ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                <p className="text-sm text-gray-500">Loading media...</p>
              </div>
            ) : media.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">No media found</p>
                <p className="mt-1 text-xs text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {media.map(item => (
                  <div
                    key={item.id}
                    className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-indigo-300 hover:shadow-lg"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gray-100">
                      {item.mediaType === 'video'
                        ? (
                            <>
                              <img
                                src={item.thumbnailUrl || item.mediaUrl}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 transition-colors group-hover:bg-indigo-600">
                                  <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                  </svg>
                                </div>
                              </div>
                              {item.durationSeconds && (
                                <div className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                                  {Math.floor(item.durationSeconds / 60)}
                                  :
                                  {(item.durationSeconds % 60).toString().padStart(2, '0')}
                                </div>
                              )}
                            </>
                          )
                        : item.mediaType === 'image'
                          ? (
                              <img
                                src={item.thumbnailUrl || item.mediaUrl}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            )
                          : (
                              <div className="flex h-full items-center justify-center">
                                <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                              </div>
                            )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="capitalize">{item.mediaType}</span>
                        <span>•</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      {item.description && (
                        <p className="mb-3 line-clamp-2 text-xs text-gray-600">
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {item.tags && item.tags.length > 0 && item.tags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.sourceType && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {item.sourceType.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quotes Tab */}
      {activeTab === 'quotes' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedPatientData?.name}
                's Quotes
              </h2>
              <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                + New Quote
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search quotes..."
                className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <svg className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {isLoadingQuotes
              ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                    <p className="text-sm text-gray-500">Loading quotes...</p>
                  </div>
                )
              : quotes.length === 0
                ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-gray-500">No quotes found</p>
                    </div>
                  )
                : (
                    <div className="space-y-4">
                      {quotes.map(quote => (
                        <div
                          key={quote.id}
                          className="rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-sm"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-900">
                                {quote.speakerName || 'Unknown'}
                              </span>
                              {quote.startTimeSeconds && (
                                <span className="text-sm text-gray-500">
                                  {Math.floor(Number(quote.startTimeSeconds) / 60)}
                                  :
                                  {(Number(quote.startTimeSeconds) % 60).toFixed(0).padStart(2, '0')}
                                  {' '}
                                  -
                                  {Math.floor(Number(quote.endTimeSeconds) / 60)}
                                  :
                                  {(Number(quote.endTimeSeconds) % 60).toFixed(0).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {quote.priority && (
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                  quote.priority === 'high'
                                    ? 'bg-red-100 text-red-700'
                                    : quote.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-gray-100 text-gray-700'
                                }`}
                                >
                                  {quote.priority}
                                  -Priority
                                </span>
                              )}
                              <button className="text-gray-400 hover:text-gray-600">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <p className="mb-4 text-base leading-relaxed whitespace-pre-wrap text-gray-700">
                            {quote.quoteText}
                          </p>

                          {quote.tags && quote.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {quote.tags.map((tag: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-5xl p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedPatientData?.name ? `${selectedPatientData.name}'s Notes` : 'Notes'}
              </h2>
              <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                + New Note
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notes by title or content..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <svg className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Loading State */}
            {isLoadingNotes && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                <p className="text-sm text-gray-500">Loading notes...</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingNotes && notesData.length === 0 && (
              <div className="py-12 text-center">
                <svg className="mx-auto mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'No notes found matching your search' : 'No notes yet'}
                </p>
              </div>
            )}

            {/* Notes List */}
            {!isLoadingNotes && notesData.length > 0 && (
              <div className="space-y-4">
                {notesData.map(note => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-md"
                  >
                    {/* Note Header */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-1 text-base font-semibold text-gray-900">
                          {note.title || 'Untitled Note'}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{formatDate(note.createdAt)}</span>
                          {note.updatedAt && note.updatedAt !== note.createdAt && (
                            <>
                              <span>•</span>
                              <span>
                                Updated
                                {formatDate(note.updatedAt)}
                              </span>
                            </>
                          )}
                          {note.sessionTitle && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {note.sessionTitle}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <button className="text-gray-400 transition-colors hover:text-gray-600">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>

                    {/* Note Content */}
                    <p className="mb-3 text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                      {note.content}
                    </p>

                    {/* Tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {note.tags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-4xl p-6">
            {selectedPatientData ? (
              <div className="space-y-6">
                {/* Profile Header Card */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600" />
                  <div className="px-6 pb-6">
                    <div className="-mt-12 mb-4 flex items-start">
                      <div className="relative">
                        {selectedPatientData.referenceImageUrl
                          ? (
                              <img
                                src={selectedPatientData.referenceImageUrl}
                                alt={selectedPatientData.name}
                                className="h-24 w-24 rounded-full border-4 border-white object-cover"
                              />
                            )
                          : (
                              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-indigo-100">
                                <span className="text-3xl font-semibold text-indigo-600">
                                  {selectedPatientData.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                      </div>
                      <div className="ml-4 flex-1 pt-14">
                        <h2 className="text-2xl font-bold text-gray-900">{selectedPatientData.name}</h2>
                        <p className="text-sm text-gray-500">{selectedPatientData.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Information Card */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Patient Information</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium tracking-wide text-gray-500 uppercase">
                        Patient ID
                      </label>
                      <p className="font-mono text-sm text-gray-900">{selectedPatientData.id}</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium tracking-wide text-gray-500 uppercase">
                        Email
                      </label>
                      <p className="text-sm text-gray-900">{selectedPatientData.email}</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium tracking-wide text-gray-500 uppercase">
                        Account Created
                      </label>
                      <p className="text-sm text-gray-900">{formatDate(selectedPatientData.createdAt)}</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium tracking-wide text-gray-500 uppercase">
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-900">{formatDate(selectedPatientData.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Reference Image Card */}
                {selectedPatientData.referenceImageUrl && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Reference Image</h3>
                    <p className="mb-4 text-sm text-gray-600">
                      This image is used as a reference for AI-generated content to ensure visual consistency.
                    </p>
                    <div className="relative mx-auto w-full max-w-md">
                      <img
                        src={selectedPatientData.referenceImageUrl}
                        alt="Reference image"
                        className="h-auto w-full rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>
                )}

                {/* Statistics Card */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Content Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-lg bg-blue-50 p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{media.length}</div>
                      <div className="mt-1 text-xs text-gray-600">Media Items</div>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{quotes.length}</div>
                      <div className="mt-1 text-xs text-gray-600">Quotes</div>
                    </div>
                    <div className="rounded-lg bg-green-50 p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{notesData.length}</div>
                      <div className="mt-1 text-xs text-gray-600">Notes</div>
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {media.filter((m: any) => m.mediaType === 'image').length}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">Images</div>
                    </div>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200">
                      Edit Profile
                    </button>
                    <button className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200">
                      Update Reference Image
                    </button>
                    <button className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100">
                      View Sessions
                    </button>
                    <button className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100">
                      View Story Pages
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <svg className="mx-auto mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-sm text-gray-500">Please select a patient to view their profile</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
