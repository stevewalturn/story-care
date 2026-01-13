'use client';

/**
 * Library Panel Component
 * Main container for session library with tabs for media, quotes, notes, and profile
 * Includes vertical navigation menu
 */

import type { LibraryPanelProps } from '../types/transcript.types';
import { ChevronDown, ChevronLeft, ChevronRight, Clapperboard, Image as ImageIcon, Music, Plus, Sparkles, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MediaTab } from './MediaTab';
import { NotesTab } from './NotesTab';
import { ProfileTab } from './ProfileTab';
import { QuotesTab } from './QuotesTab';

type ExtendedLibraryPanelProps = LibraryPanelProps & {
  onEditQuote?: (quote: any) => void;
  onDeleteQuote?: (quote: any) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onJumpToTimestamp?: (timestamp: number) => void; // Jump to audio position
  onOpenGenerateImage?: () => void;
  onOpenGenerateVideo?: () => void;
  onOpenGenerateMusicLyrical?: () => void;
  onOpenGenerateMusicInstrumental?: () => void;
  onOpenGenerateScene?: () => void;
};

export function LibraryPanel({
  sessionId,
  user,
  sessionData,
  onOpenUpload,
  refreshKey,
  onTaskComplete,
  onClose: _onClose, // Kept for backwards compatibility
  onSelectedPatientChange,
  onEditQuote,
  onDeleteQuote,
  isCollapsed = false,
  onToggleCollapse,
  onJumpToTimestamp,
  onOpenGenerateImage,
  onOpenGenerateVideo,
  onOpenGenerateMusicLyrical,
  onOpenGenerateMusicInstrumental,
  onOpenGenerateScene,
}: ExtendedLibraryPanelProps) {
  // Main tab state for switching between Media, Quotes, Notes, Profile
  const [activeTab, setActiveTab] = useState<'media' | 'quotes' | 'notes' | 'profile'>('media');
  // Media filter for Videos/Images/Musics tabs
  const [mediaFilter, setMediaFilter] = useState<'all' | 'videos' | 'images' | 'musics'>('all');
  // Patient dropdown state
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientDropdownRef = useRef<HTMLDivElement>(null);
  // Create dropdown state
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const createDropdownRef = useRef<HTMLDivElement>(null);

  // Get patients from sessionData
  // For individual sessions: sessionData.patient (single object)
  // For group sessions: sessionData.group.members (array)
  const patients = sessionData?.group?.members || (sessionData?.patient ? [sessionData.patient] : []);

  // Patient selector state - auto-select first patient if available
  const [selectedPatient, setSelectedPatient] = useState<string>(() => {
    if (patients.length > 0) {
      return patients[0].id;
    }
    return '';
  });

  // Update selected patient when patients data loads
  useEffect(() => {
    if (patients.length > 0 && (!selectedPatient || selectedPatient === 'all')) {
      setSelectedPatient(patients[0].id);
    }
  }, [patients, selectedPatient]);

  // Notify parent when selected patient changes
  useEffect(() => {
    if (selectedPatient && onSelectedPatientChange) {
      const patient = patients.find((p: any) => p.id === selectedPatient);
      if (patient) {
        onSelectedPatientChange({
          id: patient.id,
          name: patient.name || patient.speakerName || 'Unknown',
          avatarUrl: patient.avatarUrl,
          referenceImageUrl: patient.referenceImageUrl,
        });
      }
    }
  }, [selectedPatient, patients, onSelectedPatientChange]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setShowPatientDropdown(false);
      }
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target as Node)) {
        setShowCreateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get selected patient name for display
  const getSelectedPatientName = () => {
    const patient = patients.find((p: any) => p.id === selectedPatient);
    return patient?.name || patient?.speakerName || 'Select Patient';
  };

  // Get patient initial for avatar
  const getPatientInitial = (patient: any) => {
    const name = patient?.name || patient?.speakerName || 'U';
    return name.charAt(0).toUpperCase();
  };

  // Collapsed state - show thin strip with expand button
  if (isCollapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-l border-gray-200 bg-white py-3 transition-all duration-300">
        <button
          onClick={onToggleCollapse}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Expand panel"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // Full panel with vertical navigation menu on right
  return (
    <div className="flex h-full w-96 border-l border-gray-200 bg-white transition-all duration-300">
      {/* Left Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header - Compact */}
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#111827]">
                {activeTab === 'media' ? 'Media'
                  : activeTab === 'quotes' ? 'Quotes'
                    : activeTab === 'notes' ? 'Notes' : 'Profile'}
              </h2>
              {/* Show patient selector for ALL tabs */}
              <>
                <span className="text-gray-300">•</span>

                {patients.length === 1 ? (
                // Single patient: Show name without dropdown
                  <div className="flex items-center gap-1.5">
                    {(patients[0].avatarUrl || patients[0].referenceImageUrl) ? (
                      <img
                        src={patients[0].avatarUrl || patients[0].referenceImageUrl}
                        alt={patients[0].name || patients[0].speakerName || 'Unknown'}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-medium text-white">
                        {getPatientInitial(patients[0])}
                      </div>
                    )}
                    <span className="text-xs font-medium text-gray-700">
                      {patients[0].name || patients[0].speakerName || 'Unknown'}
                    </span>
                  </div>
                ) : (
                // Multiple patients: Show dropdown
                  <div className="relative" ref={patientDropdownRef}>
                    <button
                      onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                      className="flex items-center gap-1.5 text-xs text-gray-700 transition-colors hover:text-gray-900"
                    >
                      {/* Show patient photo or avatar */}
                      {(() => {
                        const patient = patients.find((p: any) => p.id === selectedPatient);
                        if (!patient) return null;
                        return (patient?.avatarUrl || patient?.referenceImageUrl) ? (
                          <img
                            src={patient.avatarUrl || patient.referenceImageUrl}
                            alt={getSelectedPatientName()}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-medium text-white">
                            {getPatientInitial(patient)}
                          </div>
                        );
                      })()}
                      <span className="font-medium">{getSelectedPatientName()}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showPatientDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showPatientDropdown && (
                      <div className="absolute top-full left-0 z-50 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                        {patients.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSelectedPatient(p.id);
                              setShowPatientDropdown(false);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-purple-50 hover:text-purple-700 ${
                              selectedPatient === p.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                            }`}
                          >
                            {(p.avatarUrl || p.referenceImageUrl) ? (
                              <img
                                src={p.avatarUrl || p.referenceImageUrl}
                                alt={p.name || p.speakerName || 'Unknown'}
                                className="h-5 w-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-medium text-white">
                                {getPatientInitial(p)}
                              </div>
                            )}
                            <span>{p.name || p.speakerName || 'Unknown'}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            </div>
            <div className="flex items-center gap-1">
              {/* Add/Upload Button - Only show on Media tab */}
              {activeTab === 'media' && (
                <button
                  onClick={onOpenUpload}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  title="Upload media"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              {/* Create/Generate Button - Only show on Media tab */}
              {activeTab === 'media' && (
                <div className="relative" ref={createDropdownRef}>
                  <button
                    onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    title="Create media"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                  {showCreateDropdown && (
                    <div className="absolute top-full right-0 z-50 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => {
                          onOpenGenerateImage?.();
                          setShowCreateDropdown(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Generate Image
                      </button>
                      <button
                        onClick={() => {
                          onOpenGenerateVideo?.();
                          setShowCreateDropdown(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
                      >
                        <Video className="h-4 w-4" />
                        Generate Video
                      </button>
                      <button
                        onClick={() => {
                          onOpenGenerateMusicLyrical?.();
                          setShowCreateDropdown(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
                      >
                        <Music className="h-4 w-4" />
                        Generate Music (Lyrical)
                      </button>
                      <button
                        onClick={() => {
                          onOpenGenerateMusicInstrumental?.();
                          setShowCreateDropdown(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
                      >
                        <Music className="h-4 w-4" />
                        Generate Music (Instrumental)
                      </button>
                      <button
                        onClick={() => {
                          onOpenGenerateScene?.();
                          setShowCreateDropdown(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
                      >
                        <Clapperboard className="h-4 w-4" />
                        Generate Scene
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* Collapse Button */}
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  title="Collapse panel"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search Input - Compact */}
          <div className="relative mb-2.5">
            <svg className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pr-10 pl-10 text-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none"
            />
            <button className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>

          {/* Media Sub-Tabs - Compact */}
          {activeTab === 'media' && (
            <div className="flex border-b border-gray-200">
              {['All', 'Videos', 'Images', 'Musics'].map((tab) => {
                const filterValue = tab.toLowerCase() as 'all' | 'videos' | 'images' | 'musics';
                const isActive = mediaFilter === filterValue;
                return (
                  <button
                    key={tab}
                    onClick={() => setMediaFilter(filterValue)}
                    className={`border-b-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'media' && (
          <MediaTab
            sessionId={sessionId}
            user={user}
            onOpenUpload={onOpenUpload}
            refreshKey={refreshKey}
            mediaFilter={mediaFilter}
            selectedPatient={selectedPatient}
            onTaskComplete={onTaskComplete}
          />
        )}

        {activeTab === 'quotes' && (
          <QuotesTab
            sessionId={sessionId}
            user={user}
            refreshKey={refreshKey}
            selectedPatient={selectedPatient}
            onEditQuote={onEditQuote}
            onDeleteQuote={onDeleteQuote}
            onJumpToTimestamp={onJumpToTimestamp}
          />
        )}

        {activeTab === 'notes' && (
          <NotesTab
            sessionId={sessionId}
            user={user}
            sessionData={sessionData}
            refreshKey={refreshKey}
            selectedPatient={selectedPatient}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            sessionData={sessionData}
            selectedPatient={selectedPatient}
          />
        )}
      </div>

      {/* Right Vertical Navigation Menu - Icons Only */}
      <div className="flex w-16 flex-col border-l border-gray-200 bg-white">
        {(['media', 'quotes', 'notes', 'profile'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const icons = {
            media: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            quotes: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            ),
            notes: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            profile: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ),
          };

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center justify-center py-4 transition-colors ${
                isActive
                  ? 'border-l-4 border-purple-600 text-purple-600'
                  : 'border-l-4 border-transparent text-gray-400 hover:text-gray-600'
              }`}
              title={tab.charAt(0).toUpperCase() + tab.slice(1)}
            >
              {icons[tab]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
