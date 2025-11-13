'use client';

import { Eye, FileText, GripVertical, Image as ImageIcon, ListChecks, MessageCircle, Sparkles, Trash2, Type, Video, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AssetPickerModal } from '@/components/pages/AssetPickerModal';
import { ModulePageGenerator } from '@/components/pages/ModulePageGenerator';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import type { TreatmentModule } from '@/models/Schema';

type BlockType = 'text' | 'image' | 'video' | 'quote' | 'reflection' | 'survey';

type QuestionType = 'open_text' | 'scale' | 'multiple_choice' | 'yes_no';

type ContentBlock = {
  id: string;
  type: BlockType;
  order: number;
  content: {
    text?: string;
    mediaUrl?: string;
    question?: string;
    questionType?: QuestionType;
    scaleMin?: number;
    scaleMax?: number;
    scaleMinLabel?: string;
    scaleMaxLabel?: string;
    options?: string[];
    templateId?: string;
  };
};

type Patient = {
  id: string;
  name: string;
};

type Template = {
  id: string;
  title: string;
  description: string | null;
  questions: any[];
  category: string;
};

type SessionWithModule = {
  id: string;
  title: string;
  sessionDate: string;
  sessionType: string;
  audioUrl: string;
  transcriptionStatus: string;
  patientId: string | null;
  createdAt: Date;
  patient: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  moduleId: string | null;
  module: {
    id: string;
    name: string;
    domain: string;
    description: string;
    reflectionTemplateId: string | null;
    surveyTemplateId: string | null;
  } | null;
};

type PageEditorProps = {
  pageId?: string;
  initialTitle?: string;
  initialBlocks?: ContentBlock[];
  initialPatientId?: string;
  patients?: Patient[];
  onSave: (title: string, blocks: ContentBlock[], patientId: string | null) => void;
  onClose?: () => void;
};

