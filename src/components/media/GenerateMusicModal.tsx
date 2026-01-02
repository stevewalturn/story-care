'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { authenticatedPost } from '@/utils/AuthenticatedFetch';

type MusicOption = {
  title: string;
  genre_tags?: string[];
  mood?: string;
  music_description?: string;
  style_prompt?: string;
  suggested_lyrics?: string;
  source_quotes?: string[];
  rationale?: string;
};

type GenerateMusicModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
  patientId?: string;
  instrumentalOption?: MusicOption;
  lyricalOption?: MusicOption;
  user: any;
  onComplete?: () => void;
};

export function GenerateMusicModal({
  isOpen,
  onClose,
  sessionId,
  patientId,
  instrumentalOption,
  lyricalOption,
  user,
  onComplete,
}: GenerateMusicModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<{
    type: 'instrumental' | 'lyrical';
    title: string;
    status: string;
  } | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customDuration, setCustomDuration] = useState(120);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsGenerating(false);
    setError(null);
    setGenerationResult(null);
    setCustomPrompt('');
    setCustomDuration(120);
    onClose();
  };

  const handleGenerateMusic = async () => {
    // Simplified - determine option from props
    const option = instrumentalOption || lyricalOption;
    const isInstrumental = !!instrumentalOption;

    if (!option) return;

    // Validation: require either sessionId or patientId
    if (!sessionId && !patientId) {
      setError('Either sessionId or patientId is required to generate music');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationResult(null);

    try {
      // Build final prompt by combining base prompt with custom prompt
      const basePrompt = option.style_prompt || option.music_description;
      const finalPrompt = customPrompt.trim()
        ? `${basePrompt}\n\nAdditional details: ${customPrompt.trim()}`
        : basePrompt;

      // Start the music generation
      const response = await authenticatedPost('/api/ai/generate-music', user, {
        sessionId,
        patientId,
        instrumental: isInstrumental,
        prompt: finalPrompt,
        title: option.title,
        model: 'V4_5',
        duration: customDuration,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate music');
      }

      await response.json();

      // Close modal immediately and show success message
      setIsGenerating(false);
      toast.success('Music generation started! Check the Content Library in a few minutes.');
      handleClose();

      // Call onComplete callback to refresh the assets list
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      // Clear any polling interval on error
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsGenerating(false);
    }
  };

  const renderSelectedOption = () => {
    const option = instrumentalOption || lyricalOption;
    const type = instrumentalOption ? 'instrumental' : 'lyrical';

    if (!option) return null;

    return (
      <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
        {/* Type badge */}
        <div className="mb-3 inline-flex items-center gap-2">
          {type === 'instrumental' ? (
            <>
              <div className="rounded-full bg-purple-100 p-1.5">
                <svg className="h-3.5 w-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <span className="text-xs font-medium tracking-wider text-purple-700 uppercase">Instrumental</span>
            </>
          ) : (
            <>
              <div className="rounded-full bg-purple-100 p-1.5">
                <svg className="h-3.5 w-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="text-xs font-medium tracking-wider text-purple-700 uppercase">Lyrical</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{option.title}</h3>

        {/* Mood */}
        {option.mood && (
          <p className="mb-3 text-sm text-gray-600">{option.mood}</p>
        )}

        {/* Genre tags */}
        {option.genre_tags && option.genre_tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {option.genre_tags.map((genre: string, index: number) => (
              <span key={index} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Music description or lyrics preview */}
        {type === 'instrumental' && option.music_description && (
          <p className="mb-3 line-clamp-3 text-xs text-gray-600">{option.music_description}</p>
        )}
        {type === 'lyrical' && option.suggested_lyrics && (
          <div className="mb-3 rounded bg-white/60 p-2">
            <p className="line-clamp-4 text-xs whitespace-pre-wrap text-gray-600 italic">
              {typeof option.suggested_lyrics === 'string'
                ? option.suggested_lyrics
                : typeof option.suggested_lyrics === 'object'
                  ? Object.entries(option.suggested_lyrics)
                      .map(([key, value]) => `[${key.replace(/_/g, ' ')}]\n${value}`)
                      .join('\n\n')
                  : String(option.suggested_lyrics)}
            </p>
          </div>
        )}

        {/* Rationale */}
        {option.rationale && (
          <p className="text-xs text-gray-500">{option.rationale}</p>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title="Generate Therapeutic Music"
      footer={(
        <>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerateMusic}
            disabled={isGenerating || (!instrumentalOption && !lyricalOption)}
          >
            {isGenerating ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating & Waiting for Completion...
              </>
            ) : (
              <>
                Generate
                {instrumentalOption ? 'Instrumental' : 'Lyrical Song'}
              </>
            )}
          </Button>
        </>
      )}
    >
      {/* Selected Option Display */}
      <div className="mb-6">
        {renderSelectedOption()}
      </div>

      {/* Custom Inputs Section */}
      <div className="mb-6 space-y-4">
        {/* Custom Prompt */}
        <div>
          <label htmlFor="customPrompt" className="mb-1.5 block text-sm font-medium text-gray-700">
            Custom Music Prompt
            {' '}
            <span className="font-normal text-gray-400">(Optional)</span>
          </label>
          <textarea
            id="customPrompt"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            maxLength={500}
            rows={3}
            disabled={isGenerating}
            placeholder="Add specific details to enhance the generated music. Example: 'with gentle piano and warm strings, building gradually'"
            className="focus:ring-opacity-20 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
          />
          <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
            <span>Add specific instruments, mood, tempo, or style details</span>
            <span className={customPrompt.length > 450 ? 'font-medium text-amber-600' : ''}>
              {customPrompt.length}
              /500
            </span>
          </div>
        </div>

        {/* Duration Selector */}
        <div>
          <label htmlFor="duration" className="mb-1.5 block text-sm font-medium text-gray-700">
            Duration
          </label>
          <select
            id="duration"
            value={customDuration}
            onChange={e => setCustomDuration(Number(e.target.value))}
            disabled={isGenerating}
            className="focus:ring-opacity-20 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value={60}>1 minute (60 seconds)</option>
            <option value={120}>2 minutes (120 seconds)</option>
            <option value={180}>3 minutes (180 seconds)</option>
            <option value={240}>4 minutes (240 seconds)</option>
          </select>
        </div>
      </div>

      {/* Generation Result */}
      {generationResult && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">
                {generationResult.type === 'instrumental' ? 'Instrumental' : 'Lyrical song'}
                {' '}
                "
                {generationResult.title}
                " queued for generation
              </p>
              <p className="mt-0.5 text-xs text-green-700">
                Check the Library tab in 2-3 minutes to see your generated music
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Generation failed</p>
              <p className="mt-0.5 text-xs text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
