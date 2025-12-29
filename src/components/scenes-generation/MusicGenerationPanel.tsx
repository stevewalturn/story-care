'use client';

import { Download, Library, Music, Pause, Play, Settings, SkipBack, SkipForward, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

type MusicGenerationPanelProps = {
  audioUrl?: string;
  waveformData?: number[];
  duration?: number;
  isGenerating?: boolean;
  generationProgress?: number; // 0-100
  generationStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  musicPrompt?: string;
  onGenerate: (prompt: string) => void;
  onChooseFromLibrary: () => void;
  onRegenerate?: () => void;
  onDownload?: () => void;
  onRemove?: () => void;
  onOptimizePrompt?: () => void;
  onPromptChange?: (prompt: string) => void;
};

export function MusicGenerationPanel({
  audioUrl,
  waveformData,
  duration = 0,
  isGenerating = false,
  generationProgress = 0,
  generationStatus = 'pending',
  musicPrompt = '',
  onGenerate,
  onChooseFromLibrary,
  onRegenerate,
  onDownload,
  onOptimizePrompt,
  onPromptChange,
}: MusicGenerationPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [localPrompt, setLocalPrompt] = useState(musicPrompt);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync local prompt with prop
  useEffect(() => {
    setLocalPrompt(musicPrompt);
  }, [musicPrompt]);

  // Audio playback control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || !waveformData || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveformData.length;
    const centerY = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform bars
    waveformData.forEach((value, index) => {
      const barHeight = value * height * 0.8;
      const x = index * barWidth;
      const y = centerY - barHeight / 2;

      // Gradient for bars
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#c4b5fd'); // Purple-300
      gradient.addColorStop(1, '#a78bfa'); // Purple-400

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
    });

    // Draw progress overlay
    if (duration > 0 && currentTime > 0) {
      const progressWidth = (currentTime / duration) * width;
      ctx.fillStyle = 'rgba(139, 92, 246, 0.3)'; // Purple with opacity
      ctx.fillRect(0, 0, progressWidth, height);
    }
  }, [waveformData, currentTime, duration]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
  };

  const toggleSpeed = () => {
    const newSpeed = playbackSpeed === 1 ? 2 : 1;
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerateClick = () => {
    const prompt = localPrompt || 'Calm, therapeutic background music with gentle piano and ambient sounds';
    onGenerate(prompt);
  };

  const handlePromptChangeLocal = (value: string) => {
    setLocalPrompt(value);
    onPromptChange?.(value);
  };

  // Empty State - No music yet
  if (!audioUrl && !isGenerating) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <Music className="h-5 w-5 text-purple-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Generate Music Background
          </h3>
        </div>

        {/* Empty State */}
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <Music className="h-8 w-8 text-purple-600" />
          </div>
          <p className="mb-6 text-sm text-gray-600">
            Add background music to enhance your therapeutic scene
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={handleGenerateClick}
              variant="primary"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Music
            </Button>
            <Button
              onClick={onChooseFromLibrary}
              variant="secondary"
            >
              <Library className="mr-2 h-4 w-4" />
              Choose from Library
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Music className="h-5 w-5 text-purple-600" />
        <h3 className="text-base font-semibold text-gray-900">
          Generate Music Background
        </h3>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Left Column - Waveform and Controls (60%) */}
        <div className="flex-[3]">
          {/* Waveform Visualization */}
          <div className="relative mb-4 overflow-hidden rounded-lg bg-gray-50">
            {/* Hidden audio element */}
            {audioUrl && <audio ref={audioRef} src={audioUrl} />}

            {/* Waveform Canvas */}
            <canvas
              ref={canvasRef}
              width={800}
              height={100}
              className="w-full"
              style={{ height: '100px' }}
            />

            {/* Generating overlay */}
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/95 backdrop-blur-sm">
                <div className="w-64 text-center">
                  {/* Icon */}
                  <div className="mb-3 inline-flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-purple-100">
                    <Sparkles className="h-5 w-5 text-purple-600" fill="currentColor" />
                  </div>

                  {/* Status Text */}
                  <p className="mb-3 text-sm font-medium text-gray-900">
                    {generationStatus === 'pending' && 'Preparing music generation...'}
                    {generationStatus === 'processing' && 'Generating Music'}
                    {generationStatus === 'completed' && 'Music Ready!'}
                    {generationStatus === 'failed' && 'Generation Failed'}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                      <span>Progress</span>
                      <span className="font-medium">
                        {generationProgress}
                        %
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-purple-600 transition-all duration-500"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Helper Text */}
                  {generationStatus === 'processing' && (
                    <p className="text-xs text-gray-500">
                      This may take 1-2 minutes...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-3">
            {/* Rewind Button */}
            <button
              onClick={skipBackward}
              disabled={!audioUrl || isGenerating}
              className="text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              disabled={!audioUrl || isGenerating}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="ml-0.5 h-5 w-5" />
              )}
            </button>

            {/* Forward Button */}
            <button
              onClick={skipForward}
              disabled={!audioUrl || isGenerating}
              className="text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
            >
              <SkipForward className="h-5 w-5" />
            </button>

            {/* Speed Toggle */}
            <button
              onClick={toggleSpeed}
              disabled={!audioUrl || isGenerating}
              className="min-w-[40px] text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 disabled:opacity-50"
            >
              {playbackSpeed}
              x
            </button>

            {/* Time Display */}
            <div className="flex-1 text-center">
              <span className="font-mono text-sm text-gray-700">
                {formatTime(currentTime)}
                {' '}
                /
                {formatTime(duration || 210)}
              </span>
            </div>

            {/* Download Button */}
            {onDownload && audioUrl && (
              <button
                onClick={onDownload}
                disabled={isGenerating}
                className="text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
              >
                <Download className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Prompt Section (40%) */}
        <div className="flex-[2] border-l border-gray-200 pl-6">
          {/* Prompt Header */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Prompt</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onOptimizePrompt}
                className="flex items-center gap-1 text-sm font-medium text-purple-600 transition-colors hover:text-purple-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Optimize
              </button>
              <button className="text-gray-400 transition-colors hover:text-gray-600">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Prompt Textarea */}
          <textarea
            value={localPrompt}
            onChange={e => handlePromptChangeLocal(e.target.value)}
            placeholder="Describe the music style, mood, instruments..."
            disabled={isGenerating}
            className="mb-4 min-h-[80px] w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none disabled:bg-gray-50 disabled:opacity-50"
          />

          {/* Regenerate Music Button */}
          <button
            onClick={onRegenerate || handleGenerateClick}
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Music className="h-4 w-4" />
            Regenerate music
          </button>
        </div>
      </div>
    </div>
  );
}
