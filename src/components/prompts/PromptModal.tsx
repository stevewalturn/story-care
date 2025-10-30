'use client';

import { Plus, Star, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Prompt = {
  id?: string;
  title: string;
  description: string;
  promptText: string;
  category: string;
  tags: string[];
  isFavorite?: boolean;
};

type PromptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: Prompt) => void;
  prompt?: Prompt;
};

const CATEGORIES = [
  { id: 'visualization', label: 'Visualization' },
  { id: 'character', label: 'Character' },
  { id: 'environment', label: 'Environment' },
  { id: 'emotion', label: 'Emotion' },
  { id: 'metaphor', label: 'Metaphor' },
  { id: 'safety', label: 'Safe Space' },
];

export function PromptModal({ isOpen, onClose, onSave, prompt }: PromptModalProps) {
  const [formData, setFormData] = useState<Prompt>(
    prompt || {
      title: '',
      description: '',
      promptText: '',
      category: 'visualization',
      tags: [],
      isFavorite: false,
    },
  );
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim().toLowerCase()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {prompt ? 'Edit Prompt' : 'Create New Prompt'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Title */}
          <Input
            label="Prompt Title *"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Peaceful Mountain Sanctuary"
            required
          />

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="A brief description of what this prompt creates..."
              className="h-20 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Prompt Content *
            </label>
            <textarea
              value={formData.promptText}
              onChange={e => setFormData({ ...formData, promptText: e.target.value })}
              placeholder="The detailed AI prompt that will be used to generate images..."
              className="h-40 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
            <p className="text-xs text-gray-500">
              Be specific and detailed. Include style, lighting, mood, and any important elements.
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            >
              {CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tags (press Enter)"
              />
              <Button type="button" variant="secondary" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700"
                  >
                    #
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-indigo-900"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Favorite */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="favorite"
              checked={formData.isFavorite}
              onChange={e => setFormData({ ...formData, isFavorite: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="favorite" className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
              <Star className="h-4 w-4" />
              Mark as favorite
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!formData.title || !formData.description || !formData.promptText}
            >
              {prompt ? 'Update Prompt' : 'Create Prompt'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
