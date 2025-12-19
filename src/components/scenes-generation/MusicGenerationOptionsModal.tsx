'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

type MusicOption = {
  title: string;
  genre_tags?: string[];
  mood?: string;
  music_description?: string;
  style_prompt?: string;
  suggested_lyrics?: string;
  rationale?: string;
};

type MusicGenerationOptionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: {
    prompt: string;
    title: string;
    instrumental: boolean;
    duration: number;
  }) => void;
  instrumentalOption?: MusicOption;
  lyricalOption?: MusicOption;
};

export function MusicGenerationOptionsModal({
  isOpen,
  onClose,
  onGenerate,
  instrumentalOption,
  lyricalOption,
}: MusicGenerationOptionsModalProps) {
  const [selectedOption, setSelectedOption] = useState<'instrumental' | 'lyrical'>('instrumental');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customDuration, setCustomDuration] = useState(120);

  const handleClose = () => {
    setCustomPrompt('');
    setCustomDuration(120);
    onClose();
  };

  const handleGenerate = () => {
    const option = selectedOption === 'instrumental' ? instrumentalOption : lyricalOption;
    if (!option) return;

    // Build final prompt
    const basePrompt = option.style_prompt || option.music_description || '';
    const finalPrompt = customPrompt.trim()
      ? `${basePrompt}\n\nAdditional details: ${customPrompt.trim()}`
      : basePrompt;

    onGenerate({
      prompt: finalPrompt,
      title: option.title || 'Therapeutic Music',
      instrumental: selectedOption === 'instrumental',
      duration: customDuration,
    });

    handleClose();
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
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={!instrumentalOption && !lyricalOption}
          >
            Generate {selectedOption === 'instrumental' ? 'Instrumental' : 'Lyrical Song'}
          </Button>
        </>
      )}
    >
      {/* Custom Inputs Section */}
      <div className="mb-6 space-y-4">
        {/* Custom Prompt */}
        <div>
          <label htmlFor="customPrompt" className="mb-1.5 block text-sm font-medium text-gray-700">
            Custom Music Prompt <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            id="customPrompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Add specific details to enhance the generated music. Example: 'with gentle piano and warm strings, building gradually'"
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20"
          />
          <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
            <span>Add specific instruments, mood, tempo, or style details</span>
            <span className={customPrompt.length > 450 ? 'text-amber-600 font-medium' : ''}>
              {customPrompt.length}/500
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
            onChange={(e) => setCustomDuration(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20"
          >
            <option value={60}>1 minute (60 seconds)</option>
            <option value={120}>2 minutes (120 seconds)</option>
            <option value={180}>3 minutes (180 seconds)</option>
            <option value={240}>4 minutes (240 seconds)</option>
          </select>
        </div>
      </div>

      {/* Options */}
      <div className="grid gap-4 md:grid-cols-2">
        {renderMusicOption('instrumental', instrumentalOption)}
        {renderMusicOption('lyrical', lyricalOption)}
      </div>
    </Modal>
  );
}
