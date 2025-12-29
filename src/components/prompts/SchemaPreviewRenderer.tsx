'use client';

/**
 * Schema Preview Renderer
 * Renders realistic preview of JSON output with actual UI styling
 * Matches the JSONOutputRenderer appearance exactly
 */

import { ChevronDown, FileText, Film, HelpCircle, Image as ImageIcon, Mic, Music, PlusCircle, Quote, Save } from 'lucide-react';

type SchemaPreviewRendererProps = {
  data: any;
};

export function SchemaPreviewRenderer({ data }: SchemaPreviewRendererProps) {
  const { schemaType } = data;

  // Get schema display name
  const getDisplayName = (type: string) => {
    const names: Record<string, string> = {
      therapeutic_note: 'Therapeutic Note',
      image_references: 'Image References',
      video_references: 'Video References',
      music_generation: 'Music Generation',
      scene_card: 'Scene Card',
      scene_suggestions: 'Scene Suggestions',
      reflection_questions: 'Reflection Questions',
      quote_extraction: 'Quote Extraction',
    };
    return names[type] || type;
  };

  // Get schema description
  const getDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      therapeutic_note: 'Structured clinical note',
      image_references: 'AI-generated image suggestions',
      video_references: 'AI-generated video suggestions',
      music_generation: 'AI-generated music options',
      scene_card: 'Complete narrative scene',
      scene_suggestions: 'Scene ideas by participant',
      reflection_questions: 'Therapeutic reflection prompts',
      quote_extraction: 'Meaningful quotes from transcript',
    };
    return descriptions[type] || '';
  };

  // Get action buttons for schema type
  const getActionButtons = (type: string) => {
    switch (type) {
      case 'therapeutic_note':
        return [{ icon: <Save className="h-4 w-4" />, label: 'Save Note', color: 'indigo' }];
      case 'scene_card':
        return [
          { icon: <Film className="h-4 w-4" />, label: 'Create Scene', color: 'indigo' },
          { icon: <ImageIcon className="h-4 w-4" />, label: 'Generate Reference Images', color: 'indigo' },
          { icon: <Music className="h-4 w-4" />, label: 'Generate Music', color: 'indigo' },
          { icon: <HelpCircle className="h-4 w-4" />, label: 'Save Reflection Questions', color: 'indigo' },
        ];
      case 'music_generation':
        return [
          { icon: <Music className="h-4 w-4" />, label: 'Generate Instrumental', color: 'indigo' },
          { icon: <Mic className="h-4 w-4" />, label: 'Generate Lyrical Song', color: 'indigo' },
        ];
      case 'scene_suggestions':
        return [
          { icon: <Film className="h-4 w-4" />, label: 'Create All Scenes', color: 'indigo' },
          { icon: <FileText className="h-4 w-4" />, label: 'Save as Notes', color: 'indigo' },
        ];
      case 'reflection_questions':
        return [
          { icon: <PlusCircle className="h-4 w-4" />, label: 'Add to Module', color: 'indigo' },
          { icon: <FileText className="h-4 w-4" />, label: 'Save as Note', color: 'indigo' },
        ];
      case 'quote_extraction':
        return [{ icon: <Quote className="h-4 w-4" />, label: 'Save All Quotes', color: 'indigo' }];
      default:
        return [];
    }
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
            <h4 className="text-sm font-semibold text-purple-900">{getDisplayName(schemaType)}</h4>
            <p className="text-xs text-purple-700">{getDescription(schemaType)}</p>
          </div>
        </div>

        <button
          className="cursor-not-allowed text-purple-600 opacity-50"
          disabled
          aria-label="Expand (disabled in preview)"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      {/* Preview / Summary */}
      <div className="mb-3 rounded-lg bg-white/80 p-3">{renderPreview(schemaType, data)}</div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {schemaType === 'image_references' && data.images ? (
          // For image_references, render one button per image
          data.images.map((img: any, index: number) => (
            <button
              key={`generate-image-${index}`}
              disabled
              className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-purple-300 bg-white px-4 py-2 text-sm font-medium text-purple-700 opacity-60"
            >
              <ImageIcon className="h-4 w-4" />
              Generate "
              {img.title}
              "
            </button>
          ))
        ) : schemaType === 'video_references' && data.videos ? (
          // For video_references, render one button per video
          data.videos.map((vid: any, index: number) => (
            <button
              key={`generate-video-${index}`}
              disabled
              className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-purple-300 bg-white px-4 py-2 text-sm font-medium text-purple-700 opacity-60"
            >
              <Film className="h-4 w-4" />
              Generate "
              {vid.title}
              "
            </button>
          ))
        ) : (
          // For other schemas, render standard action buttons
          getActionButtons(schemaType).map((action, index) => (
            <button
              key={`action-${index}`}
              disabled
              className={`
                flex cursor-not-allowed items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium opacity-60
                ${action.color === 'indigo' ? 'border border-purple-300 bg-white text-purple-700' : ''}
                ${action.color === 'purple' ? 'border border-purple-300 bg-white text-purple-700' : ''}
              `}
            >
              {action.icon}
              {action.label}
            </button>
          ))
        )}
      </div>

      {/* Preview Mode Notice */}
      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-2">
        <p className="text-xs text-blue-700">
          📘 Preview Mode: Buttons are disabled. In the transcript viewer, these will trigger actions like generating images, saving notes, etc.
        </p>
      </div>
    </div>
  );
}

