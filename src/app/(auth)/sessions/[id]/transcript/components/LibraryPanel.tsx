'use client';

/**
 * Library Panel Component
 * Main container for session library with tabs for media, quotes, notes, and profile
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

  return (
    <>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
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
    </>
  );
}
