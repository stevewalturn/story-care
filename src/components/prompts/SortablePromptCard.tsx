'use client';

/**
 * SortablePromptCard Component
 * Wrapper around PromptCard with drag-and-drop functionality using @dnd-kit
 */

import type { PromptTemplate } from '@/models/Schema';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Edit,
  FileText,
  GripVertical,
  MessageCircle,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

const categoryIcons = {
  analysis: Target,
  creative: Sparkles,
  extraction: FileText,
  reflection: MessageCircle,
};

const categoryColors = {
  analysis: 'bg-blue-100 text-blue-700',
  creative: 'bg-purple-100 text-purple-700',
  extraction: 'bg-green-100 text-green-700',
  reflection: 'bg-orange-100 text-orange-700',
};

type SortablePromptCardProps = {
  prompt: PromptTemplate;
  onDelete?: (prompt: PromptTemplate) => void;
  editable?: boolean;
};

export function SortablePromptCard({
  prompt,
  onDelete,
  editable = false,
}: SortablePromptCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prompt.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = categoryIcons[prompt.category as keyof typeof categoryIcons];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border bg-white p-4 shadow-sm transition-all ${
        isDragging ? 'z-50 opacity-50 shadow-xl' : 'hover:shadow-md'
      } ${isDragging ? 'border-purple-400' : 'border-gray-200'}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 left-2 cursor-grab rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Card Content - shifted right to accommodate drag handle */}
      <div className="pl-6">
        <div className="mb-3 flex items-start justify-between">
          <div className={`rounded-lg p-2 ${categoryColors[prompt.category as keyof typeof categoryColors]}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 uppercase">
            {prompt.scope}
          </span>
        </div>

        <h3 className="mb-2 font-semibold text-gray-900">{prompt.name}</h3>
        <p className="mb-3 line-clamp-2 text-sm text-gray-600">
          {prompt.description || 'No description provided'}
        </p>

        <div className="text-xs text-gray-500">
          <span className="capitalize">{prompt.category}</span>
        </div>

        {/* Edit Button - Always shown */}
        <div className="mt-4 flex gap-2">
          <Link
            href={`/therapist/prompt-library/${prompt.id}/edit`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          {/* Delete Button - Only for editable prompts */}
          {editable && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(prompt)}
              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
