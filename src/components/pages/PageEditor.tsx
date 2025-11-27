'use client';

import type { TreatmentModule } from '@/models/Schema';
import { Clapperboard, Eye, FileText, GripVertical, Image as ImageIcon, ListChecks, MessageCircle, Sparkles, Trash2, Type, Video, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AssetPickerModal } from '@/components/pages/AssetPickerModal';
import { ModulePageGenerator } from '@/components/pages/ModulePageGenerator';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type BlockType = 'text' | 'image' | 'video' | 'quote' | 'scene' | 'reflection' | 'survey';

type QuestionType = 'open_text' | 'scale' | 'multiple_choice' | 'yes_no';

type ReflectionQuestion = {
  id?: string;
  text: string;
  type: QuestionType;
  sequenceNumber: number;
};

type SurveyQuestion = {
  id?: string;
  text: string;
  type: QuestionType;
  sequenceNumber: number;
  // For scale questions
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  // For multiple choice questions
  options?: string[];
};

type ContentBlock = {
  id: string;
  type: BlockType;
  order: number;
  content: {
    text?: string;
    mediaUrl?: string;
    sceneId?: string;
    sceneTitle?: string;
    questions?: ReflectionQuestion[]; // For reflection blocks
    surveyQuestions?: SurveyQuestion[]; // For survey blocks
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
    reflectionTemplateIds: string[];
    surveyTemplateIds: string[];
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
    { value: 'scene', label: 'Scene', icon: Clapperboard },
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
          .filter(session => session.moduleId && session.module)
          .filter((session): session is SessionWithModule & { module: NonNullable<SessionWithModule['module']> } =>
            session.module !== null,
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
        // For reflection blocks, copy all template questions
        questions: templateType === 'reflection'
          ? (template?.questions || []).map((q: any, i: number) => ({
              id: `q-${Date.now()}-${i}`,
              text: q.questionText || q.text || '',
              type: (q.questionType || 'open_text') as QuestionType,
              sequenceNumber: i,
            }))
          : undefined,
        // For survey blocks, copy all template questions
        surveyQuestions: templateType === 'survey'
          ? (template?.questions || []).map((q: any, i: number) => ({
              id: `sq-${Date.now()}-${i}`,
              text: q.questionText || q.text || '',
              type: (q.questionType || 'open_text') as QuestionType,
              sequenceNumber: i,
              scaleMin: q.scaleMin,
              scaleMax: q.scaleMax,
              scaleMinLabel: q.scaleMinLabel,
              scaleMaxLabel: q.scaleMaxLabel,
              options: q.options,
            }))
          : undefined,
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

  const handleAssetSelect = (asset: { type: 'media' | 'quotes' | 'notes' | 'scenes'; data: any }) => {
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
    } else if (asset.type === 'scenes') {
      // Scene asset
      updateBlockContent(assetPickerBlockId, {
        sceneId: asset.data.id,
        sceneTitle: asset.data.title,
        mediaUrl: asset.data.videoUrl || asset.data.thumbnailUrl,
      });
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
      case 'scene':
        return (
          <div className="space-y-2">
            {block.content.sceneId && block.content.sceneTitle && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <Clapperboard className="h-5 w-5 text-indigo-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{block.content.sceneTitle}</p>
                    <p className="text-xs text-gray-600">
                      Scene ID:
                      {block.content.sceneId}
                    </p>
                  </div>
                </div>
                {block.content.mediaUrl && (
                  <div className="mt-2 aspect-video overflow-hidden rounded bg-gray-900">
                    {block.content.mediaUrl.includes('.mp4') || block.content.mediaUrl.includes('video') ? (
                      <div className="flex h-full items-center justify-center">
                        <Video className="h-12 w-12 text-white opacity-50" />
                      </div>
                    ) : (
                      <img src={block.content.mediaUrl} alt={block.content.sceneTitle} className="h-full w-full object-cover" />
                    )}
                  </div>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAssetPicker(block.id, 'all')}
              className="w-full"
            >
              <Clapperboard className="mr-2 h-4 w-4" />
              {block.content.sceneId ? 'Change Scene' : 'Browse Scenes'}
            </Button>
          </div>
        );
      case 'reflection':
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Reflection Questions</label>
            {(block.content.questions || [{ id: `q-default`, text: '', type: 'open_text' as QuestionType, sequenceNumber: 0 }]).map((question, index) => (
              <div key={question.id || index} className="flex gap-2">
                <Input
                  value={question.text}
                  onChange={(e) => {
                    const newQuestions = [...(block.content.questions || [])];
                    newQuestions[index] = { ...question, text: e.target.value };
                    updateBlockContent(block.id, { questions: newQuestions });
                  }}
                  placeholder={`Reflection question ${index + 1}`}
                />
                {(block.content.questions?.length || 0) > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newQuestions = (block.content.questions || []).filter((_, i) => i !== index);
                      // Update sequence numbers
                      const resequenced = newQuestions.map((q, i) => ({ ...q, sequenceNumber: i }));
                      updateBlockContent(block.id, { questions: resequenced });
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
                const currentQuestions = block.content.questions || [];
                const newQuestions = [
                  ...currentQuestions,
                  { id: `q-${Date.now()}`, text: '', type: 'open_text' as QuestionType, sequenceNumber: currentQuestions.length },
                ];
                updateBlockContent(block.id, { questions: newQuestions });
              }}
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>
        );
      case 'survey':
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Survey Questions</label>
            {(block.content.surveyQuestions || [{ id: `sq-default`, text: '', type: 'open_text' as QuestionType, sequenceNumber: 0 }]).map((question, index) => (
              <div key={question.id || index} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                {/* Question Text and Type */}
                <div className="flex gap-2">
                  <Input
                    value={question.text}
                    onChange={(e) => {
                      const newQuestions = [...(block.content.surveyQuestions || [])];
                      newQuestions[index] = { ...question, text: e.target.value };
                      updateBlockContent(block.id, { surveyQuestions: newQuestions });
                    }}
                    placeholder={`Survey question ${index + 1}`}
                    className="flex-1"
                  />
                  {(block.content.surveyQuestions?.length || 0) > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newQuestions = (block.content.surveyQuestions || []).filter((_, i) => i !== index);
                        const resequenced = newQuestions.map((q, i) => ({ ...q, sequenceNumber: i }));
                        updateBlockContent(block.id, { surveyQuestions: resequenced });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Question Type Selector */}
                <select
                  value={question.type || 'open_text'}
                  onChange={(e) => {
                    const newQuestions = [...(block.content.surveyQuestions || [])];
                    const newType = e.target.value as QuestionType;
                    newQuestions[index] = {
                      ...question,
                      type: newType,
                      scaleMin: newType === 'scale' ? 1 : undefined,
                      scaleMax: newType === 'scale' ? 5 : undefined,
                      options: newType === 'multiple_choice' ? [''] : undefined,
                    };
                    updateBlockContent(block.id, { surveyQuestions: newQuestions });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                >
                  <option value="open_text">Open Text</option>
                  <option value="scale">Rating Scale</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="yes_no">Yes/No</option>
                </select>

                {/* Scale Configuration */}
                {question.type === 'scale' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        value={question.scaleMin || 1}
                        onChange={(e) => {
                          const newQuestions = [...(block.content.surveyQuestions || [])];
                          newQuestions[index] = { ...question, scaleMin: parseInt(e.target.value) };
                          updateBlockContent(block.id, { surveyQuestions: newQuestions });
                        }}
                        placeholder="Min (e.g., 1)"
                      />
                      <Input
                        type="number"
                        value={question.scaleMax || 5}
                        onChange={(e) => {
                          const newQuestions = [...(block.content.surveyQuestions || [])];
                          newQuestions[index] = { ...question, scaleMax: parseInt(e.target.value) };
                          updateBlockContent(block.id, { surveyQuestions: newQuestions });
                        }}
                        placeholder="Max (e.g., 5)"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={question.scaleMinLabel || ''}
                        onChange={(e) => {
                          const newQuestions = [...(block.content.surveyQuestions || [])];
                          newQuestions[index] = { ...question, scaleMinLabel: e.target.value };
                          updateBlockContent(block.id, { surveyQuestions: newQuestions });
                        }}
                        placeholder="Min label (optional)"
                      />
                      <Input
                        value={question.scaleMaxLabel || ''}
                        onChange={(e) => {
                          const newQuestions = [...(block.content.surveyQuestions || [])];
                          newQuestions[index] = { ...question, scaleMaxLabel: e.target.value };
                          updateBlockContent(block.id, { surveyQuestions: newQuestions });
                        }}
                        placeholder="Max label (optional)"
                      />
                    </div>
                  </div>
                )}

                {/* Multiple Choice Options */}
                {question.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">Answer Options</label>
                    {(question.options || ['']).map((option, optIndex) => (
                      <div key={optIndex} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newQuestions = [...(block.content.surveyQuestions || [])];
                            const newOptions = [...(question.options || [''])];
                            newOptions[optIndex] = e.target.value;
                            newQuestions[index] = { ...question, options: newOptions };
                            updateBlockContent(block.id, { surveyQuestions: newQuestions });
                          }}
                          placeholder={`Option ${optIndex + 1}`}
                        />
                        {optIndex > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newQuestions = [...(block.content.surveyQuestions || [])];
                              const newOptions = (question.options || ['']).filter((_, i) => i !== optIndex);
                              newQuestions[index] = { ...question, options: newOptions };
                              updateBlockContent(block.id, { surveyQuestions: newQuestions });
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newQuestions = [...(block.content.surveyQuestions || [])];
                        const newOptions = [...(question.options || ['']), ''];
                        newQuestions[index] = { ...question, options: newOptions };
                        updateBlockContent(block.id, { surveyQuestions: newQuestions });
                      }}
                      className="w-full text-xs"
                    >
                      + Add Option
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const currentQuestions = block.content.surveyQuestions || [];
                const newQuestions = [
                  ...currentQuestions,
                  { id: `sq-${Date.now()}`, text: '', type: 'open_text' as QuestionType, sequenceNumber: currentQuestions.length },
                ];
                updateBlockContent(block.id, { surveyQuestions: newQuestions });
              }}
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Add Question
            </Button>
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
                  <div className="absolute top-full right-0 z-10 mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
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
                    {block.content.sceneId && block.content.sceneTitle && (
                      <p className="line-clamp-1 text-xs text-gray-600">
                        Scene:
                        {' '}
                        {block.content.sceneTitle}
                      </p>
                    )}
                    {block.content.questions && block.content.questions.length > 0 && (
                      <p className="line-clamp-1 text-xs text-gray-600">
                        {block.content.questions.length}
                        {' '}
                        reflection question(s)
                      </p>
                    )}
                    {block.content.surveyQuestions && block.content.surveyQuestions.length > 0 && (
                      <p className="line-clamp-1 text-xs text-gray-600">
                        {block.content.surveyQuestions.length}
                        {' '}
                        survey question(s)
                      </p>
                    )}
                    {block.content.mediaUrl && !block.content.sceneId && (
                      <p className="text-xs">
                        Media:
                        {block.content.mediaUrl}
                      </p>
                    )}
                    {!block.content.text && !block.content.sceneId && !block.content.questions && !block.content.surveyQuestions && !block.content.mediaUrl && (
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
                  {block.type === 'scene' && block.content.sceneId && (
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Clapperboard className="h-5 w-5 text-purple-600" />
                        <p className="font-medium text-purple-900">{block.content.sceneTitle}</p>
                      </div>
                      {block.content.mediaUrl && (
                        <div className="aspect-video overflow-hidden rounded-lg bg-gray-900">
                          {block.content.mediaUrl.includes('.mp4') || block.content.mediaUrl.includes('video') ? (
                            <div className="flex h-full items-center justify-center">
                              <Video className="h-16 w-16 text-white opacity-50" />
                            </div>
                          ) : (
                            <img src={block.content.mediaUrl} alt={block.content.sceneTitle || 'Scene'} className="h-full w-full object-cover" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {block.type === 'reflection' && block.content.questions && block.content.questions.length > 0 && (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                      <p className="mb-3 font-medium text-indigo-900">Reflection Questions</p>
                      <div className="space-y-4">
                        {block.content.questions.map((q, i) => (
                          <div key={q.id || i}>
                            <p className="mb-2 text-sm font-medium text-gray-700">
                              {i + 1}
                              .
                              {' '}
                              {q.text}
                            </p>
                            <textarea
                              placeholder="Your response..."
                              className="h-20 w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm"
                              disabled
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {block.type === 'survey' && block.content.surveyQuestions && block.content.surveyQuestions.length > 0 && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <p className="mb-3 font-medium text-green-900">Survey Questions</p>
                      <div className="space-y-4">
                        {block.content.surveyQuestions.map((q, i) => (
                          <div key={q.id || i}>
                            <p className="mb-2 text-sm font-medium text-gray-700">
                              {i + 1}
                              .
                              {' '}
                              {q.text}
                              {' '}
                              <span className="text-xs text-gray-500">
                                (
                                {q.type}
                                )
                              </span>
                            </p>
                            {q.type === 'open_text' && (
                              <textarea
                                placeholder="Your answer..."
                                className="h-16 w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm"
                                disabled
                              />
                            )}
                            {q.type === 'scale' && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">{q.scaleMinLabel || q.scaleMin || 1}</span>
                                <input type="range" min={q.scaleMin || 1} max={q.scaleMax || 5} className="flex-1" disabled />
                                <span className="text-xs text-gray-600">{q.scaleMaxLabel || q.scaleMax || 5}</span>
                              </div>
                            )}
                            {q.type === 'multiple_choice' && (
                              <div className="space-y-1">
                                {(q.options || []).map((opt, optIdx) => (
                                  <label key={optIdx} className="flex items-center gap-2">
                                    <input type="radio" disabled />
                                    <span className="text-sm text-gray-600">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            {q.type === 'yes_no' && (
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                  <input type="radio" disabled />
                                  <span className="text-sm text-gray-600">Yes</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <input type="radio" disabled />
                                  <span className="text-sm text-gray-600">No</span>
                                </label>
                              </div>
                            )}
                          </div>
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
        filterType={assetPickerFilterType}
        patientId={selectedPatientId || undefined}
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
