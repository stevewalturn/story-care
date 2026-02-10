'use client';

import { Check, ChevronDown, Copy, Download, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { downloadAsTextFile, htmlToMarkdown } from '@/utils/FileDownloadHelpers';
import { Button } from '../ui/Button';
import { TipTapEditor } from '../ui/TipTapEditor';

export type PatientOption = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type SaveNoteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  patients?: PatientOption[];
  initialTitle?: string;
  initialTags?: string[];
  onSave: (noteData: {
    patientId?: string;
    title: string;
    content: string;
    tags: string[];
  }) => Promise<void>;
};

export function SaveNoteModal({
  isOpen,
  onClose,
  selectedText,
  patients = [],
  initialTitle = '',
  initialTags = [],
  onSave,
}: SaveNoteModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(selectedText);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialTags);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  // Update selected patient when patients prop changes
  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0]?.id || '');
    }
  }, [patients, selectedPatientId]);

  // Update content when selectedText changes
  useEffect(() => {
    setContent(selectedText);
  }, [selectedText]);

  // Update title when initialTitle changes
  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  // Update tags when initialTags changes
  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Copy note content to clipboard as markdown
  const handleCopyContent = async () => {
    try {
      const markdownContent = htmlToMarkdown(content);
      const fullText = title.trim() ? `# ${title.trim()}\n\n${markdownContent}` : markdownContent;
      await navigator.clipboard.writeText(fullText);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Download note content as .txt file
  const handleDownloadContent = () => {
    const markdownContent = htmlToMarkdown(content);
    const fullText = title.trim() ? `# ${title.trim()}\n\n${markdownContent}` : markdownContent;
    const prefix = title.trim()
      ? title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : 'clinical-note';
    downloadAsTextFile(fullText, prefix);
  };

  const handleSave = async () => {
    // Check if content is empty (strip HTML tags for validation)
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    if (!textContent) {
      alert('Note content cannot be empty');
      return;
    }

    if (!selectedPatientId) {
      alert('Please select a patient');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        patientId: selectedPatientId,
        title: title.trim() || 'AI Conversation Note',
        content, // Keep HTML formatting
        tags,
      });
      // Reset form
      setTitle('');
      setContent(selectedText);
      setTags([]);
      setTagInput('');
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Save className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Save Note</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {/* Patient Selector */}
          {patients.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Save under
                {' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left text-sm transition-colors hover:border-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    {selectedPatient?.avatarUrl ? (
                      <img
                        src={selectedPatient.avatarUrl}
                        alt={selectedPatient.name}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
                        {selectedPatient?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{selectedPatient?.name || 'Select patient'}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showPatientDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {showPatientDropdown && (
                  <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {patients.map(patient => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          setShowPatientDropdown(false);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-purple-50 ${
                          selectedPatientId === patient.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                        }`}
                      >
                        {patient.avatarUrl ? (
                          <img
                            src={patient.avatarUrl}
                            alt={patient.name}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
                            {patient.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <span className="font-medium">{patient.name}</span>
                        {selectedPatientId === patient.id && (
                          <svg className="ml-auto h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No patients warning */}
          {patients.length === 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">No patients available</p>
                  <p className="mt-1">This session is not associated with any patients. Please add a patient to the session first.</p>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Note Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="E.g., Key insight from AI analysis"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Note Content
              {' '}
              <span className="text-red-500">*</span>
            </label>
            <TipTapEditor
              content={content}
              onChange={setContent}
              placeholder="Enter note content..."
              className="min-h-[300px]"
            />
            <p className="mt-2 text-xs text-gray-500">
              This note will be saved to the patient's record for future reference
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tags (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add tags (e.g., insight, progress, concern)"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>

            {/* Tag List */}
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-purple-500 hover:text-purple-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div className="flex gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-purple-900">
                <p className="font-medium">Extracted from AI Conversation</p>
                <p className="mt-1 text-purple-700">
                  This note is being saved from the AI assistant's response. It will be linked to this session and visible in the Library panel.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <div className="mr-auto flex gap-2">
            <Button
              variant="secondary"
              onClick={handleCopyContent}
              disabled={!content.replace(/<[^>]*>/g, '').trim()}
            >
              {copiedContent ? (
                <>
                  <Check className="mr-1.5 h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copy Content
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownloadContent}
              disabled={!content.replace(/<[^>]*>/g, '').trim()}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Download
            </Button>
          </div>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || !content.replace(/<[^>]*>/g, '').trim() || patients.length === 0 || !selectedPatientId}
          >
            {isSaving ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      </div>
    </div>
  );
}
