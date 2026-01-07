'use client';

/**
 * Notes Tab Component
 * Displays session notes with create functionality
 */

import type { NotesTabProps } from '../types/transcript.types';
import type { PatientOption } from '@/components/sessions/SaveNoteModal';
import { Check, Copy, Edit2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SaveNoteModal } from '@/components/sessions/SaveNoteModal';
import { Modal } from '@/components/ui/Modal';
import { HTMLContent } from '@/components/ui/HTMLContent';
import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';

export function NotesTab({ sessionId, user, sessionData: _sessionData, refreshKey, selectedPatient }: NotesTabProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [sessionPatients, setSessionPatients] = useState<PatientOption[]>([]);
  const [viewingNote, setViewingNote] = useState<any>(null);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Handle copy note content - converts HTML to plain text preserving newlines
  const handleCopyNote = async (note: any) => {
    try {
      // Convert HTML to plain text while preserving newlines
      let plainContent = note.content
        .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newline
        .replace(/<\/p>/gi, '\n\n') // Convert </p> to double newline
        .replace(/<\/div>/gi, '\n') // Convert </div> to newline
        .replace(/<\/li>/gi, '\n') // Convert </li> to newline
        .replace(/<[^>]*>/g, '') // Strip remaining HTML tags
        .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines to max 2
        .trim();
      const fullText = note.title ? `${note.title}\n\n${plainContent}` : plainContent;
      await navigator.clipboard.writeText(fullText);
      setCopiedNoteId(note.id);
      setTimeout(() => setCopiedNoteId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Load notes for this session (refreshes when refreshKey changes)
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          sessionId,
        });

        // Filter by patient if selected
        if (selectedPatient && selectedPatient !== 'all') {
          params.append('patientId', selectedPatient);
        }

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
  }, [sessionId, user, refreshKey, selectedPatient]);

  // Load session patients for Save Note modal
  useEffect(() => {
    const fetchSessionPatients = async () => {
      if (!user || !sessionId) return;

      try {
        const response = await authenticatedFetch(`/api/sessions/${sessionId}`, user);
        if (response.ok) {
          const data = await response.json();
          const session = data.session;
          const patients: PatientOption[] = [];

          // Handle individual session with patient
          if (session.patient) {
            patients.push({
              id: session.patient.id,
              name: session.patient.name,
              avatarUrl: session.patient.avatarUrl || null,
            });
          }

          // Handle group session with members
          if (session.group?.members) {
            for (const member of session.group.members) {
              // Avoid duplicates
              if (!patients.find(p => p.id === member.id)) {
                patients.push({
                  id: member.id,
                  name: member.name,
                  avatarUrl: member.avatarUrl || null,
                });
              }
            }
          }

          setSessionPatients(patients);
        }
      } catch (error) {
        console.error('Error fetching session patients:', error);
      }
    };

    fetchSessionPatients();
  }, [sessionId, user]);

  // Handler for creating new note
  const handleCreateNote = async (noteData: { patientId?: string; title: string; content: string; tags: string[] }) => {
    try {
      if (!noteData.patientId) {
        throw new Error('Please select a patient');
      }

      const response = await authenticatedPost('/api/notes', user, {
        ...noteData,
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

  // Handler for editing note
  const handleEditNote = async (noteData: { patientId?: string; title: string; content: string; tags: string[] }) => {
    try {
      const response = await authenticatedFetch(`/api/notes/${editingNote.id}`, user, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      // Refresh notes list
      const params = new URLSearchParams({ sessionId });
      if (selectedPatient && selectedPatient !== 'all') {
        params.append('patientId', selectedPatient);
      }
      const notesResponse = await authenticatedFetch(`/api/notes?${params.toString()}`, user);
      if (notesResponse.ok) {
        const data = await notesResponse.json();
        setNotes(data.notes || []);
      }

      setShowEditNoteModal(false);
      setEditingNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  // Handler for deleting note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/notes/${noteId}`, user, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      // Refresh notes list
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  return (
    <>
      {/* Notes Header with New Note Button */}
      <div className="border-b border-gray-200 bg-white p-4">
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

      <div className="flex-1 overflow-y-auto bg-white p-4">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-700">No notes for this session yet</p>
            <p className="mt-1 text-xs text-gray-500">Click "New Note" to create your first note</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => {
              const shouldTruncate = note.content.length > 200;
              const displayContent = shouldTruncate
                ? `${note.content.slice(0, 200)}...`
                : note.content;

              return (
                <div
                  key={note.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-purple-500 hover:shadow-sm"
                >
                  {/* Header with Copy/Edit/Delete buttons */}
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="font-medium text-gray-900">{note.title || 'Untitled Note'}</h4>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">
                        {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''}
                      </span>
                      {/* Copy button */}
                      <button
                        onClick={() => handleCopyNote(note)}
                        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-purple-600"
                        title="Copy content"
                      >
                        {copiedNoteId === note.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      {/* Edit button */}
                      <button
                        onClick={() => {
                          setEditingNote(note);
                          setShowEditNoteModal(true);
                        }}
                        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-purple-600"
                        title="Edit note"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
                        title="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Note content */}
                  <HTMLContent
                    html={displayContent}
                    className="text-sm leading-relaxed text-gray-700"
                  />

                  {/* Show more button - opens modal */}
                  {shouldTruncate && (
                    <button
                      onClick={() => setViewingNote(note)}
                      className="mt-2 text-xs font-medium text-purple-600 hover:text-purple-700"
                    >
                      Show more
                    </button>
                  )}

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
              );
            })}
          </div>
        )}
      </div>

      {/* New Note Modal */}
      {showNewNoteModal && (
        <SaveNoteModal
          isOpen={showNewNoteModal}
          onClose={() => setShowNewNoteModal(false)}
          selectedText=""
          patients={sessionPatients}
          onSave={handleCreateNote}
        />
      )}

      {/* Edit Note Modal */}
      {showEditNoteModal && editingNote && (
        <SaveNoteModal
          isOpen={showEditNoteModal}
          onClose={() => {
            setShowEditNoteModal(false);
            setEditingNote(null);
          }}
          selectedText={editingNote.content}
          initialTitle={editingNote.title}
          initialTags={editingNote.tags || []}
          patients={sessionPatients}
          onSave={handleEditNote}
        />
      )}

      {/* View Note Modal */}
      {viewingNote && (
        <Modal
          isOpen={!!viewingNote}
          onClose={() => setViewingNote(null)}
          title={viewingNote.title || 'Untitled Note'}
          size="lg"
          hideFooter
        >
          <div className="space-y-4">
            {/* Note metadata */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {viewingNote.createdAt ? new Date(viewingNote.createdAt).toLocaleDateString() : ''}
              </span>
              <div className="flex items-center gap-2">
                {/* Copy button */}
                <button
                  onClick={() => handleCopyNote(viewingNote)}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100"
                >
                  {copiedNoteId === viewingNote.id ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
                {/* Edit button */}
                <button
                  onClick={() => {
                    setViewingNote(null);
                    setEditingNote(viewingNote);
                    setShowEditNoteModal(true);
                  }}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-purple-600 transition-colors hover:bg-purple-50"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </button>
              </div>
            </div>

            {/* Full note content */}
            <HTMLContent html={viewingNote.content} />

            {/* Tags */}
            {viewingNote.tags && viewingNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 border-t border-gray-200 pt-4">
                {viewingNote.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
