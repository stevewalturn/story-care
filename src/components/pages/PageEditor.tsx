'use client';

import { useState } from 'react';
import { GripVertical, Trash2, Eye, Type, Image as ImageIcon, Video, FileText, MessageCircle, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type BlockType = 'text' | 'image' | 'video' | 'quote' | 'reflection' | 'survey';

interface ContentBlock {
  id: string;
  type: BlockType;
  order: number;
  content: {
    text?: string;
    mediaUrl?: string;
    question?: string;
    options?: string[];
  };
}

interface PageEditorProps {
  pageId?: string;
  initialTitle?: string;
  initialBlocks?: ContentBlock[];
  onSave: (title: string, blocks: ContentBlock[]) => void;
}

export function PageEditor({
  pageId: _pageId,
  initialTitle = 'Untitled Page',
  initialBlocks = [],
  onSave,
}: PageEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const blockTypes: Array<{ value: BlockType; label: string; icon: any }> = [
    { value: 'text', label: 'Text', icon: Type },
    { value: 'image', label: 'Image', icon: ImageIcon },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'quote', label: 'Quote', icon: FileText },
    { value: 'reflection', label: 'Reflection Question', icon: MessageCircle },
    { value: 'survey', label: 'Survey Question', icon: ListChecks },
  ];

  const addBlock = (type: BlockType) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      order: blocks.length,
      content: {},
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const deleteBlock = (blockId: string) => {
    const updatedBlocks = blocks
      .filter((b) => b.id !== blockId)
      .map((b, index) => ({ ...b, order: index }));
    setBlocks(updatedBlocks);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const updateBlockContent = (blockId: string, content: Partial<ContentBlock['content']>) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b
      )
    );
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === blocks.length - 1)
    ) {
      return;
    }

    const newBlocks = [...blocks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap blocks with safety check
    const temp = newBlocks[index];
    if (temp && newBlocks[swapIndex]) {
      newBlocks[index] = newBlocks[swapIndex]!;
      newBlocks[swapIndex] = temp;
    }

    newBlocks.forEach((b, i) => (b.order = i));
    setBlocks(newBlocks);
  };

  const getBlockIcon = (type: BlockType) => {
    const blockType = blockTypes.find((bt) => bt.value === type);
    const Icon = blockType?.icon;
    return Icon ? <Icon className="w-4 h-4" /> : null;
  };

  const renderBlockEditor = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <textarea
            value={block.content.text || ''}
            onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
            placeholder="Enter your text here..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        );
      case 'image':
        return (
          <div className="space-y-2">
            <Input
              value={block.content.mediaUrl || ''}
              onChange={(e) => updateBlockContent(block.id, { mediaUrl: e.target.value })}
              placeholder="Image URL or select from library..."
            />
            {block.content.mediaUrl && (
              <img
                src={block.content.mediaUrl}
                alt="Preview"
                className="w-full max-h-64 object-cover rounded"
              />
            )}
          </div>
        );
      case 'video':
        return (
          <div className="space-y-2">
            <Input
              value={block.content.mediaUrl || ''}
              onChange={(e) => updateBlockContent(block.id, { mediaUrl: e.target.value })}
              placeholder="Video URL or select from library..."
            />
            {block.content.mediaUrl && (
              <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                <Video className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
        );
      case 'quote':
        return (
          <textarea
            value={block.content.text || ''}
            onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
            placeholder="Enter quote text..."
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none italic"
          />
        );
      case 'reflection':
        return (
          <Input
            value={block.content.question || ''}
            onChange={(e) => updateBlockContent(block.id, { question: e.target.value })}
            placeholder="What question would you like to ask the patient?"
          />
        );
      case 'survey':
        return (
          <div className="space-y-2">
            <Input
              value={block.content.question || ''}
              onChange={(e) => updateBlockContent(block.id, { question: e.target.value })}
              placeholder="Survey question..."
            />
            <p className="text-xs text-gray-600">
              Survey options can be configured in settings
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const _selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold flex-1 max-w-2xl"
            placeholder="Page title..."
          />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              variant="primary"
              onClick={() => onSave(title, blocks)}
              disabled={blocks.length === 0}
            >
              Save Page
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Build interactive story pages with media, reflections, and surveys for your patient
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!showPreview ? (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Blocks */}
            {blocks.map((block, index) => (
              <div
                key={block.id}
                onClick={() => setSelectedBlockId(block.id)}
                className={`group border-2 rounded-lg p-4 transition-all cursor-pointer ${
                  selectedBlockId === block.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Block Header */}
                <div className="flex items-center gap-2 mb-3">
                  <button className="text-gray-400 hover:text-gray-600 cursor-move">
                    <GripVertical className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 flex-1">
                    {getBlockIcon(block.type)}
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {block.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveBlock(block.id, 'up');
                      }}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveBlock(block.id, 'down');
                      }}
                      disabled={index === blocks.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBlock(block.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Block Content Editor */}
                {selectedBlockId === block.id && renderBlockEditor(block)}

                {/* Block Preview when not selected */}
                {selectedBlockId !== block.id && (
                  <div className="text-sm text-gray-600">
                    {block.content.text && (
                      <p className="line-clamp-2">{block.content.text}</p>
                    )}
                    {block.content.question && (
                      <p className="line-clamp-1">{block.content.question}</p>
                    )}
                    {block.content.mediaUrl && (
                      <p className="text-xs">Media: {block.content.mediaUrl}</p>
                    )}
                    {!block.content.text && !block.content.question && !block.content.mediaUrl && (
                      <p className="text-gray-400 italic">Empty block - click to edit</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add Block Buttons */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                Add Block
              </p>
              <div className="grid grid-cols-3 gap-2">
                {blockTypes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => addBlock(value)}
                    className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-sm"
                  >
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {blocks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No content blocks yet</p>
                <p className="text-sm text-gray-400">
                  Click one of the block types above to start building your page
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Preview Mode */
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>
            <div className="space-y-6">
              {blocks.map((block) => (
                <div key={block.id}>
                  {block.type === 'text' && block.content.text && (
                    <p className="text-gray-700 leading-relaxed">{block.content.text}</p>
                  )}
                  {block.type === 'image' && block.content.mediaUrl && (
                    <img
                      src={block.content.mediaUrl}
                      alt="Content"
                      className="w-full rounded-lg"
                    />
                  )}
                  {block.type === 'video' && block.content.mediaUrl && (
                    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                      <Video className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}
                  {block.type === 'quote' && block.content.text && (
                    <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 italic text-gray-700">
                      "{block.content.text}"
                    </blockquote>
                  )}
                  {block.type === 'reflection' && block.content.question && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <p className="font-medium text-indigo-900 mb-2">Reflection</p>
                      <p className="text-gray-700 mb-3">{block.content.question}</p>
                      <textarea
                        placeholder="Your response..."
                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded resize-none"
                        disabled
                      />
                    </div>
                  )}
                  {block.type === 'survey' && block.content.question && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="font-medium text-green-900 mb-2">Survey</p>
                      <p className="text-gray-700 mb-3">{block.content.question}</p>
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <label key={i} className="flex items-center gap-2">
                            <input type="radio" name="survey" disabled />
                            <span className="text-sm text-gray-600">Option {i}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
