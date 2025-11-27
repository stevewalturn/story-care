'use client';

/**
 * Notes Tab Component
 * Displays session notes with create functionality
 */

import type { NotesTabProps } from '../types/transcript.types';
import { useEffect, useState } from 'react';
import { SaveNoteModal } from '@/components/sessions/SaveNoteModal';
import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';

export function NotesTab({ sessionId, user, sessionData }: NotesTabProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);

  // Load notes for this session
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          sessionId,
        });

        const response = await authenticatedFetch(`/api/notes?${params.toString()}`, user);

        if (response.ok) {
          const data = await response.json();
          setNotes(data.notes || []);
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [sessionId, user]);

  // Handler for creating new note
  const handleCreateNote = async (noteData: { title: string; content: string; tags: string[] }) => {
    try {
      if (!sessionData?.patientId) {
        throw new Error('No patient associated with this session');
      }

      const response = await authenticatedPost('/api/notes', user, {
        ...noteData,
        patientId: sessionData.patientId,
        sessionId,
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      // Refresh notes list
      const params = new URLSearchParams({ sessionId });
      const notesResponse = await authenticatedFetch(`/api/notes?${params.toString()}`, user);
      if (notesResponse.ok) {
        const data = await notesResponse.json();
        setNotes(data.notes || []);
      }

      setShowNewNoteModal(false);
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  };

  return (
    <>
      {/* Notes Header with New Note Button */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Notes (
            {notes.length}
            )
          </h3>
          <button
            onClick={() => setShowNewNoteModal(true)}
            className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Note
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="mx-auto mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-500">No notes for this session yet</p>
            <p className="mt-1 text-xs text-gray-400">Click "New Note" to create your first note</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map(note => (
              <div
                key={note.id}
                className="rounded-lg border border-gray-200 p-4 transition-all hover:border-indigo-300 hover:shadow-sm"
              >
                {/* Header */}
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-medium text-gray-900">{note.title || 'Untitled Note'}</h4>
                  <span className="text-xs text-gray-500">
                    {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>

                {/* Content */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                  {note.content}
                </p>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {note.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
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

      {/* New Note Modal */}
      {showNewNoteModal && (
        <SaveNoteModal
          isOpen={showNewNoteModal}
          onClose={() => setShowNewNoteModal(false)}
          selectedText=""
          onSave={handleCreateNote}
        />
      )}
    </>
  );
}
