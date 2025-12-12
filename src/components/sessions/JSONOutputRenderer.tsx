'use client';

import type { SchemaAction } from '@/config/SchemaActions';
import type { AnyJSONSchema, JSONSchemaType } from '@/types/JSONSchemas';
import {
  ChevronDown,
  ChevronUp,
  Circle,
  FileText,
  Film,
  HelpCircle,
  Image,
  Mic,
  Music,
  PlusCircle,
  Quote,
  Save,
} from 'lucide-react';
import { useState } from 'react';
import { getActionsForSchema, getSchemaDescription, getSchemaDisplayName } from '@/config/SchemaActions';

type JSONOutputRendererProps = {
  jsonData: AnyJSONSchema & { schemaType: JSONSchemaType };
  sessionId: string;
  user: any;
  onActionComplete: (result: { message: string; data?: any }) => void;
  onProgress: (update: string) => void;
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
};

export function JSONOutputRenderer({
  jsonData,
  sessionId,
  user,
  onActionComplete,
  onProgress,
  onOpenImageModal,
  onOpenVideoModal,
  onOpenMusicModal,
}: JSONOutputRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const { schemaType } = jsonData;
  const actions = getActionsForSchema(schemaType);

  const handleAction = async (action: SchemaAction, imageIndex?: number) => {
    // Show confirmation if needed
    if (action.confirmation && !window.confirm(action.confirmation)) {
      return;
    }

    // Set processing action ID (with index for image_references)
    const processingId = imageIndex !== undefined ? `${action.id}_${imageIndex}` : action.id;
    setProcessingAction(processingId);

    try {
      // Dynamically import action handlers
      const { ACTION_HANDLERS } = await import('@/services/JSONActionHandlers');

      const handler = ACTION_HANDLERS[action.handler];
      if (!handler) {
        throw new Error(`Handler ${action.handler} not found`);
      }

      await handler({
        jsonData,
        sessionId,
        user,
        onProgress,
        onComplete: onActionComplete,
        onOpenImageModal,
        onOpenVideoModal,
        onOpenMusicModal,
        imageIndex, // Pass imageIndex for handlers that need it
      });
    } catch (error) {
      console.error('Action error:', error);
      onActionComplete({
        message: `❌ Failed to ${action.label.toLowerCase()}. Please try again.`,
      });
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-indigo-100 p-1.5">
            <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-indigo-900">{getSchemaDisplayName(schemaType)}</h4>
            <p className="text-xs text-indigo-700">{getSchemaDescription(schemaType)}</p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-indigo-600 hover:text-indigo-700"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Preview / Summary */}
      <div className="mb-3 rounded-lg bg-white/80 p-3">{renderPreview(schemaType, jsonData)}</div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {schemaType === 'image_references' && jsonData.images && actions[0] ? (
          // For image_references, render one button per image
          (() => {
            const action = actions[0];
            return jsonData.images.map((img: any, index: number) => (
              <button
                key={`generate-image-${index}`}
                onClick={() => handleAction(action, index)}
                disabled={processingAction !== null}
                className={`
                  flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                  transition-all disabled:cursor-not-allowed disabled:opacity-50
                  ${
              processingAction === `generate_single_image_${index}`
                ? 'bg-indigo-600 text-white'
                : 'border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100'
              }
                `}
              >
                {processingAction === `generate_single_image_${index}` ? (
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
                    {img.title}
                    "
                  </>
                )}
              </button>
            ));
          })()
        ) : schemaType === 'video_references' && jsonData.videos && actions[0] ? (
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
              ? 'bg-indigo-600 text-white'
              : 'border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100'
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

      {/* Expandable JSON View */}
      {isExpanded && (
        <details className="mt-3 rounded-lg border border-indigo-200 bg-white p-3" open>
          <summary className="cursor-pointer text-xs font-medium text-gray-700">View Raw JSON</summary>
          <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

// Helper: Render preview based on schema type
function renderPreview(schemaType: JSONSchemaType, data: any) {
  switch (schemaType) {
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
            {/* Instrumental Option */}
            <div className="group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-5 transition-all hover:border-purple-400 hover:shadow-xl">
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
                <p className="mb-4 text-sm italic leading-relaxed text-purple-600">{data.instrumental_option.rationale}</p>
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
            </div>

            {/* Lyrical Option */}
            <div className="group relative overflow-hidden rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 transition-all hover:border-indigo-400 hover:shadow-xl">
              {/* Icon Badge */}
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-indigo-500 p-3 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-bold text-indigo-900">{data.lyrical_option?.title || 'Lyrical'}</h3>

              {/* Mood Badge */}
              {data.lyrical_option?.mood && (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-200 px-3 py-1">
                  <div className="h-2 w-2 rounded-full bg-indigo-600" />
                  <span className="text-xs font-semibold text-indigo-800">{data.lyrical_option.mood}</span>
                </div>
              )}

              {/* Description */}
              {data.lyrical_option?.music_description && (
                <p className="mb-4 text-sm leading-relaxed text-indigo-700">{data.lyrical_option.music_description}</p>
              )}

              {/* Lyrics Preview */}
              {data.lyrical_option?.suggested_lyrics && (
                <div className="mb-4 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
                  <p className="mb-1 text-xs font-medium text-indigo-600">Lyrics Preview:</p>
                  <p className="line-clamp-4 text-sm italic text-indigo-900 whitespace-pre-wrap">
                    {typeof data.lyrical_option.suggested_lyrics === 'string'
                      ? data.lyrical_option.suggested_lyrics
                      : data.lyrical_option.suggested_lyrics.slice(0, 200) + '...'}
                  </p>
                </div>
              )}

              {/* Rationale */}
              {data.lyrical_option?.rationale && (
                <p className="mb-4 text-sm italic leading-relaxed text-indigo-600">{data.lyrical_option.rationale}</p>
              )}

              {/* Technical Details */}
              {data.lyrical_option?.genre_tags && (
                <div className="flex flex-wrap gap-1">
                  {data.lyrical_option.genre_tags.map((tag: string, i: number) => (
                    <span key={i} className="rounded-full bg-indigo-200/60 px-2 py-0.5 text-xs font-medium text-indigo-800">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Hover Indicator */}
              <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-indigo-400/20 transition-transform group-hover:scale-150" />
            </div>
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

    case 'image_references':
      return (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">
            {data.images?.length || 0}
            {' '}
            Image Suggestion
            {data.images?.length !== 1 ? 's' : ''}
          </p>
          {data.images?.map((img: any, index: number) => (
            <div
              key={index}
              className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <h4 className="mb-1 text-sm font-medium text-gray-900">{img.title}</h4>
                <p className="mb-2 line-clamp-2 text-xs text-gray-600">{img.therapeutic_purpose}</p>
                {img.source_quote && (
                  <p className="line-clamp-1 text-xs text-gray-500 italic">
                    "
                    {img.source_quote}
                    "
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 rounded-lg bg-indigo-100 px-3 py-1.5">
                <p className="text-xs font-medium text-indigo-700">
                  Image #
                  {index + 1}
                </p>
              </div>
            </div>
          ))}
        </div>
      );

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

    case 'reflection_questions':
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">Reflection Questions:</p>
          <ul className="space-y-1 text-xs text-gray-700">
            {data.patient_questions && (
              <li>
                •
                {data.patient_questions.length}
                {' '}
                patient questions
              </li>
            )}
            {data.group_questions && (
              <li>
                •
                {data.group_questions.length}
                {' '}
                group questions
              </li>
            )}
            {data.reflection_questions && (
              <li>
                •
                {data.reflection_questions.length}
                {' '}
                questions
              </li>
            )}
          </ul>
        </div>
      );

    case 'therapeutic_note':
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">{data.note_title}</p>
          <p className="line-clamp-3 text-xs text-gray-600">{data.note_content}</p>
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

    case 'quote_extraction': {
      const quotes = data.extracted_quotes || data.quotes || [];
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">Extracted Quotes:</p>
          <ul className="space-y-1 text-xs text-gray-700">
            {quotes.slice(0, 3).map((quote: any, i: number) => (
              <li key={i} className="line-clamp-2">
                "
                {quote.quote_text || quote.text}
                "
              </li>
            ))}
            {quotes.length > 3 && (
              <li className="text-gray-500">
                ...and
                {quotes.length - 3}
                {' '}
                more
              </li>
            )}
          </ul>
        </div>
      );
    }

    default:
      return (
        <p className="text-xs text-gray-600">
          {Object.keys(data).length}
          {' '}
          fields detected
        </p>
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
