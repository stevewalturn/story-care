'use client';

import { Save, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  tags: string[] | null;
};

type EditMediaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem;
  onSave: (updates: Partial<MediaItem>) => Promise<void>;
};

export function EditMediaModal({ isOpen, onClose, media, onSave }: EditMediaModalProps) {
  const [title, setTitle] = useState(media.title);
  const [description, setDescription] = useState(media.description || '');
  const [notes, setNotes] = useState(media.notes || '');
  const [tags, setTags] = useState(media.tags?.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        notes: notes.trim() || null,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      });
      toast.success('Media details updated');
      onClose();
    } catch (error) {
      toast.error('Failed to update media details');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Edit Media Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-6">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Title
              {' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter title"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe this media item"
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Therapist Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Therapist Notes (Private)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add private notes about this media"
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">These notes are only visible to therapists</p>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="therapy, progress, breakthrough (comma-separated)"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-4">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
