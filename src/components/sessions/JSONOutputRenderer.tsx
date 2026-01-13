'use client';

import type { JSX } from 'react';
import type { TherapeuticSceneCard } from '@/components/transcript/TherapeuticSceneCardRenderer';
import type { SchemaAction } from '@/config/SchemaActions';
import type { AnyJSONSchema, JSONSchemaType } from '@/types/JSONSchemas';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  FileText,
  Film,
  HelpCircle,
  Image,
  Mic,
  Music,
  PlusCircle,
  Quote,
  RefreshCw,
  Save,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TherapeuticSceneCardRenderer } from '@/components/transcript/TherapeuticSceneCardRenderer';
import { getActionsForSchema, getSchemaDescription, getSchemaDisplayName } from '@/config/SchemaActions';

type JSONOutputRendererProps = {
  jsonData: AnyJSONSchema & { schemaType: JSONSchemaType };
  sessionId?: string; // Optional in preview mode
  user?: any; // Optional in preview mode
  patientId?: string; // Optional patient ID for saving quotes/notes
  previewMode?: boolean; // When true, hide action buttons and disable interactions
  onActionComplete?: (result: { message: string; data?: any }) => void;
  onProgress?: (update: string) => void;
  onOpenImageModal?: (data: {
    prompt: string;
    style?: string;
    title?: string;
    description?: string;
    sourceQuote?: string;
  }) => void;
  onOpenVideoModal?: (data: {
    prompt: string;
    title?: string;
    duration?: number;
    referenceImagePrompt?: string;
    sourceQuote?: string;
  }) => void;
  onOpenMusicModal?: (data: {
    instrumentalOption?: any;
    lyricalOption?: any;
  }) => void;
  onOpenSceneGeneration?: (data: {
    sceneCard: any;
  }) => void;
  onOpenModuleSelector?: (options: {
    onModuleSelected: (moduleId: string) => void;
  }) => void;
  onOpenSaveNoteModal?: (data: {
    title: string;
    content: string;
    tags?: string[];
  }) => void;
  onOpenBulkSaveQuotes?: (quotes: any[]) => void;
  onRetry?: () => void;
};

