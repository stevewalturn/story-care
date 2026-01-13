'use client';

/**
 * Generic JSON Preview Component
 * Dynamic preview renderer for the Prompt Block Builder
 * Renders fields based on predefined schema types (image_references, video_references, etc.)
 */

import { Film, Image, MessageSquareQuote, Music } from 'lucide-react';

type GenericJSONPreviewProps = {
  data: Record<string, any>;
  fields: any[]; // Kept for compatibility but not used
  schemaType?: string;
};

export function GenericJSONPreview({ data, schemaType }: GenericJSONPreviewProps) {
  // Check for specialized schema types first
  if (schemaType === 'image_references' && data.images && Array.isArray(data.images)) {
    return <ImageReferencesPreview images={data.images} />;
  }

  if (schemaType === 'video_references' && data.videos && Array.isArray(data.videos)) {
    return <VideoReferencesPreview videos={data.videos} />;
  }

  if (schemaType === 'music_generation' && (data.instrumental_option || data.lyrical_option)) {
    return <MusicGenerationPreview data={data} />;
  }

  if (schemaType === 'therapeutic_scene_card' && data.scenes && Array.isArray(data.scenes)) {
    return <SceneCardPreview data={data} />;
  }

  if (schemaType === 'quote_extraction' && data.extracted_quotes && Array.isArray(data.extracted_quotes)) {
    return <QuoteExtractionPreview quotes={data.extracted_quotes} />;
  }

  // Fallback: render all data keys (filter out schemaType)
  const dataKeys = Object.keys(data).filter(key => key !== 'schemaType');

  if (dataKeys.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-500">
          No data available for preview.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schemaType && (
        <div className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
          {schemaType}
        </div>
      )}

      {dataKeys.map(key => {
        const value = data[key];

        return (
          <div key={key} className="space-y-1">
            <div className="text-xs font-medium text-gray-700">
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            <div className="text-sm text-gray-900">
              {renderValue(value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Render a value based on its type
 */
function renderValue(value: any): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">-</span>;
  }

  if (typeof value === 'boolean') {
    return <span className={value ? 'text-green-600' : 'text-red-600'}>{value ? 'Yes' : 'No'}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400">Empty array</span>;

    // Check if array of objects
    if (typeof value[0] === 'object' && value[0] !== null) {
      return (
        <div className="space-y-2">
          {value.map((item, i) => (
            <div key={i} className="rounded border border-gray-200 bg-gray-50 p-2 text-xs">
              <pre className="text-gray-700">{JSON.stringify(item, null, 2)}</pre>
            </div>
          ))}
        </div>
      );
    }

    // Array of primitives
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, i) => (
          <span key={i} className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    return (
      <div className="rounded border border-gray-200 bg-gray-50 p-2">
        <pre className="text-xs text-gray-700">{JSON.stringify(value, null, 2)}</pre>
      </div>
    );
  }

  // String, number, etc.
  return <span>{String(value)}</span>;
}

// ============================================================================
// Specialized Preview Renderers
// ============================================================================

/**
 * Preview renderer for image_references schema type
 * Matches the production rendering in JSONOutputRenderer
 */
function ImageReferencesPreview({ images }: { images: any[] }) {
  return (
    <div className="space-y-4">
      <div className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
        image_references
      </div>
      <p className="text-sm text-gray-600">
        {images.length} Image Suggestion{images.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-6">
        {images.map((img, index) => (
          <div
            key={index}
            className="border-l-4 border-gray-200 bg-white py-3 pl-4"
          >
            {/* Title */}
            <h3 className="mb-2 text-base font-semibold text-gray-900">{img.title}</h3>

            {/* Description (matches runtime) */}
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
                  "{img.source_quote}"
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

            {/* Generate Image Button (disabled in preview) */}
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600/50 px-4 py-2.5 text-sm font-semibold text-white cursor-not-allowed"
              title="Available after running prompt"
            >
              <Image className="h-4 w-4" />
              Generate Image: "{img.title}"
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 italic text-center">
        Buttons will be enabled after the prompt generates results
      </p>
    </div>
  );
}

/**
 * Preview renderer for video_references schema type
 */
function VideoReferencesPreview({ videos }: { videos: any[] }) {
  return (
    <div className="space-y-4">
      <div className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
        video_references
      </div>
      <p className="text-sm text-gray-600">
        {videos.length} Video Suggestion{videos.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-4">
        {videos.map((vid, index) => (
          <div
            key={index}
            className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <Film className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <h4 className="mb-2 text-sm font-medium text-gray-900">{vid.title}</h4>

                {vid.reference_image_prompt && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-500">Reference Image:</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{vid.reference_image_prompt}</p>
                  </div>
                )}

                {vid.prompt && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-500">Animation:</p>
                    <p className="text-xs text-gray-600">{vid.prompt}</p>
                  </div>
                )}

                {vid.duration && (
                  <span className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                    {vid.duration}s
                  </span>
                )}
              </div>
            </div>

            {/* Generate Video Button (disabled in preview) */}
            <button
              type="button"
              disabled
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600/50 px-4 py-2 text-sm font-semibold text-white cursor-not-allowed"
              title="Available after running prompt"
            >
              <Film className="h-4 w-4" />
              Generate Video
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 italic text-center">
        Buttons will be enabled after the prompt generates results
      </p>
    </div>
  );
}

/**
 * Preview renderer for music_generation schema type
 */
function MusicGenerationPreview({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
        music_generation
      </div>
      <p className="text-sm text-gray-600">2 Music Options (Instrumental & Lyrical)</p>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Instrumental Option */}
        {data.instrumental_option && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Music className="h-5 w-5 text-blue-600" />
              <h4 className="text-sm font-semibold text-blue-900">Instrumental</h4>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-2">
              {data.instrumental_option.title}
            </p>
            {data.instrumental_option.mood && (
              <p className="text-xs text-gray-600 mb-2">
                Mood: {data.instrumental_option.mood}
              </p>
            )}
            {data.instrumental_option.genre_tags && (
              <div className="flex flex-wrap gap-1 mb-3">
                {data.instrumental_option.genre_tags.map((tag: string, i: number) => (
                  <span key={i} className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600/50 px-3 py-2 text-xs font-semibold text-white cursor-not-allowed"
            >
              <Music className="h-3 w-3" />
              Generate Instrumental
            </button>
          </div>
        )}

        {/* Lyrical Option */}
        {data.lyrical_option && (
          <div className="rounded-lg border border-pink-200 bg-pink-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Music className="h-5 w-5 text-pink-600" />
              <h4 className="text-sm font-semibold text-pink-900">Lyrical</h4>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-2">
              {data.lyrical_option.title}
            </p>
            {data.lyrical_option.mood && (
              <p className="text-xs text-gray-600 mb-2">
                Mood: {data.lyrical_option.mood}
              </p>
            )}
            {data.lyrical_option.genre_tags && (
              <div className="flex flex-wrap gap-1 mb-3">
                {data.lyrical_option.genre_tags.map((tag: string, i: number) => (
                  <span key={i} className="rounded bg-pink-100 px-1.5 py-0.5 text-xs text-pink-700">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-600/50 px-3 py-2 text-xs font-semibold text-white cursor-not-allowed"
            >
              <Music className="h-3 w-3" />
              Generate Song
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 italic text-center">
        Buttons will be enabled after the prompt generates results
      </p>
    </div>
  );
}

/**
 * Preview renderer for therapeutic_scene_card schema type
 */
function SceneCardPreview({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
        therapeutic_scene_card
      </div>

      {data.title && (
        <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
      )}
      {data.subtitle && (
        <p className="text-sm text-gray-600">{data.subtitle}</p>
      )}

      <div className="space-y-4">
        {data.scenes.map((scene: any, index: number) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                {scene.sceneNumber || index + 1}
              </span>
              <span className="text-sm font-medium text-gray-700">Scene {scene.sceneNumber || index + 1}</span>
            </div>

            {scene.sections && (
              <div className="space-y-3">
                {scene.sections.patientQuote && (
                  <div className="border-l-4 border-purple-500 bg-purple-50 py-2 pl-3">
                    <p className="text-xs font-semibold text-purple-700 mb-1">
                      {scene.sections.patientQuote.label || 'Patient Quote'}
                    </p>
                    <p className="text-sm italic text-purple-900">
                      "{scene.sections.patientQuote.content}"
                    </p>
                  </div>
                )}

                {scene.sections.meaning && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      {scene.sections.meaning.label || 'Therapist Reflection'}
                    </p>
                    <p className="text-sm text-gray-700">
                      {scene.sections.meaning.content}
                    </p>
                  </div>
                )}

                {scene.sections.imagePrompt && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      {scene.sections.imagePrompt.label || 'Image Prompt'}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {scene.sections.imagePrompt.content}
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              disabled
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600/50 px-3 py-2 text-xs font-semibold text-white cursor-not-allowed"
            >
              <Film className="h-3 w-3" />
              Create Scene
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 italic text-center">
        Buttons will be enabled after the prompt generates results
      </p>
    </div>
  );
}

/**
 * Preview renderer for quote_extraction schema type
 */
function QuoteExtractionPreview({ quotes }: { quotes: any[] }) {
  return (
    <div className="space-y-4">
      <div className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
        quote_extraction
      </div>
      <p className="text-sm text-gray-600">
        {quotes.length} Extracted Quote{quotes.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-3">
        {quotes.map((quote, index) => (
          <div
            key={index}
            className="rounded-lg border border-amber-200 bg-amber-50 p-4"
          >
            <div className="flex items-start gap-3">
              <MessageSquareQuote className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 italic mb-2">
                  "{quote.quote_text}"
                </p>
                {quote.speaker && (
                  <p className="text-xs text-gray-600 mb-1">
                    — {quote.speaker}
                    {quote.patient_name && ` (${quote.patient_name})`}
                  </p>
                )}
                {quote.context && (
                  <p className="text-xs text-gray-500 mt-2">
                    {quote.context}
                  </p>
                )}
                {quote.tags && quote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {quote.tags.map((tag: string, i: number) => (
                      <span key={i} className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600/50 px-3 py-2 text-xs font-semibold text-white cursor-not-allowed"
            >
              <MessageSquareQuote className="h-3 w-3" />
              Save Quote
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 italic text-center">
        Buttons will be enabled after the prompt generates results
      </p>
    </div>
  );
}