export function PageEditor({
  pageId: _pageId,
  initialTitle = 'Untitled Page',
  initialBlocks = [],
  initialPatientId,
  patients = [],
  onSave,
  onClose,
}: PageEditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialTitle);
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(initialPatientId || null);

  // Template selection
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateType, setTemplateType] = useState<'reflection' | 'survey' | null>(null);
  const [reflectionTemplates, setReflectionTemplates] = useState<Template[]>([]);
  const [surveyTemplates, setSurveyTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Asset picker modal
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetPickerBlockId, setAssetPickerBlockId] = useState<string | null>(null);
  const [assetPickerFilterType, setAssetPickerFilterType] = useState<'image' | 'video' | 'text' | 'all'>('all');

  // Module generator modal
  const [showModuleGenerator, setShowModuleGenerator] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [availableSessions, setAvailableSessions] = useState<SessionWithModule[]>([]);
  const [selectedSessionForGenerator, setSelectedSessionForGenerator] = useState<SessionWithModule | null>(null);

  const blockTypes: Array<{ value: BlockType; label: string; icon: any }> = [
    { value: 'text', label: 'Text', icon: Type },
    { value: 'image', label: 'Image', icon: ImageIcon },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'quote', label: 'Quote', icon: FileText },
    { value: 'reflection', label: 'Reflection Question', icon: MessageCircle },
    { value: 'survey', label: 'Survey Question', icon: ListChecks },
  ];

  // Fetch templates when component mounts
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Fetch patient sessions when patient is selected
  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientSessions();
    }
  }, [selectedPatientId]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const [reflectionsRes, surveysRes] = await Promise.all([
        authenticatedFetch('/api/templates/reflections', user),
        authenticatedFetch('/api/templates/surveys', user),
      ]);

      if (reflectionsRes.ok) {
        const data = await reflectionsRes.json();
        setReflectionTemplates(data.templates || []);
      }

      if (surveysRes.ok) {
        const data = await surveysRes.json();
        setSurveyTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchPatientSessions = async () => {
    if (!selectedPatientId) return;

    try {
      const response = await authenticatedFetch(`/api/sessions?patientId=${selectedPatientId}`, user);
      if (response.ok) {
        const data = await response.json();
        // Filter sessions that have modules assigned
        const sessionsWithModules = (data.sessions as SessionWithModule[])
          .filter((session) => session.moduleId && session.module)
          .filter((session): session is SessionWithModule & { module: NonNullable<SessionWithModule['module']> } =>
            session.module !== null
          );
        setAvailableSessions(sessionsWithModules);
      }
    } catch (error) {
      console.error('Failed to fetch patient sessions:', error);
    }
  };

  const addBlock = (type: BlockType) => {
    // For reflection and survey blocks, show template picker
    if (type === 'reflection' || type === 'survey') {
      setTemplateType(type);
      setShowTemplateModal(true);
      return;
    }

    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      order: blocks.length,
      content: {},
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const addBlockWithTemplate = (templateId: string | null) => {
    if (!templateType) {
      return;
    }

    const template = templateType === 'reflection'
      ? reflectionTemplates.find(t => t.id === templateId)
      : surveyTemplates.find(t => t.id === templateId);

    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type: templateType,
      order: blocks.length,
      content: {
        templateId: templateId || undefined,
        question: template?.title || '',
      },
    };

    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setShowTemplateModal(false);
    setTemplateType(null);
  };

  const deleteBlock = (blockId: string) => {
    const updatedBlocks = blocks
      .filter(b => b.id !== blockId)
      .map((b, index) => ({ ...b, order: index }));
    setBlocks(updatedBlocks);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const updateBlockContent = (blockId: string, content: Partial<ContentBlock['content']>) => {
    setBlocks(
      blocks.map(b =>
        b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b,
      ),
    );
  };

  const openAssetPicker = (blockId: string, filterType: 'image' | 'video' | 'text' | 'all') => {
    setAssetPickerBlockId(blockId);
    setAssetPickerFilterType(filterType);
    setShowAssetPicker(true);
  };

  const handleAssetSelect = (asset: { type: 'media' | 'quotes' | 'notes'; data: any }) => {
    if (!assetPickerBlockId) return;

    const block = blocks.find(b => b.id === assetPickerBlockId);
    if (!block) return;

    // Handle different asset types
    if (asset.type === 'media') {
      // Image or video asset
      updateBlockContent(assetPickerBlockId, { mediaUrl: asset.data.url });
    } else if (asset.type === 'quotes') {
      // Quote asset
      updateBlockContent(assetPickerBlockId, { text: asset.data.quoteText });
    } else if (asset.type === 'notes') {
      // Note asset
      updateBlockContent(assetPickerBlockId, { text: asset.data.noteText });
    }

    // Close modal
    setShowAssetPicker(false);
    setAssetPickerBlockId(null);
  };

  const handleOpenModuleGenerator = (session: SessionWithModule) => {
    if (session.module) {
      setSelectedSessionForGenerator(session);
      setShowModuleGenerator(true);
    }
  };

  const handlePageGenerated = async (pageId: string) => {
    // Fetch the generated page content and populate blocks
    try {
      const response = await authenticatedFetch(`/api/pages/${pageId}`, user);
      if (response.ok) {
        const data = await response.json();
        const page = data.page;

        // Update title and blocks with generated content
        if (page.title) {
          setTitle(page.title);
        }

        if (page.blocks && page.blocks.length > 0) {
          setBlocks(page.blocks);
        }

        setShowModuleGenerator(false);
        setSelectedSessionForGenerator(null);
      }
    } catch (error) {
      console.error('Failed to fetch generated page:', error);
    }
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (
      (direction === 'up' && index === 0)
      || (direction === 'down' && index === blocks.length - 1)
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
    const blockType = blockTypes.find(bt => bt.value === type);
    const Icon = blockType?.icon;
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  const renderBlockEditor = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <textarea
              value={block.content.text || ''}
              onChange={e => updateBlockContent(block.id, { text: e.target.value })}
              placeholder="Enter your text here..."
              className="h-32 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAssetPicker(block.id, 'text')}
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Browse Library (Quotes & Notes)
            </Button>
          </div>
        );
      case 'image':
        return (
          <div className="space-y-2">
            <Input
              value={block.content.mediaUrl || ''}
              onChange={e => updateBlockContent(block.id, { mediaUrl: e.target.value })}
              placeholder="Image URL or select from library..."
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAssetPicker(block.id, 'image')}
              className="w-full"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Browse Library
            </Button>
            {block.content.mediaUrl && (
              <img
                src={block.content.mediaUrl}
                alt="Preview"
                className="max-h-64 w-full rounded object-cover"
              />
            )}
          </div>
        );
      case 'video':
        return (
          <div className="space-y-2">
            <Input
              value={block.content.mediaUrl || ''}
              onChange={e => updateBlockContent(block.id, { mediaUrl: e.target.value })}
              placeholder="Video URL or select from library..."
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAssetPicker(block.id, 'video')}
              className="w-full"
            >
              <Video className="mr-2 h-4 w-4" />
              Browse Library
            </Button>
            {block.content.mediaUrl && (
              <div className="flex aspect-video items-center justify-center rounded bg-gray-100">
                <Video className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        );
      case 'quote':
        return (
          <div className="space-y-2">
            <textarea
              value={block.content.text || ''}
              onChange={e => updateBlockContent(block.id, { text: e.target.value })}
              placeholder="Enter quote text..."
              className="h-24 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 italic focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAssetPicker(block.id, 'text')}
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Browse Library (Quotes)
            </Button>
          </div>
        );
      case 'reflection':
        return (
          <Input
            value={block.content.question || ''}
            onChange={e => updateBlockContent(block.id, { question: e.target.value })}
            placeholder="What question would you like to ask the patient?"
          />
        );
      case 'survey':
        return (
          <div className="space-y-4">
            <Input
              value={block.content.question || ''}
              onChange={e => updateBlockContent(block.id, { question: e.target.value })}
              placeholder="Survey question..."
            />

            {/* Question Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Question Type</label>
              <select
                value={block.content.questionType || 'open_text'}
                onChange={e => updateBlockContent(block.id, {
                  questionType: e.target.value as QuestionType,
                  // Reset type-specific fields
                  scaleMin: e.target.value === 'scale' ? 1 : undefined,
                  scaleMax: e.target.value === 'scale' ? 5 : undefined,
                  options: e.target.value === 'multiple_choice' ? [''] : undefined,
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="open_text">Open Text</option>
                <option value="scale">Rating Scale</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="yes_no">Yes/No</option>
              </select>
            </div>

            {/* Scale Configuration */}
            {block.content.questionType === 'scale' && (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Min Value</label>
                    <Input
                      type="number"
                      value={block.content.scaleMin || 1}
                      onChange={e => updateBlockContent(block.id, { scaleMin: parseInt(e.target.value) })}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Max Value</label>
                    <Input
                      type="number"
                      value={block.content.scaleMax || 5}
                      onChange={e => updateBlockContent(block.id, { scaleMax: parseInt(e.target.value) })}
                      min={block.content.scaleMin || 1}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Min Label (optional)</label>
                    <Input
                      value={block.content.scaleMinLabel || ''}
                      onChange={e => updateBlockContent(block.id, { scaleMinLabel: e.target.value })}
                      placeholder="e.g., Not at all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Max Label (optional)</label>
                    <Input
                      value={block.content.scaleMaxLabel || ''}
                      onChange={e => updateBlockContent(block.id, { scaleMaxLabel: e.target.value })}
                      placeholder="e.g., Very much"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Multiple Choice Configuration */}
            {block.content.questionType === 'multiple_choice' && (
              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <label className="text-xs font-medium text-gray-700">Answer Options</label>
                {(block.content.options || ['']).map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(block.content.options || [''])];
                        newOptions[index] = e.target.value;
                        updateBlockContent(block.id, { options: newOptions });
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newOptions = (block.content.options || ['']).filter((_, i) => i !== index);
                          updateBlockContent(block.id, { options: newOptions });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(block.content.options || ['']), ''];
                    updateBlockContent(block.id, { options: newOptions });
                  }}
                  className="w-full"
                >
                  + Add Option
                </Button>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="max-w-2xl flex-1 text-2xl font-bold"
            placeholder="Page title..."
          />
          <div className="flex items-center gap-2">
            {/* Generate from Module Button */}
            {selectedPatientId && availableSessions.length > 0 && (
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => {
                    // If only one session, open directly
                    if (availableSessions.length === 1 && availableSessions[0]) {
                      handleOpenModuleGenerator(availableSessions[0]);
                    } else {
                      // Multiple sessions: toggle dropdown
                      setShowSessionDropdown(!showSessionDropdown);
                    }
                  }}
                  className="border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate from Module
                </Button>
                {/* Show dropdown if multiple sessions */}
                {availableSessions.length > 1 && showSessionDropdown && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
                    <div className="p-2">
                      <p className="mb-2 px-2 text-xs font-medium text-gray-500">Select a session:</p>
                      {availableSessions.map(session => (
                        <button
                          key={session.id}
                          onClick={() => {
                            handleOpenModuleGenerator(session);
                            setShowSessionDropdown(false);
                          }}
                          className="w-full rounded p-2 text-left text-sm hover:bg-gray-100"
                        >
                          {session.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              variant="ghost"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                onClick={onClose}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => onSave(title, blocks, selectedPatientId)}
              disabled={blocks.length === 0 || !selectedPatientId}
            >
              Save Page
            </Button>
          </div>
        </div>

        {/* Patient Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Assign to Patient
          </label>
          <select
            value={selectedPatientId || ''}
            onChange={e => setSelectedPatientId(e.target.value || null)}
            className="block w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Select a patient...</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-gray-600">
          Build interactive story pages with media, reflections, and surveys for your patient
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!showPreview ? (
          <div className="mx-auto max-w-4xl space-y-4">
            {/* Blocks */}
            {blocks.map((block, index) => (
              <div
                key={block.id}
                onClick={() => setSelectedBlockId(block.id)}
                className={`group cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  selectedBlockId === block.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Block Header */}
                <div className="mb-3 flex items-center gap-2">
                  <button className="cursor-move text-gray-400 hover:text-gray-600">
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <div className="flex flex-1 items-center gap-2">
                    {getBlockIcon(block.type)}
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {block.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                      <Trash2 className="h-4 w-4 text-red-600" />
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
                      <p className="text-xs">
                        Media:
                        {block.content.mediaUrl}
                      </p>
                    )}
                    {!block.content.text && !block.content.question && !block.content.mediaUrl && (
                      <p className="text-gray-400 italic">Empty block - click to edit</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add Block Buttons */}
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
              <p className="mb-3 text-center text-sm font-medium text-gray-700">
                Add Block
              </p>
              <div className="grid grid-cols-3 gap-2">
                {blockTypes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => addBlock(value)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition-all hover:border-indigo-500 hover:bg-indigo-50"
                  >
                    <Icon className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {blocks.length === 0 && (
              <div className="py-12 text-center">
                <p className="mb-4 text-gray-500">No content blocks yet</p>
                <p className="text-sm text-gray-400">
                  Click one of the block types above to start building your page
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Preview Mode */
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-8 text-3xl font-bold text-gray-900">{title}</h1>
            <div className="space-y-6">
              {blocks.map(block => (
                <div key={block.id}>
                  {block.type === 'text' && block.content.text && (
                    <p className="leading-relaxed text-gray-700">{block.content.text}</p>
                  )}
                  {block.type === 'image' && block.content.mediaUrl && (
                    <img
                      src={block.content.mediaUrl}
                      alt="Content"
                      className="w-full rounded-lg"
                    />
                  )}
                  {block.type === 'video' && block.content.mediaUrl && (
                    <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-900">
                      <Video className="h-16 w-16 text-white opacity-50" />
                    </div>
                  )}
                  {block.type === 'quote' && block.content.text && (
                    <blockquote className="border-l-4 border-indigo-500 py-2 pl-4 text-gray-700 italic">
                      "
                      {block.content.text}
                      "
                    </blockquote>
                  )}
                  {block.type === 'reflection' && block.content.question && (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                      <p className="mb-2 font-medium text-indigo-900">Reflection</p>
                      <p className="mb-3 text-gray-700">{block.content.question}</p>
                      <textarea
                        placeholder="Your response..."
                        className="h-24 w-full resize-none rounded border border-gray-300 px-3 py-2"
                        disabled
                      />
                    </div>
                  )}
                  {block.type === 'survey' && block.content.question && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <p className="mb-2 font-medium text-green-900">Survey</p>
                      <p className="mb-3 text-gray-700">{block.content.question}</p>
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => (
                          <label key={i} className="flex items-center gap-2">
                            <input type="radio" name="survey" disabled />
                            <span className="text-sm text-gray-600">
                              Option
                              {i}
                            </span>
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

      {/* Template Picker Modal */}
      {showTemplateModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Select
                {' '}
                {templateType === 'reflection' ? 'Reflection' : 'Survey'}
                {' '}
                Template
              </h3>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setTemplateType(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-96 overflow-y-auto p-6">
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* No Template Option */}
                  <button
                    onClick={() => addBlockWithTemplate(null)}
                    className="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-left transition-all hover:border-indigo-500 hover:bg-indigo-50"
                  >
                    <p className="font-medium text-gray-900">Create without template</p>
                    <p className="text-sm text-gray-600">Start with a blank question</p>
                  </button>

                  {/* Template List */}
                  {(templateType === 'reflection' ? reflectionTemplates : surveyTemplates).map(template => (
                    <button
                      key={template.id}
                      onClick={() => addBlockWithTemplate(template.id)}
                      className="w-full rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-indigo-500 hover:bg-indigo-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{template.title}</p>
                          {template.description && (
                            <p className="mt-1 text-sm text-gray-600">{template.description}</p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            {template.questions?.length || 0}
                            {' '}
                            questions
                          </p>
                        </div>
                        <span className="ml-4 rounded bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                          {template.category}
                        </span>
                      </div>
                    </button>
                  ))}

                  {/* Empty State */}
                  {(templateType === 'reflection' ? reflectionTemplates : surveyTemplates).length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-gray-500">No templates available</p>
                      <p className="mt-1 text-sm text-gray-400">
                        Create templates in the Templates section
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-gray-200 p-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowTemplateModal(false);
                  setTemplateType(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Picker Modal */}
      <AssetPickerModal
        isOpen={showAssetPicker}
        onClose={() => {
          setShowAssetPicker(false);
          setAssetPickerBlockId(null);
        }}
        onSelect={handleAssetSelect}
        patientId={selectedPatientId || undefined}
        filterType={assetPickerFilterType}
      />

      {/* Module Page Generator Modal */}
      {showModuleGenerator && selectedSessionForGenerator && selectedSessionForGenerator.module && selectedPatientId && (
        <ModulePageGenerator
          module={selectedSessionForGenerator.module as TreatmentModule}
          sessionId={selectedSessionForGenerator.id}
          patientId={selectedPatientId}
          patientName={patients.find(p => p.id === selectedPatientId)?.name || 'Patient'}
          onClose={() => {
            setShowModuleGenerator(false);
            setSelectedSessionForGenerator(null);
          }}
          onGenerated={handlePageGenerated}
        />
      )}
    </div>
  );
}
