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

      // Normal rendering when all fields are present
      return (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">
            {data.images.length}
            {' '}
            Image Suggestion
            {data.images.length !== 1 ? 's' : ''}
          </p>
          {data.images.map((img: any, index: number) => (
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
              <p className="text-xs text-gray-500">+ {data.metaphors.length - 3} more metaphors</p>
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
              <p className="text-xs text-gray-500">+ {data.moments.length - 3} more moments</p>
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
              <p className="mb-1 text-xs font-medium text-green-900">Values ({data.values?.length || 0})</p>
              <ul className="space-y-1">
                {data.values?.slice(0, 3).map((v: any, i: number) => (
                  <li key={i} className="text-xs text-green-700">• {v.value}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
              <p className="mb-1 text-xs font-medium text-amber-900">Beliefs ({data.beliefs?.length || 0})</p>
              <ul className="space-y-1">
                {data.beliefs?.slice(0, 3).map((b: any, i: number) => (
                  <li key={i} className="text-xs text-amber-700">• {b.belief}</li>
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
              <div key={i} className="rounded-lg border border-indigo-200 bg-indigo-50 p-2">
                <p className="text-xs font-medium text-indigo-900">{g.goal}</p>
                {g.timeframe && <p className="text-xs text-indigo-600">⏱️ {g.timeframe}</p>}
              </div>
            ))}
            {data.goals?.length > 3 && (
              <p className="text-xs text-gray-500">+ {data.goals.length - 3} more goals</p>
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
                  <li key={i} className="text-xs text-emerald-700">• {s.strength}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-2">
              <p className="mb-1 text-xs font-medium text-teal-900">External Resources</p>
              <ul className="space-y-1">
                {data.external_resources?.slice(0, 3).map((r: any, i: number) => (
                  <li key={i} className="text-xs text-teal-700">• {r.resource}</li>
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
                    b.type === 'internal' ? 'bg-red-200 text-red-800' :
                    b.type === 'external' ? 'bg-orange-200 text-orange-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {b.type}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-xs ${
                    b.impact === 'high' ? 'bg-red-300 text-red-900' :
                    b.impact === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                    'bg-green-200 text-green-900'
                  }`}>
                    {b.impact} impact
                  </span>
                </div>
              </div>
            ))}
            {data.barriers?.length > 3 && (
              <p className="text-xs text-gray-500">+ {data.barriers.length - 3} more barriers</p>
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
                <ul className="ml-4 mt-1 list-disc space-y-0.5 text-amber-700">
                  <li className={data.title ? 'line-through' : ''}>title {data.title ? '✓' : '✗'}</li>
                  <li className={data.description ? 'line-through' : ''}>description {data.description ? '✓' : '✗'}</li>
                  <li className={data.dalle_prompt ? 'line-through' : ''}>dalle_prompt {data.dalle_prompt ? '✓' : '✗'}</li>
                  <li className={data.mood ? 'line-through' : ''}>mood {data.mood ? '✓' : '✗'}</li>
                  <li className={data.symbolic_elements ? 'line-through' : ''}>symbolic_elements {data.symbolic_elements ? '✓' : '✗'}</li>
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
          <p className="font-semibold text-gray-900">🎬 {data.title}</p>
          <p className="line-clamp-3 text-xs text-gray-700">{data.description}</p>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{data.mood}</span>
            {data.symbolic_elements?.slice(0, 2).map((el: string, i: number) => (
              <span key={i} className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">{el}</span>
            ))}
          </div>
        </div>
      );
    }

    case 'visual_metaphor':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">🖼️ {data.metaphor_title}</p>
          <p className="line-clamp-2 text-xs text-gray-700">{data.metaphor_description}</p>
          <p className="line-clamp-2 text-xs italic text-purple-600">{data.symbolic_meaning}</p>
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
          <p className="text-xs text-gray-500">{data.key_shifts?.length || 0} perspective shifts identified</p>
        </div>
      );

    case 'hope_visualization':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-transparent bg-gradient-to-r from-yellow-600 to-pink-600 bg-clip-text">
            ✨ {data.hope_title}
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
          <p className="font-semibold text-gray-900">🗺️ {data.journey_title}</p>
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
            <p className="text-xs text-gray-500">+ {data.stages.length - 4} more stages</p>
          )}
        </div>
      );

    case 'character_strength':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">🦸 {data.portrait_title}</p>
          <p className="line-clamp-2 text-xs text-gray-700">{data.narrative_summary}</p>
          <div className="flex flex-wrap gap-1">
            {data.core_strengths?.slice(0, 4).map((s: any, i: number) => (
              <span key={i} className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {s.strength}
              </span>
            ))}
          </div>
        </div>
      );

    case 'timeline_visualization':
      return (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gray-900">📅 {data.timeline_title}</p>
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
            <p className="text-xs text-gray-500">+ {data.timeline_entries.length - 4} more entries</p>
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
            <p className="text-xs text-gray-500">+ {data.prompts.length - 4} more prompts</p>
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
                  q.category === 'clarification' ? 'bg-blue-100 text-blue-700' :
                  q.category === 'planning' ? 'bg-green-100 text-green-700' :
                  q.category === 'motivation' ? 'bg-purple-100 text-purple-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {q.category}
                </span>
                <span className="flex-1 text-gray-900">{q.question}</span>
              </li>
            ))}
          </ul>
          {data.questions?.length > 4 && (
            <p className="text-xs text-gray-500">+ {data.questions.length - 4} more questions</p>
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
            <p className="text-xs text-gray-500">+ {data.prompts.length - 4} more prompts</p>
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
            <p className="text-xs text-gray-500">+ {data.prompts.length - 4} more prompts</p>
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
                  <p className="mt-1 text-xs text-blue-600">⏱️ {a.time_required}</p>
                )}
              </li>
            ))}
          </ul>
          {data.assignments?.length > 3 && (
            <p className="text-xs text-gray-500">+ {data.assignments.length - 3} more assignments</p>
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
                  q.type === 'scale' ? 'bg-indigo-100 text-indigo-700' :
                  q.type === 'open' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {q.type}
                </span>
                <span className="flex-1 text-gray-900">{q.question}</span>
              </li>
            ))}
          </ul>
          {data.questions?.length > 4 && (
            <p className="text-xs text-gray-500">+ {data.questions.length - 4} more questions</p>
          )}
        </div>
      );

    default:
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-amber-900">⚠️ Unknown Schema Type</p>
          <p className="text-xs text-gray-600">
            Schema type "{schemaType}" is not yet implemented.
          </p>
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              View raw JSON ({Object.keys(data).length} fields)
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
