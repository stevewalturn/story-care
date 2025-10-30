'use client';

import { useState } from 'react';
import { Search, Plus, BookOpen, Copy, Edit2, Trash2, Tag, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  isFavorite?: boolean;
}

interface PromptLibraryProps {
  onSelectPrompt?: (prompt: Prompt) => void;
  onAddClick?: () => void;
  onEditClick?: (prompt: Prompt) => void;
  onDeleteClick?: (promptId: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Prompts', color: 'gray' },
  { id: 'visualization', label: 'Visualization', color: 'blue' },
  { id: 'character', label: 'Character', color: 'purple' },
  { id: 'environment', label: 'Environment', color: 'green' },
  { id: 'emotion', label: 'Emotion', color: 'pink' },
  { id: 'metaphor', label: 'Metaphor', color: 'orange' },
  { id: 'safety', label: 'Safe Space', color: 'indigo' },
];

export function PromptLibrary({
  onSelectPrompt,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: PromptLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mock data - In real implementation, this would come from API
  const mockPrompts: Prompt[] = [
    {
      id: '1',
      title: 'Peaceful Mountain Sanctuary',
      description: 'A serene mountain landscape representing inner peace and strength',
      content:
        'A majestic mountain landscape at golden hour, with snow-capped peaks reflecting warm sunlight. A peaceful valley below with a crystal-clear lake, surrounded by evergreen forests. Soft clouds drift across a pastel sky. The scene embodies tranquility, strength, and the journey toward healing. Photorealistic, cinematic lighting, 8k quality.',
      category: 'visualization',
      tags: ['peace', 'strength', 'nature', 'healing'],
      usageCount: 24,
      createdAt: new Date(2025, 9, 1),
      isFavorite: true,
    },
    {
      id: '2',
      title: 'Resilient Character',
      description: 'A character who embodies resilience and growth',
      content:
        'A person standing confidently on a hillside, facing the sunrise. They wear comfortable casual clothing and have a calm, determined expression. Their posture shows strength and self-assurance. Behind them, a winding path leads through challenges they have overcome. Warm, hopeful lighting. Digital art style, detailed character design.',
      category: 'character',
      tags: ['resilience', 'growth', 'confidence', 'journey'],
      usageCount: 18,
      createdAt: new Date(2025, 9, 5),
    },
    {
      id: '3',
      title: 'Safe Haven Room',
      description: 'A comfortable, secure personal space for emotional safety',
      content:
        'A cozy, softly lit room with plush cushions and warm blankets. Large windows show a gentle rainfall outside. Bookshelves line the walls filled with comforting books. A comfortable reading nook with warm lighting. Plants add life to the space. The atmosphere is nurturing, safe, and peaceful. Interior design photography style.',
      category: 'safety',
      tags: ['comfort', 'security', 'peace', 'sanctuary'],
      usageCount: 31,
      createdAt: new Date(2025, 8, 28),
      isFavorite: true,
    },
    {
      id: '4',
      title: 'Storm to Calm Transition',
      description: 'Visualizing the journey from turmoil to peace',
      content:
        'A split scene showing dramatic contrast: on the left, a dark stormy sea with turbulent waves and heavy clouds; on the right, the same sea transformed into calm waters under clear blue skies with gentle waves. A single boat transitions from the storm into the calm. Symbolizes the journey through difficult emotions toward peace. Cinematic, symbolic imagery.',
      category: 'metaphor',
      tags: ['transition', 'emotions', 'healing', 'transformation'],
      usageCount: 15,
      createdAt: new Date(2025, 9, 10),
    },
    {
      id: '5',
      title: 'Garden of Growth',
      description: 'A metaphor for personal development and nurturing oneself',
      content:
        'A beautiful garden in various stages of growth. Some areas show newly planted seeds, others have young sprouts, and some sections are in full bloom with vibrant flowers. A gardener tends to the plants with care. Represents patience, growth, and the nurturing of ones mental health. Natural lighting, botanical illustration style.',
      category: 'metaphor',
      tags: ['growth', 'patience', 'nurture', 'development'],
      usageCount: 22,
      createdAt: new Date(2025, 9, 8),
    },
    {
      id: '6',
      title: 'Confident Group Setting',
      description: 'People supporting each other in a therapeutic group',
      content:
        'A diverse group of people sitting in a comfortable circle, engaged in supportive conversation. Natural lighting from large windows. The space feels safe and welcoming. Each person shows attentive, compassionate body language. Represents community, support, and shared healing. Documentary photography style, warm tones.',
      category: 'environment',
      tags: ['community', 'support', 'connection', 'therapy'],
      usageCount: 12,
      createdAt: new Date(2025, 9, 12),
    },
  ];

  const filteredPrompts = mockPrompts.filter((prompt) => {
    const matchesSearch =
      searchQuery === '' ||
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCopy = (promptId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(promptId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryColor = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return category?.color || 'gray';
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return category?.label || categoryId;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Prompt Library</h1>
          <p className="text-sm text-gray-600">
            Pre-made prompts for therapeutic image generation
          </p>
        </div>
        {onAddClick && (
          <Button variant="primary" onClick={onAddClick}>
            <Plus className="w-4 h-4 mr-2" />
            Create Prompt
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search prompts by title, description, or tags..."
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? `bg-${category.color}-100 text-${category.color}-700 border-2 border-${category.color}-300`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPrompts.map((prompt) => (
          <div
            key={prompt.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{prompt.title}</h3>
                  {prompt.isFavorite && (
                    <span className="text-yellow-500">★</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{prompt.description}</p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                {onEditClick && (
                  <button
                    onClick={() => onEditClick(prompt)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {onDeleteClick && (
                  <button
                    onClick={() => {
                      if (confirm(`Delete prompt "${prompt.title}"?`)) {
                        onDeleteClick(prompt.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category & Stats */}
            <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
              <span
                className={`px-2 py-1 rounded-md bg-${getCategoryColor(prompt.category)}-100 text-${getCategoryColor(prompt.category)}-700 font-medium`}
              >
                {getCategoryLabel(prompt.category)}
              </span>
              <span>Used {prompt.usageCount} times</span>
            </div>

            {/* Content Preview */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 line-clamp-3">{prompt.content}</p>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {prompt.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => handleCopy(prompt.id, prompt.content)}
                className="flex-1"
              >
                {copiedId === prompt.id ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              {onSelectPrompt && (
                <Button
                  variant="primary"
                  onClick={() => onSelectPrompt(prompt)}
                  className="flex-1"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Use Prompt
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredPrompts.length === 0 && (
          <div className="col-span-full text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'No prompts found' : 'No prompts in this category'}
            </p>
            {!searchQuery && onAddClick && (
              <Button variant="primary" onClick={onAddClick}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Prompt
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
