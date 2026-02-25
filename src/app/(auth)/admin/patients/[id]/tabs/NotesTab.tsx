'use client';

import { Check, Copy, Download, Edit2, Lock, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SaveNoteModal } from '@/components/sessions/SaveNoteModal';
import { HTMLContent } from '@/components/ui/HTMLContent';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { downloadAsTextFile, htmlToMarkdown } from '@/utils/FileDownloadHelpers';

type NotesTabProps = {
  patientId: string;
};

type Note = {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  status: 'draft' | 'locked';
  createdAt: string;
  sessionId?: string;
  sessionTitle?: string;
};

type PatientOption = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export function NotesTab({ patientId }: NotesTabProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientOption | null>(null);

  // Handle copy note content - converts HTML to markdown
  const handleCopyNote = async (note: Note) => {
    try {
      const markdownContent = htmlToMarkdown(note.content);
      const fullText = note.title ? `# ${note.title}\n\n${markdownContent}` : markdownContent;
      await navigator.clipboard.writeText(fullText);
      setCopiedNoteId(note.id);
      setTimeout(() => setCopiedNoteId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Handle download note as .txt file
  const handleDownloadNote = (note: Note) => {
    const markdownContent = htmlToMarkdown(note.content);
    const fullText = note.title ? `# ${note.title}\n\n${markdownContent}` : markdownContent;
    const prefix = note.title
      ? note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : 'clinical-note';
    downloadAsTextFile(fullText, prefix);
  };

  // Load patient data
  useEffect(() => {
    const loadPatient = async () => {
      if (!user?.uid || !patientId) return;

      try {
        const response = await authenticatedFetch(`/api/patients/${patientId}`, user);
        if (response.ok) {
          const data = await response.json();
          setPatient({
            id: data.patient.id,
            name: data.patient.name,
            avatarUrl: data.patient.avatarUrl,
          });
        }
      } catch (error) {
        console.error('Error fetching patient:', error);
      }
    };

    loadPatient();
  }, [user, patientId]);

  // Load notes for this patient
  useEffect(() => {
    const loadNotes = async () => {
      if (!user || !patientId) return;

      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          patientId,
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
  }, [patientId, user]);

  // Handler for creating new note
  const handleCreateNote = async (noteData: { patientId?: string; title: string; content: string; tags: string[] }) => {
    try {
      if (!patient) {
        throw new Error('Patient not found');
      }

      const response = await authenticatedFetch('/api/notes', user, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...noteData,
          patientId: patient.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      // Refresh notes list
      const params = new URLSearchParams({ patientId });
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
    if (!editingNote) return;

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
      const params = new URLSearchParams({ patientId });
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

  // Handler for locking note
  const handleLockNote = async (noteId: string) => {
    if (!confirm('Are you sure? Once locked, this note cannot be edited or deleted.')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/notes/${noteId}/lock`, user, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lock' }),
      });

      if (!response.ok) {
        throw new Error('Failed to lock note');
      }

      // Refresh notes list
      const params = new URLSearchParams({ patientId });
      const notesResponse = await authenticatedFetch(`/api/notes?${params.toString()}`, user);
      if (notesResponse.ok) {
        const data = await notesResponse.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error locking note:', error);
      alert('Failed to lock note');
    }
  };

  return (
    <>
      {/* Notes Header with New Note Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Notes (
            {notes.length}
            )
          </h2>
          <p className="text-sm text-gray-500">Clinical notes for this patient</p>
        </div>
        <button
          onClick={() => setShowNewNoteModal(true)}
          className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          New Note
        </button>
      </div>

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
          <p className="text-sm text-gray-700">No notes for this patient yet</p>
          <p className="mt-1 text-xs text-gray-500">Click "New Note" to create the first note</p>
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
                {/* Header with Copy/Edit/Delete/Lock buttons */}
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{note.title || 'Untitled Note'}</h4>
                      {note.status === 'locked' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <Lock className="h-3 w-3" />
                          Locked
                        </span>
                      )}
                    </div>
                    {note.sessionTitle && (
                      <p className="text-xs text-purple-600">From session: {note.sessionTitle}</p>
                    )}
                  </div>
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
                    {note.status !== 'locked' && (
                      <>
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
                        {/* Lock button */}
                        <button
                          onClick={() => handleLockNote(note.id)}
                          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-amber-600"
                          title="Lock note"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                      </>
                    )}
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

      {/* New Note Modal */}
      {showNewNoteModal && patient && (
        <SaveNoteModal
          isOpen={showNewNoteModal}
          onClose={() => setShowNewNoteModal(false)}
          selectedText=""
          patients={[patient]}
          onSave={handleCreateNote}
        />
      )}

      {/* Edit Note Modal */}
      {showEditNoteModal && editingNote && patient && (
        <SaveNoteModal
          isOpen={showEditNoteModal}
          onClose={() => {
            setShowEditNoteModal(false);
            setEditingNote(null);
          }}
          selectedText={editingNote.content}
          initialTitle={editingNote.title}
          initialTags={editingNote.tags || []}
          patients={[patient]}
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
              <div>
                <span>
                  {viewingNote.createdAt ? new Date(viewingNote.createdAt).toLocaleDateString() : ''}
                </span>
                {viewingNote.sessionTitle && (
                  <span className="ml-2 text-purple-600">• From session: {viewingNote.sessionTitle}</span>
                )}
              </div>
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
                {/* Download button */}
                <button
                  onClick={() => handleDownloadNote(viewingNote)}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100"
                >
                  <Download className="h-3 w-3" />
                  Download
                </button>
                {/* Edit button - hidden when locked */}
                {viewingNote.status !== 'locked' && (
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
                )}
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