export function JSONOutputRenderer({
  jsonData,
  sessionId,
  user,
  patientId,
  previewMode = false,
  onActionComplete,
  onProgress,
  onOpenImageModal,
  onOpenVideoModal,
  onOpenMusicModal,
  onOpenSceneGeneration,
  onOpenModuleSelector,
  onOpenSaveNoteModal,
  onOpenBulkSaveQuotes,
  onRetry,
}: JSONOutputRendererProps) {
  const router = useRouter();
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    templateTitle: string;
  } | null>(null);
  // Track which therapeutic notes are expanded
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  // Track copied state for feedback
  const [copiedContent, setCopiedContent] = useState<boolean>(false);

  // Handle copy content for therapeutic notes - preserves newlines
  const handleCopyNoteContent = async (title: string, content: string) => {
    try {
      // Convert HTML to plain text while preserving newlines
      const plainContent = content
        .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newline
        .replace(/<\/p>/gi, '\n\n') // Convert </p> to double newline
        .replace(/<\/div>/gi, '\n') // Convert </div> to newline
        .replace(/<\/li>/gi, '\n') // Convert </li> to newline
        .replace(/<[^>]*>/g, '') // Strip remaining HTML tags
        .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines to max 2
        .trim();
      const fullText = `${title}\n\n${plainContent}`;
      await navigator.clipboard.writeText(fullText);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const { schemaType } = jsonData;
  // Filter out actions for music_generation - cards are now clickable directly
  const actions = schemaType === 'music_generation' ? [] : getActionsForSchema(schemaType);

  const handleAction = async (action: SchemaAction, imageIndex?: number) => {
    // Disable actions in preview mode
    if (previewMode) return;

    // Show confirmation if needed
    if (action.confirmation && !window.confirm(action.confirmation)) {
      return;
    }

    // Handle callback actions (e.g., onOpenBulkSaveQuotes)
    if ('callback' in action && action.callback) {
      if (action.callback === 'onOpenBulkSaveQuotes' && onOpenBulkSaveQuotes) {
        const quotes = (jsonData as any).extracted_quotes || (jsonData as any).quotes || [];
        onOpenBulkSaveQuotes(quotes);
      }
      return;
    }

    // Set processing action ID (with index for image_references)
    const processingId = imageIndex !== undefined ? `${action.id}_${imageIndex}` : action.id;
    setProcessingAction(processingId);

    try {
      // Dynamically import action handlers
      const { ACTION_HANDLERS } = await import('@/services/JSONActionHandlers');

      if (!action.handler) {
        throw new Error('No handler specified for action');
      }

      const handler = ACTION_HANDLERS[action.handler];
      if (!handler) {
        throw new Error(`Handler ${action.handler} not found`);
      }

      // Wrap onComplete to intercept and show modal for template library actions
      const wrappedOnComplete = (result: { message: string; data?: any }) => {
        // Check if this is a template library save action
        if (action.handler === 'handleSaveToTemplateLibrary' && result.message.includes('✅')) {
          setSuccessModal({
            isOpen: true,
            templateTitle: result.data?.title || 'Reflection Questions Template',
          });
        }
        // Always call the original onActionComplete
        if (onActionComplete) {
          onActionComplete(result);
        }
      };

      await handler({
        jsonData,
        sessionId: sessionId || '',
        user,
        patientId,
        onProgress: onProgress || (() => {}),
        onComplete: wrappedOnComplete,
        onOpenImageModal,
        onOpenVideoModal,
        onOpenMusicModal,
        onOpenModuleSelector,
        onOpenSaveNoteModal,
        imageIndex, // Pass imageIndex for handlers that need it
      });
    } catch (error) {
      console.error('Action error:', error);
      if (onActionComplete) {
        onActionComplete({
          message: `❌ Failed to ${action.label.toLowerCase()}. Please try again.`,
        });
      }
    } finally {
      setProcessingAction(null);
    }
  };

  /**
   * Renders markdown content with proper styling for therapeutic notes
   */
  const renderMarkdownContent = (content: string, isExpanded: boolean, noteIndex: number) => {
    const TRUNCATE_LENGTH = 200;
    const shouldTruncate = content.length > TRUNCATE_LENGTH;
    const displayContent = !isExpanded && shouldTruncate
      ? `${content.slice(0, TRUNCATE_LENGTH)}...`
      : content;

    return (
      <div className="space-y-2">
        <div className="prose prose-sm max-w-none text-xs">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }: any) => (
                <h1 className="mt-3 mb-2 text-base font-bold text-gray-900" {...props} />
              ),
              h2: ({ node, ...props }: any) => (
                <h2 className="mt-2 mb-1.5 text-sm font-semibold text-gray-900" {...props} />
              ),
              h3: ({ node, ...props }: any) => (
                <h3 className="mt-2 mb-1 text-xs font-semibold text-gray-900" {...props} />
              ),
              p: ({ node, ...props }: any) => (
                <p className="my-1 text-xs text-gray-600" {...props} />
              ),
              ul: ({ node, ...props }: any) => (
                <ul className="my-1 list-inside list-disc space-y-0.5 text-xs text-gray-600" {...props} />
              ),
              ol: ({ node, ...props }: any) => (
                <ol className="my-1 list-inside list-decimal space-y-0.5 text-xs text-gray-600" {...props} />
              ),
              li: ({ node, ...props }: any) => (
                <li className="text-xs text-gray-600" {...props} />
              ),
              strong: ({ node, ...props }: any) => (
                <strong className="font-semibold text-gray-900" {...props} />
              ),
              em: ({ node, ...props }: any) => (
                <em className="text-gray-700 italic" {...props} />
              ),
              code: ({ node, inline, ...props }: any) =>
                inline ? (
                  <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs" {...props} />
                ) : (
                  <code className="my-1 block rounded bg-gray-100 p-2 font-mono text-xs" {...props} />
                ),
              blockquote: ({ node, ...props }: any) => (
                <blockquote className="my-1 border-l-2 border-purple-300 pl-3 text-gray-600 italic" {...props} />
              ),
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>

        {shouldTruncate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newExpanded = new Set(expandedNotes);
              if (isExpanded) {
                newExpanded.delete(noteIndex);
              } else {
                newExpanded.add(noteIndex);
              }
              setExpandedNotes(newExpanded);
            }}
            className="flex items-center gap-1 text-xs font-medium text-purple-600 transition-colors hover:text-purple-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show more
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-50 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-purple-100 p-1.5">
            <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-purple-900">{getSchemaDisplayName(schemaType)}</h4>
            <p className="text-xs text-purple-700">{getSchemaDescription(schemaType)}</p>
          </div>
        </div>

      </div>

      {/* Preview / Summary */}
      <div className="mb-3 rounded-lg bg-white/80 p-3">{renderPreview(schemaType, jsonData, onOpenSceneGeneration, onOpenImageModal, onOpenMusicModal, onRetry, expandedNotes, setExpandedNotes, renderMarkdownContent, previewMode)}</div>

      {/* Action Buttons - skip for image_references since each card has its own button, and hide in preview mode */}
      {!previewMode && schemaType !== 'image_references' && (
        <div className="flex flex-wrap gap-2">
          {/* Copy Content button for therapeutic_note */}
          {schemaType === 'therapeutic_note' && (
            <button
              onClick={() => handleCopyNoteContent(jsonData.note_title || 'Note', jsonData.note_content || '')}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              {copiedContent ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Content
                </>
              )}
            </button>
          )}
          {schemaType === 'video_references' && jsonData.videos && actions[0] ? (
          // For video_references, render one button per video
            (() => {
              const action = actions[0];
              return jsonData.videos.map((vid: any, index: number) => (
                <button
                  key={`generate-video-${index}`}
                  onClick={() => handleAction(action, index)}
                  disabled={processingAction !== null}
                  className={`
                  flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                  transition-all disabled:cursor-not-allowed disabled:opacity-50
                  ${
                processingAction === `generate_single_video_${index}`
                  ? 'bg-purple-600 text-white'
                  : 'border border-purple-300 bg-white text-purple-700 hover:bg-purple-100'
                }
                `}
                >
                  {processingAction === `generate_single_video_${index}` ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      {getIconComponent(action.icon)}
                      Generate "
                      {vid.title}
                      "
                    </>
                  )}
                </button>
              ));
            })()
          ) : (
          // For other schemas, render standard action buttons
            actions.map(action => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                disabled={processingAction !== null}
                className={`
                flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                transition-all disabled:cursor-not-allowed disabled:opacity-50
                ${
              processingAction === action.id
                ? 'bg-purple-600 text-white'
                : 'border border-purple-300 bg-white text-purple-700 hover:bg-purple-100'
              }
              `}
              >
                {processingAction === action.id ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    {getIconComponent(action.icon)}
                    {action.label}
                  </>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Success Modal for Template Library */}
      {successModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Template Saved!</h3>
            </div>
            <p className="mb-6 text-sm text-gray-600">
              "
              {successModal.templateTitle}
              " has been saved to your template library.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSuccessModal(null);
                  router.push('/therapist/templates');
                }}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Go to Templates Library
              </button>
              <button
                onClick={() => setSuccessModal(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper: Render preview based on schema type
function renderPreview(
  schemaType: JSONSchemaType,
  data: any,
  onOpenSceneGeneration?: (data: { sceneCard: any }) => void,
  onOpenImageModal?: (data: {
    prompt: string;
    style?: string;
    title?: string;
    description?: string;
    sourceQuote?: string;
  }) => void,
  onOpenMusicModal?: (data: {
    instrumentalOption?: any;
    lyricalOption?: any;
  }) => void,
  onRetry?: () => void,
  expandedNotes?: Set<number>,
  _setExpandedNotes?: (notes: Set<number>) => void,
  renderMarkdownContent?: (content: string, isExpanded: boolean, noteIndex: number) => JSX.Element,
  previewMode?: boolean,
) {
  switch (schemaType) {
    case 'therapeutic_scene_card':
      // Render full therapeutic scene card renderer
      return (
        <TherapeuticSceneCardRenderer
          data={data as TherapeuticSceneCard}
          onGenerateScenes={(sceneData) => {
            if (onOpenSceneGeneration) {
              onOpenSceneGeneration({ sceneCard: sceneData });
            }
          }}
        />
      );

    case 'scene_card':
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">Scene Card Preview:</p>
          <ul className="space-y-1 text-xs text-gray-700">
            <li>
              •
              {data.reference_images?.length || 0}
              {' '}
              reference images
            </li>
            <li>
              •
              {data.patient_reflection_questions?.length || 0}
              {' '}
              patient questions
            </li>
            {data.group_reflection_questions?.length > 0 && (
              <li>
                •
                {data.group_reflection_questions.length}
                {' '}
                group questions
              </li>
            )}
            <li>
              • Music:
              {data.music?.duration_seconds || 0}
              s
            </li>
            <li>
              •
              {data.assembly_steps?.length || 0}
              {' '}
              assembly steps
            </li>
          </ul>
        </div>
      );

    case 'music_generation':
      return (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-900">Choose Music Style</p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Instrumental Option - NOW CLICKABLE (unless in preview mode) */}
            <button
              onClick={() => {
                if (!previewMode && onOpenMusicModal && data.instrumental_option) {
                  onOpenMusicModal({
                    instrumentalOption: data.instrumental_option,
                    lyricalOption: undefined,
                  });
                }
              }}
              disabled={previewMode}
              className={`group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-5 text-left transition-all ${previewMode ? 'cursor-default' : 'hover:border-purple-400 hover:shadow-xl focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'} focus:outline-none`}
            >
              {/* Icon Badge */}
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-purple-500 p-3 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-bold text-purple-900">
                {data.instrumental_option?.title || 'Instrumental'}
              </h3>

              {/* Mood Badge */}
              {data.instrumental_option?.mood && (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-purple-200 px-3 py-1">
                  <div className="h-2 w-2 rounded-full bg-purple-600" />
                  <span className="text-xs font-semibold text-purple-800">{data.instrumental_option.mood}</span>
                </div>
              )}

              {/* Description */}
              {data.instrumental_option?.music_description && (
                <p className="mb-4 text-sm leading-relaxed text-purple-700">{data.instrumental_option.music_description}</p>
              )}

              {/* Rationale */}
              {data.instrumental_option?.rationale && (
                <p className="mb-4 text-sm leading-relaxed text-purple-600 italic">{data.instrumental_option.rationale}</p>
              )}

              {/* Technical Details */}
              {(data.instrumental_option?.genre_tags || data.instrumental_option?.style_prompt) && (
                <div className="space-y-2 text-xs text-purple-600">
                  {data.instrumental_option?.genre_tags && (
                    <div className="flex flex-wrap gap-1">
                      {data.instrumental_option.genre_tags.map((tag: string, i: number) => (
                        <span key={i} className="rounded-full bg-purple-200/60 px-2 py-0.5 text-xs font-medium text-purple-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hover Indicator */}
              <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-purple-400/20 transition-transform group-hover:scale-150" />
            </button>

            {/* Lyrical Option - NOW CLICKABLE (unless in preview mode) */}
            <button
              onClick={() => {
                if (!previewMode && onOpenMusicModal && data.lyrical_option) {
                  onOpenMusicModal({
                    instrumentalOption: undefined,
                    lyricalOption: data.lyrical_option,
                  });
                }
              }}
              disabled={previewMode}
              className={`group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-5 text-left transition-all ${previewMode ? 'cursor-default' : 'hover:border-purple-400 hover:shadow-xl focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'} focus:outline-none`}
            >
              {/* Icon Badge */}
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-purple-500 p-3 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-bold text-purple-900">{data.lyrical_option?.title || 'Lyrical'}</h3>

              {/* Mood Badge */}
              {data.lyrical_option?.mood && (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-purple-200 px-3 py-1">
                  <div className="h-2 w-2 rounded-full bg-purple-600" />
                  <span className="text-xs font-semibold text-purple-800">{data.lyrical_option.mood}</span>
                </div>
              )}

              {/* Description */}
              {data.lyrical_option?.music_description && (
                <p className="mb-4 text-sm leading-relaxed text-purple-700">{data.lyrical_option.music_description}</p>
              )}

              {/* Lyrics Preview */}
              {data.lyrical_option?.suggested_lyrics && (
                <div className="mb-4 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
                  <p className="mb-1 text-xs font-medium text-purple-600">Lyrics Preview:</p>
                  <p className="line-clamp-4 text-sm whitespace-pre-wrap text-purple-900 italic">
                    {typeof data.lyrical_option.suggested_lyrics === 'string'
                      ? data.lyrical_option.suggested_lyrics
                      : Array.isArray(data.lyrical_option.suggested_lyrics)
                        ? data.lyrical_option.suggested_lyrics.slice(0, 200).join('\n')
                        : typeof data.lyrical_option.suggested_lyrics === 'object'
                          ? `${JSON.stringify(data.lyrical_option.suggested_lyrics, null, 2).slice(0, 200)}...`
                          : String(data.lyrical_option.suggested_lyrics)}
                  </p>
                </div>
              )}

              {/* Rationale */}
              {data.lyrical_option?.rationale && (
                <p className="mb-4 text-sm leading-relaxed text-purple-600 italic">{data.lyrical_option.rationale}</p>
              )}

              {/* Technical Details */}
              {data.lyrical_option?.genre_tags && (
                <div className="flex flex-wrap gap-1">
                  {data.lyrical_option.genre_tags.map((tag: string, i: number) => (
                    <span key={i} className="rounded-full bg-purple-200/60 px-2 py-0.5 text-xs font-medium text-purple-800">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Hover Indicator */}
              <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-purple-400/20 transition-transform group-hover:scale-150" />
            </button>
          </div>
        </div>
      );

    case 'scene_suggestions':
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">Scene Suggestions:</p>
          <ul className="space-y-1 text-xs text-gray-700">
            {data.potential_scenes_by_participant?.map((p: any, i: number) => (
              <li key={i}>
                •
                {' '}
                {p.for_patient_name}
                :
                {' '}
                {p.scenes?.length || 0}
                {' '}
                scene
                {p.scenes?.length !== 1 ? 's' : ''}
              </li>
            ))}
          </ul>
        </div>
      );

    case 'scene_suggestions_by_quote':
      return (
        <div className="space-y-4">
          {/* Quote Source */}
          {data.quote && (
            <div className="border-l-4 border-purple-500 bg-purple-50 py-3 pl-4">
              <p className="mb-1 text-xs font-semibold tracking-wide text-purple-700 uppercase">
                Source Quote
              </p>
              <p className="text-sm leading-relaxed text-purple-900 italic">
                "
                {data.quote}
                "
              </p>
            </div>
          )}

          {/* Scene Cards */}
          <p className="text-sm font-semibold text-gray-900">
            {data.scenes?.length || 0}
            {' '}
            Scene Suggestion
            {data.scenes?.length !== 1 ? 's' : ''}
          </p>

          <div className="space-y-4">
            {data.scenes?.map((scene: any, index: number) => (
              <div
                key={index}
                className="rounded-lg border border-purple-200 bg-white p-4 shadow-sm"
              >
                {/* Scene Title */}
                <h3 className="mb-2 text-base font-semibold text-gray-900">
                  {scene.sceneTitle}
                </h3>

                {/* Scene Description */}
                {scene.sceneDescription && (
                  <p className="mb-3 text-sm leading-relaxed text-gray-700">
                    {scene.sceneDescription}
                  </p>
                )}

                {/* Key Quote */}
                {scene.keyQuote && (
                  <div className="mb-3 border-l-4 border-amber-400 bg-amber-50 py-2 pl-3">
                    <p className="text-xs font-semibold text-amber-700">Key Quote</p>
                    <p className="text-sm text-amber-900 italic">
                      "
                      {scene.keyQuote}
                      "
                    </p>
                  </div>
                )}

                {/* Therapeutic Rationale */}
                {scene.therapeuticRationale && (
                  <div className="mb-3 rounded-lg bg-green-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-green-700">Therapeutic Rationale</p>
                    <p className="text-sm leading-relaxed text-green-800">
                      {scene.therapeuticRationale}
                    </p>
                  </div>
                )}

                {/* Scene Focus Instruction */}
                {scene.sceneFocusInstruction && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-blue-700">Scene Focus</p>
                    <p className="text-sm leading-relaxed text-blue-800">
                      {scene.sceneFocusInstruction}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case 'image_references': {
      // Defensive rendering: check if images array exists and has valid structure
      if (!data.images || !Array.isArray(data.images)) {
        return (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-semibold text-amber-900">⚠️ Invalid Image References</p>
              </div>
              <p className="mb-2 text-xs text-amber-800">
                The AI returned an image_references schema, but the 'images' array is missing or invalid.
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-amber-700 hover:text-amber-900">View raw data</summary>
                <pre className="mt-1 max-h-32 overflow-auto rounded bg-white p-2 text-xs text-gray-700">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        );
      }

      // Check if images have required fields
      const hasValidImages = data.images.every((img: any) => img.title && img.prompt);

      if (!hasValidImages) {
        return (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-semibold text-amber-900">⚠️ Incomplete Image Data</p>
              </div>
              <p className="mb-2 text-xs text-amber-800">
                Some images are missing required fields (title and/or prompt).
              </p>
              <p className="text-xs text-amber-700">Expected each image to have: title, prompt</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-amber-700 hover:text-amber-900">View raw data</summary>
                <pre className="mt-1 max-h-32 overflow-auto rounded bg-white p-2 text-xs text-gray-700">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        );
      }

      // Figma-matching card rendering
      return (
        <div className="space-y-6">
          {/* Perspective Cards */}
          {data.images.map((img: any, index: number) => (
            <div
              key={index}
              className="border-l-4 border-gray-200 bg-white py-3 pl-4"
            >
              {/* Title */}
              <h3 className="mb-2 text-base font-semibold text-gray-900">{img.title}</h3>

              {/* Description */}
              {(img.description || img.conceptDescription) && (
                <p className="mb-4 text-sm leading-relaxed text-gray-600">
                  {img.description || img.conceptDescription}
                </p>
              )}

              {/* Patient Quote */}
              {img.source_quote && (
                <div className="mb-4 border-l-4 border-purple-500 bg-purple-50 py-3 pl-4">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-purple-700 uppercase">
                    Patient Quote
                  </p>
                  <p className="text-sm leading-relaxed text-purple-900 italic">
                    "
                    {img.source_quote}
                    "
                  </p>
                </div>
              )}

              {/* Therapeutic Relevance */}
              {img.therapeutic_purpose && (
                <div className="mb-4 border-l-4 border-purple-500 bg-purple-50 py-3 pl-4">
                  <p className="mb-1 text-sm font-semibold text-purple-700">
                    Therapeutic Relevance:
                  </p>
                  <p className="text-sm leading-relaxed text-gray-700">
                    {img.therapeutic_purpose}
                  </p>
                </div>
              )}

              {/* Generate Image Button - hidden in preview mode */}
              {!previewMode && (
                <button
                  onClick={() => {
                    if (onOpenImageModal) {
                      onOpenImageModal({
                        prompt: img.prompt,
                        style: img.style,
                        title: img.title,
                        description: img.description || img.conceptDescription || img.therapeutic_purpose,
                        sourceQuote: img.source_quote,
                      });
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                >
                  <Image className="h-4 w-4" />
                  Generate Image: "
                  {img.title}
                  "
                </button>
              )}
            </div>
          ))}
        </div>
      );
    }

    case 'video_references':
      return (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">
            {data.videos?.length || 0}
            {' '}
            Video Suggestion
            {data.videos?.length !== 1 ? 's' : ''}
          </p>
          {data.videos?.map((vid: any, index: number) => (
            <div
              key={index}
              className="flex items-start justify-between gap-3 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <h4 className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Film className="h-4 w-4 text-purple-600" />
                  {vid.title}
                </h4>
                <p className="mb-2 line-clamp-2 text-xs text-gray-600">{vid.therapeutic_purpose}</p>
                {vid.motion_description && (
                  <p className="mb-1 text-xs text-purple-700">
                    <span className="font-medium">Motion:</span>
                    {' '}
                    {vid.motion_description}
                  </p>
                )}
                {vid.source_quote && (
                  <p className="line-clamp-1 text-xs text-gray-500 italic">
                    "
                    {vid.source_quote}
                    "
                  </p>
                )}
              </div>
              <div className="flex flex-shrink-0 flex-col gap-1">
                <div className="rounded-lg bg-purple-100 px-3 py-1.5">
                  <p className="text-xs font-medium text-purple-700">
                    Video #
                    {index + 1}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-100 px-3 py-1">
                  <p className="text-xs text-purple-600">
                    {vid.duration || 5}
                    s
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    case 'reflection_questions': {
      // Support multiple JSON formats from AI:
      // 1. questions: [{ question, rationale?, placement? }]
      // 2. patient_questions: string[] / group_questions: string[]
      const questionsArray = data.questions || [];
      const patientQuestions = data.patient_questions || [];
      const groupQuestions = data.group_questions || [];

      // Normalize all questions into a common format
      const normalizedQuestions: Array<{ question: string; rationale?: string; placement?: string; type?: string }> = [];

      // Add questions from 'questions' array (objects with rationale/placement)
      questionsArray.forEach((q: any) => {
        if (typeof q === 'string') {
          normalizedQuestions.push({ question: q });
        } else if (q.question) {
          normalizedQuestions.push({
            question: q.question,
            rationale: q.rationale,
            placement: q.placement,
          });
        }
      });

      // Add patient questions
      patientQuestions.forEach((q: string) => {
        normalizedQuestions.push({ question: q, type: 'patient' });
      });

      // Add group questions
      groupQuestions.forEach((q: string) => {
        normalizedQuestions.push({ question: q, type: 'group' });
      });

      if (normalizedQuestions.length === 0) {
        return (
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-900">No reflection questions found</p>
            <p className="mt-1 text-xs text-amber-700">The AI response didn't contain any questions.</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {normalizedQuestions.map((q, index) => (
            <div
              key={index}
              className="border-l-4 border-purple-500 bg-white py-3 pl-4"
            >
              {/* Question header with badge */}
              <div className="mb-2 flex items-start gap-2">
                <span className="flex-shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                  #
                  {index + 1}
                  {q.type && ` • ${q.type}`}
                </span>
              </div>

              {/* Question text */}
              <p className="text-sm leading-relaxed font-medium text-gray-900">
                {q.question}
              </p>

              {/* Rationale (if available) */}
              {q.rationale && (
                <div className="mt-3 border-l-4 border-purple-300 bg-purple-50 py-2 pl-3">
                  <p className="text-xs font-semibold tracking-wide text-purple-700 uppercase">
                    Rationale
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-purple-900">
                    {q.rationale}
                  </p>
                </div>
              )}

              {/* Placement (if available) */}
              {q.placement && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Placement:
                    {q.placement}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Context (if available) */}
          {data.context && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Context</p>
              <p className="mt-1 text-sm text-gray-700">{data.context}</p>
            </div>
          )}
        </div>
      );
    }

    case 'therapeutic_note': {
      // Generate a unique index for this note based on content hash
      const titleStr = String(data.note_title || '');
      const contentStr = String(data.note_content || '');
      const noteIndex = (titleStr + contentStr).split('').reduce((acc: number, char: string) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
      const isExpanded = expandedNotes?.has(noteIndex) ?? false;

      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">{data.note_title}</p>
          {renderMarkdownContent
            ? renderMarkdownContent(data.note_content || '', isExpanded, noteIndex)
            : <p className="text-xs whitespace-pre-wrap text-gray-600">{data.note_content}</p>}
          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.tags.map((tag: string, i: number) => (
                <span key={i} className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'quote_extraction': {
      const quotes = data.extracted_quotes || data.quotes || [];
      const displayQuotes = quotes.slice(0, 4);
      const remainingCount = quotes.length - displayQuotes.length;

      return (
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">
              {quotes.length}
              {' '}
              Quote
              {quotes.length !== 1 ? 's' : ''}
              {' '}
              Extracted
            </p>
          </div>
          <div className="space-y-2">
            {displayQuotes.map((quote: any, i: number) => (
              <div
                key={i}
                className="rounded-lg border border-purple-100 bg-gradient-to-r from-purple-50 to-white p-3"
              >
                <div className="flex gap-2">
                  <span className="mt-0.5 text-purple-400">"</span>
                  <div className="flex-1 space-y-1.5">
                    <p className="text-xs leading-relaxed text-gray-800">
                      {quote.quote_text || quote.text}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {quote.speaker && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                          <span className="font-medium">{quote.speaker}</span>
                        </span>
                      )}
                      {quote.tags && quote.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {quote.tags.slice(0, 3).map((tag: string, tagIdx: number) => (
                            <span
                              key={tagIdx}
                              className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-medium text-purple-600"
                            >
                              {tag}
                            </span>
                          ))}
                          {quote.tags.length > 3 && (
                            <span className="text-[9px] text-gray-400">
                              +
                              {quote.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {remainingCount > 0 && (
            <p className="text-center text-xs text-gray-400">
              +
              {remainingCount}
              {' '}
              more quote
              {remainingCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      );
    }

    // Extraction schemas
    case 'metaphor_extraction':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">🔮 Metaphors & Symbols</p>
          <div className="space-y-2">
            {data.metaphors?.slice(0, 3).map((m: any, i: number) => (
              <div key={i} className="rounded-lg border border-purple-200 bg-purple-50 p-2">
                <p className="text-xs font-medium text-purple-900">{m.metaphor}</p>
                <p className="text-xs text-purple-700">{m.symbolic_meaning}</p>
              </div>
            ))}
            {data.metaphors?.length > 3 && (
              <p className="text-xs text-gray-500">
                +
                {data.metaphors.length - 3}
                {' '}
                more metaphors
              </p>
            )}
          </div>
        </div>
      );

    case 'key_moments':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">⭐ Key Moments</p>
          <div className="space-y-2">
            {data.moments?.slice(0, 3).map((m: any, i: number) => (
              <div key={i} className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                <p className="text-xs font-medium text-blue-900">{m.moment_title}</p>
                <p className="line-clamp-2 text-xs text-blue-700">{m.significance}</p>
              </div>
            ))}
            {data.moments?.length > 3 && (
              <p className="text-xs text-gray-500">
                +
                {data.moments.length - 3}
                {' '}
                more moments
              </p>
            )}
          </div>
        </div>
      );

    case 'values_beliefs':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">💎 Values & Beliefs</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-2">
              <p className="mb-1 text-xs font-medium text-green-900">
                Values (
                {data.values?.length || 0}
                )
              </p>
              <ul className="space-y-1">
                {data.values?.slice(0, 3).map((v: any, i: number) => (
                  <li key={i} className="text-xs text-green-700">
                    •
                    {v.value}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
              <p className="mb-1 text-xs font-medium text-amber-900">
                Beliefs (
                {data.beliefs?.length || 0}
                )
              </p>
              <ul className="space-y-1">
                {data.beliefs?.slice(0, 3).map((b: any, i: number) => (
                  <li key={i} className="text-xs text-amber-700">
                    •
                    {b.belief}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );

    case 'goals_intentions':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">🎯 Goals & Intentions</p>
          <div className="space-y-2">
            {data.goals?.slice(0, 3).map((g: any, i: number) => (
              <div key={i} className="rounded-lg border border-purple-200 bg-purple-50 p-2">
                <p className="text-xs font-medium text-purple-900">{g.goal}</p>
                {g.timeframe && (
                  <p className="text-xs text-purple-600">
                    ⏱️
                    {g.timeframe}
                  </p>
                )}
              </div>
            ))}
            {data.goals?.length > 3 && (
              <p className="text-xs text-gray-500">
                +
                {data.goals.length - 3}
                {' '}
                more goals
              </p>
            )}
          </div>
        </div>
      );

    case 'strengths_resources':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">💪 Strengths & Resources</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2">
              <p className="mb-1 text-xs font-medium text-emerald-900">Internal Strengths</p>
              <ul className="space-y-1">
                {data.internal_strengths?.slice(0, 3).map((s: any, i: number) => (
                  <li key={i} className="text-xs text-emerald-700">
                    •
                    {s.strength}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-2">
              <p className="mb-1 text-xs font-medium text-teal-900">External Resources</p>
              <ul className="space-y-1">
                {data.external_resources?.slice(0, 3).map((r: any, i: number) => (
                  <li key={i} className="text-xs text-teal-700">
                    •
                    {r.resource}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );

    case 'barriers_challenges':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">🚧 Barriers & Challenges</p>
          <div className="space-y-2">
            {data.barriers?.slice(0, 3).map((b: any, i: number) => (
              <div key={i} className="rounded-lg border border-red-200 bg-red-50 p-2">
                <p className="text-xs font-medium text-red-900">{b.barrier}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs ${
                    b.type === 'internal' ? 'bg-red-200 text-red-800'
                      : b.type === 'external' ? 'bg-orange-200 text-orange-800'
                        : 'bg-gray-200 text-gray-800'
                  }`}
                  >
                    {b.type}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-xs ${
                    b.impact === 'high' ? 'bg-red-300 text-red-900'
                      : b.impact === 'medium' ? 'bg-yellow-200 text-yellow-900'
                        : 'bg-green-200 text-green-900'
                  }`}
                  >
                    {b.impact}
                    {' '}
                    impact
                  </span>
                </div>
              </div>
            ))}
            {data.barriers?.length > 3 && (
              <p className="text-xs text-gray-500">
                +
                {data.barriers.length - 3}
                {' '}
                more barriers
              </p>
            )}
          </div>
        </div>
      );

    // Visualization schemas
    case 'scene_visualization': {
      // Defensive rendering: check if required fields exist
      const hasRequiredFields = data.title && data.description && data.dalle_prompt;

      if (!hasRequiredFields) {
        // Show error state with what's available
        return (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-semibold text-amber-900">⚠️ Incomplete Scene Visualization</p>
              </div>
              <p className="mb-2 text-xs text-amber-800">
                The AI returned a scene_visualization schema, but it's missing required fields.
              </p>
              <div className="mb-2 text-xs">
                <p className="font-medium text-amber-900">Expected fields:</p>
                <ul className="mt-1 ml-4 list-disc space-y-0.5 text-amber-700">
                  <li className={data.title ? 'line-through' : ''}>
                    title
                    {data.title ? '✓' : '✗'}
                  </li>
                  <li className={data.description ? 'line-through' : ''}>
                    description
                    {data.description ? '✓' : '✗'}
                  </li>
                  <li className={data.dalle_prompt ? 'line-through' : ''}>
                    dalle_prompt
                    {data.dalle_prompt ? '✓' : '✗'}
                  </li>
                  <li className={data.mood ? 'line-through' : ''}>
                    mood
                    {data.mood ? '✓' : '✗'}
                  </li>
                  <li className={data.symbolic_elements ? 'line-through' : ''}>
                    symbolic_elements
                    {data.symbolic_elements ? '✓' : '✗'}
                  </li>
                </ul>
              </div>
              {data.analysis && (
                <div className="mt-2 rounded bg-amber-100 p-2">
                  <p className="text-xs font-medium text-amber-900">⚠️ Found unexpected 'analysis' field instead</p>
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-amber-700 hover:text-amber-900">View raw data</summary>
                    <pre className="mt-1 max-h-32 overflow-auto rounded bg-white p-2 text-xs text-gray-700">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        );
      }

      // Normal rendering when all fields are present
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">
            🎬
            {data.title}
          </p>
          <p className="line-clamp-3 text-xs text-gray-700">{data.description}</p>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{data.mood}</span>
            {data.symbolic_elements?.slice(0, 2).map((el: string, i: number) => (
              <span key={i} className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{el}</span>
            ))}
          </div>
        </div>
      );
    }

    case 'visual_metaphor':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">
            🖼️
            {data.metaphor_title}
          </p>
          <p className="line-clamp-2 text-xs text-gray-700">{data.metaphor_description}</p>
          <p className="line-clamp-2 text-xs text-purple-600 italic">{data.symbolic_meaning}</p>
        </div>
      );

    case 'story_reframe':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">🔄 Story Reframe</p>
          <div className="space-y-2">
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-2">
              <p className="mb-1 text-xs font-medium text-gray-600">Original Narrative:</p>
              <p className="line-clamp-2 text-xs text-gray-700">{data.original_narrative}</p>
            </div>
            <div className="rounded-lg border border-green-300 bg-green-50 p-2">
              <p className="mb-1 text-xs font-medium text-green-700">Reframed Narrative:</p>
              <p className="line-clamp-2 text-xs text-green-800">{data.reframed_narrative}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {data.key_shifts?.length || 0}
            {' '}
            perspective shifts identified
          </p>
        </div>
      );

    case 'hope_visualization':
      return (
        <div className="space-y-3 text-sm">
          <p className="bg-gradient-to-r from-yellow-600 to-pink-600 bg-clip-text font-semibold text-transparent">
            ✨
            {' '}
            {data.hope_title}
          </p>
          <p className="line-clamp-3 text-xs text-gray-700">{data.hope_description}</p>
          {data.concrete_elements && (
            <div className="flex flex-wrap gap-1">
              {data.concrete_elements.slice(0, 3).map((el: string, i: number) => (
                <span key={i} className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">{el}</span>
              ))}
            </div>
          )}
        </div>
      );

    case 'journey_map':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">
            🗺️
            {data.journey_title}
          </p>
          <div className="space-y-1.5">
            {data.stages?.slice(0, 4).map((stage: any, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900">{stage.stage_name}</p>
                  <p className="line-clamp-1 text-xs text-gray-600">{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
          {data.stages?.length > 4 && (
            <p className="text-xs text-gray-500">
              +
              {data.stages.length - 4}
              {' '}
              more stages
            </p>
          )}
        </div>
      );

    case 'character_strength':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">
            🦸
            {data.portrait_title}
          </p>
          <p className="line-clamp-2 text-xs text-gray-700">{data.narrative_summary}</p>
          <div className="flex flex-wrap gap-1">
            {data.core_strengths?.slice(0, 4).map((s: any, i: number) => (
              <span key={i} className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                {s.strength}
              </span>
            ))}
          </div>
        </div>
      );

    case 'timeline_visualization':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">
            📅
            {data.timeline_title}
          </p>
          <div className="space-y-1.5">
            {data.timeline_entries?.slice(0, 4).map((entry: any, i: number) => (
              <div key={i} className="flex items-start gap-2 border-l-2 border-blue-400 pl-3">
                <div className="flex-1">
                  {entry.date && <p className="text-xs font-medium text-blue-600">{entry.date}</p>}
                  <p className="text-xs font-medium text-gray-900">{entry.event}</p>
                  <p className="line-clamp-1 text-xs text-gray-600">{entry.significance}</p>
                </div>
              </div>
            ))}
          </div>
          {data.timeline_entries?.length > 4 && (
            <p className="text-xs text-gray-500">
              +
              {data.timeline_entries.length - 4}
              {' '}
              more entries
            </p>
          )}
        </div>
      );

    // Prompt schemas
    case 'journaling_prompts':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">✍️ Journaling Prompts</p>
          <ul className="space-y-1.5">
            {data.prompts?.slice(0, 4).map((p: any, i: number) => (
              <li key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                {p.prompt}
              </li>
            ))}
          </ul>
          {data.prompts?.length > 4 && (
            <p className="text-xs text-gray-500">
              +
              {data.prompts.length - 4}
              {' '}
              more prompts
            </p>
          )}
        </div>
      );

    case 'goal_setting_questions':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">🎯 Goal-Setting Questions</p>
          <ul className="space-y-1.5">
            {data.questions?.slice(0, 4).map((q: any, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className={`mt-0.5 rounded px-1.5 py-0.5 text-xs ${
                  q.category === 'clarification' ? 'bg-blue-100 text-blue-700'
                    : q.category === 'planning' ? 'bg-green-100 text-green-700'
                      : q.category === 'motivation' ? 'bg-purple-100 text-purple-700'
                        : 'bg-orange-100 text-orange-700'
                }`}
                >
                  {q.category}
                </span>
                <span className="flex-1 text-gray-900">{q.question}</span>
              </li>
            ))}
          </ul>
          {data.questions?.length > 4 && (
            <p className="text-xs text-gray-500">
              +
              {data.questions.length - 4}
              {' '}
              more questions
            </p>
          )}
        </div>
      );

    case 'self_compassion_prompts':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">💗 Self-Compassion Prompts</p>
          <ul className="space-y-1.5">
            {data.prompts?.slice(0, 4).map((p: any, i: number) => (
              <li key={i} className="rounded-lg border border-pink-200 bg-pink-50 p-2 text-xs text-pink-900">
                {p.prompt}
              </li>
            ))}
          </ul>
          {data.prompts?.length > 4 && (
            <p className="text-xs text-gray-500">
              +
              {data.prompts.length - 4}
              {' '}
              more prompts
            </p>
          )}
        </div>
      );

    case 'gratitude_prompts':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">🙏 Gratitude Prompts</p>
          <ul className="space-y-1.5">
            {data.prompts?.slice(0, 4).map((p: any, i: number) => (
              <li key={i} className="rounded-lg border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-900">
                {p.prompt}
              </li>
            ))}
          </ul>
          {data.prompts?.length > 4 && (
            <p className="text-xs text-gray-500">
              +
              {data.prompts.length - 4}
              {' '}
              more prompts
            </p>
          )}
        </div>
      );

    case 'homework_assignments':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">📋 Homework Assignments</p>
          <ul className="space-y-2">
            {data.assignments?.slice(0, 3).map((a: any, i: number) => (
              <li key={i} className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                <p className="text-xs font-medium text-blue-900">{a.assignment}</p>
                <p className="mt-1 line-clamp-1 text-xs text-blue-700">{a.purpose}</p>
                {a.time_required && (
                  <p className="mt-1 text-xs text-blue-600">
                    ⏱️
                    {a.time_required}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {data.assignments?.length > 3 && (
            <p className="text-xs text-gray-500">
              +
              {data.assignments.length - 3}
              {' '}
              more assignments
            </p>
          )}
        </div>
      );

    case 'check_in_questions':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">✅ Check-In Questions</p>
          <ul className="space-y-1.5">
            {data.questions?.slice(0, 4).map((q: any, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className={`mt-0.5 rounded px-1.5 py-0.5 text-xs ${
                  q.type === 'scale' ? 'bg-purple-100 text-purple-700'
                    : q.type === 'open' ? 'bg-green-100 text-green-700'
                      : 'bg-purple-100 text-purple-700'
                }`}
                >
                  {q.type}
                </span>
                <span className="flex-1 text-gray-900">{q.question}</span>
              </li>
            ))}
          </ul>
          {data.questions?.length > 4 && (
            <p className="text-xs text-gray-500">
              +
              {data.questions.length - 4}
              {' '}
              more questions
            </p>
          )}
        </div>
      );

    default:
      return (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-amber-900">⚠️ Unknown Schema Type</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1 rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            )}
          </div>
          <p className="text-xs text-gray-600">
            Schema type "
            {schemaType}
            " is not yet implemented.
          </p>
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              View raw JSON (
              {Object.keys(data).length}
              {' '}
              fields)
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      );
  }
}

// Helper: Get icon component from name
function getIconComponent(iconName: string) {
  const icons: Record<string, React.ReactNode> = {
    'film': <Film className="h-4 w-4" />,
    'image': <Image className="h-4 w-4" />,
    'music': <Music className="h-4 w-4" />,
    'mic': <Mic className="h-4 w-4" />,
    'help-circle': <HelpCircle className="h-4 w-4" />,
    'file-text': <FileText className="h-4 w-4" />,
    'save': <Save className="h-4 w-4" />,
    'quote': <Quote className="h-4 w-4" />,
    'plus-circle': <PlusCircle className="h-4 w-4" />,
  };

  return icons[iconName] || <Circle className="h-4 w-4" />;
}
