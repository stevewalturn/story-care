'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';

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
  sessionId: string;
  instrumentalOption?: MusicOption;
  lyricalOption?: MusicOption;
  user: any;
};

export function GenerateMusicModal({
  isOpen,
  onClose,
  sessionId,
  instrumentalOption,
  lyricalOption,
  user,
}: GenerateMusicModalProps) {
  const [selectedOption, setSelectedOption] = useState<'instrumental' | 'lyrical'>('instrumental');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<{
    type: 'instrumental' | 'lyrical';
    title: string;
    status: string;
  } | null>(null);
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
    onClose();
  };

  const handleGenerateMusic = async () => {
    const option = selectedOption === 'instrumental' ? instrumentalOption : lyricalOption;
    if (!option) return;

    setIsGenerating(true);
    setError(null);
    setGenerationResult(null);

    try {
      // Start the music generation
      const response = await authenticatedPost('/api/ai/generate-music', user, {
        sessionId,
        instrumental: selectedOption === 'instrumental',
        prompt: option.style_prompt || option.music_description,
        title: option.title,
        model: 'V4_5',
        duration: 120,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate music');
      }

      const data = await response.json();
      const taskId = data.taskId;

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 36; // 3 minutes max
      
      pollIntervalRef.current = setInterval(async () => {
        attempts++;

        try {
          const statusResponse = await authenticatedFetch(`/api/ai/music-task/${taskId}`, user);
          
          if (!statusResponse.ok) {
            throw new Error('Failed to check music generation status');
          }

          const statusData = await statusResponse.json();

          if (statusData.data.status === 'completed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setIsGenerating(false);
            setGenerationResult({
              type: selectedOption,
              title: option.title,
              status: 'success',
            });

            // Auto-close after 2 seconds on success
            setTimeout(() => {
              handleClose();
            }, 2000);
          } else if (statusData.data.status === 'failed' || attempts >= maxAttempts) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            throw new Error('Music generation failed or timed out');
          }
          // Continue polling if still processing
        } catch (pollError) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          throw pollError;
        }
      }, 5000); // Poll every 5 seconds

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

  const renderMusicOption = (type: 'instrumental' | 'lyrical', option: MusicOption | undefined) => {
    if (!option) return null;

    const isSelected = selectedOption === type;
    
    return (
      <button
        onClick={() => setSelectedOption(type)}
        className={`relative overflow-hidden rounded-lg border-2 p-4 text-left transition-all ${
          isSelected
            ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
        disabled={isGenerating}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
              <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}

        {/* Type badge */}
        <div className="mb-3 inline-flex items-center gap-2">
          {type === 'instrumental' ? (
            <>
              <div className="rounded-full bg-purple-100 p-1.5">
                <svg className="h-3.5 w-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-purple-700">Instrumental</span>
            </>
          ) : (
            <>
              <div className="rounded-full bg-indigo-100 p-1.5">
                <svg className="h-3.5 w-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-indigo-700">Lyrical</span>
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
            {option.genre_tags.map((genre, index) => (
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
          <div className="mb-3 rounded bg-gray-50 p-2">
            <p className="line-clamp-4 text-xs text-gray-600 italic">{option.suggested_lyrics}</p>
          </div>
        )}

        {/* Rationale */}
        {option.rationale && (
          <p className="text-xs text-gray-500">{option.rationale}</p>
        )}
      </button>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Generate Therapeutic Music</h2>
        <button
          onClick={handleClose}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6">
        {/* Options */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {renderMusicOption('instrumental', instrumentalOption)}
          {renderMusicOption('lyrical', lyricalOption)}
        </div>

        {/* Generation Result */}
        {generationResult && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">
                  {generationResult.type === 'instrumental' ? 'Instrumental' : 'Lyrical song'} "{generationResult.title}" queued for generation
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
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
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
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
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
            <>Generate {selectedOption === 'instrumental' ? 'Instrumental' : 'Lyrical Song'}</>
          )}
        </Button>
      </div>
    </Modal>
  );
}