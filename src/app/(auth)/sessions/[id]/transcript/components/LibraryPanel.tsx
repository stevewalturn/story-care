'use client';

/**
 * Library Panel Component
 * Main container for session library with tabs for media, quotes, notes, and profile
 * Collapsible panel that defaults to hidden
 */

import type { LibraryPanelProps } from '../types/transcript.types';
import { useState } from 'react';
import { MediaTab } from './MediaTab';
import { NotesTab } from './NotesTab';
import { ProfileTab } from './ProfileTab';
import { QuotesTab } from './QuotesTab';

export function LibraryPanel({
  sessionId,
  user,
  sessionData,
  onOpenUpload,
  refreshKey,
}: LibraryPanelProps) {
  const [activeTab, setActiveTab] = useState<'media' | 'quotes' | 'notes' | 'profile'>('media');
  const [isExpanded, setIsExpanded] = useState(false); // Default: hidden

  // Collapsed state - thin vertical bar
  if (!isExpanded) {
    return (
      <div className="flex h-full w-14 flex-col items-center justify-start border-l border-gray-200 bg-white shadow-sm transition-all duration-300">
        <button
          onClick={() => setIsExpanded(true)}
          className="group relative mt-4 flex w-full flex-col items-center gap-3 py-4 transition-all duration-200 hover:bg-gray-50"
          title="Expand Library"
        >
          {/* Icon with background */}
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-50 transition-all duration-200 group-hover:bg-purple-100 group-hover:scale-110">
            <svg className="h-4 w-4 text-purple-600 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>

          {/* Vertical text with better spacing */}
          <div className="flex flex-col items-center gap-0.5">
            {['L', 'I', 'B', 'R', 'A', 'R', 'Y'].map((letter, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 transition-colors duration-200 group-hover:text-purple-600"
              >
                {letter}
              </span>
            ))}
          </div>
        </button>
      </div>
    );
  }

  // Expanded state - full panel
  return (
    <div className="flex h-full w-96 flex-col bg-gray-50 border-l border-gray-200 transition-all duration-300">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Library</h2>
          <div className="flex gap-2">
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
              title="Collapse Library"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
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

      {/* Tab Content */}
      {activeTab === 'media' && (
        <MediaTab
          sessionId={sessionId}
          user={user}
          onOpenUpload={onOpenUpload}
          refreshKey={refreshKey}
        />
      )}

      {activeTab === 'quotes' && (
        <QuotesTab
          sessionId={sessionId}
          user={user}
          refreshKey={refreshKey}
        />
      )}

      {activeTab === 'notes' && (
        <NotesTab
          sessionId={sessionId}
          user={user}
          sessionData={sessionData}
          refreshKey={refreshKey}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileTab sessionData={sessionData} />
      )}
    </div>
  );
}