// Helper: Render preview based on schema type
function renderPreview(schemaType: string, data: any) {
  switch (schemaType) {
    case 'therapeutic_note':
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">{data.title}</p>
          <p className="line-clamp-3 text-xs text-gray-600">{data.content}</p>
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
              <div className="flex-shrink-0 rounded-lg bg-purple-100 px-3 py-1.5">
                <p className="text-xs font-medium text-purple-700">
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

    case 'music_generation':
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">Music Options:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-purple-50 p-2">
              <p className="font-semibold text-purple-900">Instrumental</p>
              <p className="text-purple-700">{data.instrumental_option?.title}</p>
              <p className="mt-1 text-xs text-purple-600">{data.instrumental_option?.mood}</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-2">
              <p className="font-semibold text-purple-900">Lyrical</p>
              <p className="text-purple-700">{data.lyrical_option?.title}</p>
              <p className="mt-1 text-xs text-purple-600">{data.lyrical_option?.mood}</p>
            </div>
          </div>
        </div>
      );

    case 'scene_card':
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">Scene Card Preview:</p>
          <ul className="space-y-1 text-xs text-gray-700">
            <li>
              •
              {' '}
              {data.reference_images?.length || 0}
              {' '}
              reference images
            </li>
            <li>
              •
              {' '}
              {data.patient_reflection_questions?.length || 0}
              {' '}
              patient questions
            </li>
            {data.group_reflection_questions?.length > 0 && (
              <li>
                •
                {' '}
                {data.group_reflection_questions.length}
                {' '}
                group questions
              </li>
            )}
            <li>
              • Music:
              {' '}
              {data.music?.duration_seconds || 0}
              s
            </li>
            <li>
              •
              {' '}
              {data.assembly_steps?.length || 0}
              {' '}
              assembly steps
            </li>
          </ul>
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

    case 'reflection_questions':
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">Reflection Questions:</p>
          <ul className="space-y-1 text-xs text-gray-700">
            {data.questions && (
              <li>
                •
                {' '}
                {data.questions.length}
                {' '}
                questions
              </li>
            )}
            {data.patient_questions && (
              <li>
                •
                {' '}
                {data.patient_questions.length}
                {' '}
                patient questions
              </li>
            )}
            {data.group_questions && (
              <li>
                •
                {' '}
                {data.group_questions.length}
                {' '}
                group questions
              </li>
            )}
          </ul>
        </div>
      );

    case 'quote_extraction': {
      const quotes = data.extracted_quotes || [];
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">Extracted Quotes:</p>
          <ul className="space-y-1 text-xs text-gray-700">
            {quotes.slice(0, 3).map((quote: any, i: number) => (
              <li key={i} className="line-clamp-2">
                "
                {quote.quote_text}
                "
              </li>
            ))}
            {quotes.length > 3 && (
              <li className="text-gray-500">
                ...and
                {' '}
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
