'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
    customMode: boolean;
    style?: string;
    lyrics?: string;
  }) => void;
  instrumentalOption?: MusicOption;
  lyricalOption?: MusicOption;
  hasAiSuggestions?: boolean;
  isLoadingSuggestions?: boolean;
};

// Helper to normalize lyrics that may be string or object
function normalizeLyrics(lyrics: string | object | undefined): string {
  if (!lyrics) return '';
  if (typeof lyrics === 'string') return lyrics;
  if (typeof lyrics === 'object') {
    return Object.entries(lyrics)
      .map(([key, value]) => `[${key.replace(/_/g, ' ')}]\n${value}`)
      .join('\n\n');
  }
  return String(lyrics);
}

export function MusicGenerationOptionsModal({
  isOpen,
  onClose,
  onGenerate,
  instrumentalOption,
  lyricalOption,
  hasAiSuggestions = false,
  isLoadingSuggestions = false,
}: MusicGenerationOptionsModalProps) {
  const [selectedOption, setSelectedOption] = useState<'instrumental' | 'lyrical'>('instrumental');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customDuration, setCustomDuration] = useState(120);
  const [editableLyrics, setEditableLyrics] = useState('');
  const [editableTitle, setEditableTitle] = useState('');

  // Prefill fields when modal opens or option changes
  useEffect(() => {
    if (!isOpen) return;

    const option = selectedOption === 'instrumental' ? instrumentalOption : lyricalOption;
    if (option?.style_prompt) {
      setCustomPrompt(option.style_prompt);
    } else if (option?.music_description) {
      setCustomPrompt(option.music_description);
    }

    // Initialize lyrics for lyrical option
    if (selectedOption === 'lyrical' && lyricalOption?.suggested_lyrics) {
      setEditableLyrics(normalizeLyrics(lyricalOption.suggested_lyrics));
    } else {
      setEditableLyrics('');
    }

    // Initialize title
    setEditableTitle(option?.title || '');
  }, [isOpen, selectedOption, instrumentalOption, lyricalOption]);

  const handleClose = () => {
    setCustomPrompt('');
    setCustomDuration(120);
    setEditableLyrics('');
    setEditableTitle('');
    onClose();
  };

  const handleGenerate = () => {
    const option = selectedOption === 'instrumental' ? instrumentalOption : lyricalOption;
    if (!option) return;

    const isLyrical = selectedOption === 'lyrical';
    const hasLyrics = isLyrical && editableLyrics.trim().length > 0;

    // Use customMode when we have explicit lyrics
    const useCustomMode = hasLyrics;

    // For customMode: prompt = lyrics, style = style description
    // For non-customMode: prompt = style description
    const finalPrompt = useCustomMode
      ? editableLyrics.trim()
      : (customPrompt.trim() || option.style_prompt || option.music_description || '');

    onGenerate({
      prompt: finalPrompt,
      title: editableTitle.trim() || option.title || 'Therapeutic Music',
      instrumental: !isLyrical,
      duration: customDuration,
      customMode: useCustomMode,
      style: useCustomMode ? customPrompt.trim() : undefined,
      lyrics: hasLyrics ? editableLyrics.trim() : undefined,
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
            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600">
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
            {option.genre_tags.map((genre, index) => (
              <span key={index} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Music description */}
        {type === 'instrumental' && option.music_description && (
          <p className="mb-3 line-clamp-3 text-xs text-gray-600">{option.music_description}</p>
        )}
        {/* Lyrics indicator for lyrical option */}
        {type === 'lyrical' && option.suggested_lyrics && (
          <div className="mb-3 rounded bg-gray-50 p-2">
            <p className="text-xs text-gray-500">
              <span className="font-medium text-purple-600">Lyrics available</span>
              {' '}
              - Edit below when selected
            </p>
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
      title={
        isLoadingSuggestions ? (
          <div className="flex items-center gap-2">
            <span>Generate Therapeutic Music</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading Suggestions...
            </span>
          </div>
        ) : hasAiSuggestions ? (
          <div className="flex items-center gap-2">
            <span>Generate Therapeutic Music</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              AI Suggested from Scenes
            </span>
          </div>
        ) : 'Generate Therapeutic Music'
      }
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
            Generate
            {' '}
            {selectedOption === 'instrumental' ? 'Instrumental' : 'Lyrical Song'}
          </Button>
        </>
      )}
    >
      {/* Options Selection */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {renderMusicOption('instrumental', instrumentalOption)}
        {renderMusicOption('lyrical', lyricalOption)}
      </div>

      {/* Custom Inputs Section */}
      <div className="space-y-4">
        {/* Title Input */}
        <div>
          <label htmlFor="editableTitle" className="mb-1.5 block text-sm font-medium text-gray-700">
            Title
            {' '}
            <span className="font-normal text-gray-400">(editable)</span>
          </label>
          <input
            type="text"
            id="editableTitle"
            value={editableTitle}
            onChange={e => setEditableTitle(e.target.value)}
            maxLength={100}
            placeholder="Enter song title..."
            className="focus:ring-opacity-20 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <div className="mt-1 text-right text-xs text-gray-400">
            {editableTitle.length}
            /100
          </div>
        </div>

        {/* Editable Lyrics - Only for lyrical mode */}
        {selectedOption === 'lyrical' && (
          <div>
            <label htmlFor="editableLyrics" className="mb-1.5 block text-sm font-medium text-gray-700">
              Lyrics
              {' '}
              <span className="font-normal text-gray-400">(editable)</span>
            </label>
            <textarea
              id="editableLyrics"
              value={editableLyrics}
              onChange={e => setEditableLyrics(e.target.value)}
              maxLength={5000}
              rows={6}
              placeholder="Enter or edit lyrics for the song..."
              className="focus:ring-opacity-20 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
              <span>These exact lyrics will be used in the generated song</span>
              <span className={editableLyrics.length > 4500 ? 'font-medium text-amber-600' : ''}>
                {editableLyrics.length}
                /5000
              </span>
            </div>
          </div>
        )}

        {/* Music Style / Custom Prompt */}
        <div>
          <label htmlFor="customPrompt" className="mb-1.5 block text-sm font-medium text-gray-700">
            Music Style
            {' '}
            <span className="font-normal text-gray-400">(editable)</span>
          </label>
          <textarea
            id="customPrompt"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Describe the music style, genre, instruments, tempo..."
            className="focus:ring-opacity-20 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
            <span>Style description for music generation</span>
            <span className={customPrompt.length > 900 ? 'font-medium text-amber-600' : ''}>
              {customPrompt.length}
              /1000
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
            className="focus:ring-opacity-20 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value={60}>1 minute (60 seconds)</option>
            <option value={120}>2 minutes (120 seconds)</option>
            <option value={180}>3 minutes (180 seconds)</option>
            <option value={240}>4 minutes (240 seconds)</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
