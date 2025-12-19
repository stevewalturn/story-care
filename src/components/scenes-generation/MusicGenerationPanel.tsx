'use client';

import { Download, Library, Music, Pause, Play, RotateCcw, SkipBack, SkipForward, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface MusicGenerationPanelProps {
  audioUrl?: string;
  waveformData?: number[];
  duration?: number;
  isGenerating?: boolean;
  generationProgress?: number; // 0-100
  generationStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  onGenerate: (prompt: string) => void;
  onChooseFromLibrary: () => void;
  onRegenerate?: () => void;
  onDownload?: () => void;
  onRemove?: () => void;
}

export function MusicGenerationPanel({
  audioUrl,
  waveformData,
  duration = 0,
  isGenerating = false,
  generationProgress = 0,
  generationStatus = 'pending',
  onGenerate,
  onChooseFromLibrary,
  onRegenerate,
  onDownload,
  onRemove,
}: MusicGenerationPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      gradient.addColorStop(0, '#818cf8'); // Indigo-400
      gradient.addColorStop(1, '#6366f1'); // Indigo-500

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
    });

    // Draw progress overlay
    if (duration > 0 && currentTime > 0) {
      const progressWidth = (currentTime / duration) * width;
      ctx.fillStyle = 'rgba(99, 102, 241, 0.3)'; // Indigo with opacity
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
    // Default prompt for therapeutic music
    const defaultPrompt = 'Calm, therapeutic background music with gentle piano and ambient sounds';
    onGenerate(defaultPrompt);
  };

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-indigo-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Generate Music Background
          </h3>
        </div>
        {audioUrl && !isGenerating && (
          <div className="flex items-center gap-2">
            {onDownload && (
              <Button
                onClick={onDownload}
                variant="ghost"
                size="sm"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onRemove && (
              <Button
                onClick={onRemove}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isGenerating ? (
        // Generating State with Progress
        <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <Music className="h-5 w-5 animate-pulse text-indigo-600" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">
                Generating Music
              </h4>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                    generationStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {generationStatus === 'pending' ? '⏳ Pending' : '🎵 Processing'}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">
                  {generationProgress < 20 && 'Preparing...'}
                  {generationProgress >= 20 && generationProgress < 60 && 'Generating audio...'}
                  {generationProgress >= 60 && 'Finalizing...'}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-gray-600">Estimated time: 30-60 seconds</span>
              <span className="font-medium text-indigo-600">{generationProgress}%</span>
            </div>
          </div>
        </div>
      ) : audioUrl ? (
        // Music Player
        <div>
          {/* Hidden audio element */}
          <audio ref={audioRef} src={audioUrl} />

          {/* Waveform Visualization */}
          <div className="mb-4 overflow-hidden rounded-lg bg-gray-50 p-4">
            <canvas
              ref={canvasRef}
              width={800}
              height={80}
              className="w-full"
              style={{ height: '80px' }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Playback Controls */}
            <Button
              onClick={skipBackward}
              variant="ghost"
              size="sm"
              disabled={!audioUrl}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              onClick={togglePlayPause}
              variant="primary"
              size="sm"
              className="h-10 w-10 rounded-full p-0"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="ml-0.5 h-5 w-5" />
              )}
            </Button>

            <Button
              onClick={skipForward}
              variant="ghost"
              size="sm"
              disabled={!audioUrl}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            {/* Speed Toggle */}
            <Button
              onClick={toggleSpeed}
              variant="ghost"
              size="sm"
              className="min-w-[60px]"
            >
              {playbackSpeed === 2 ? (
                <span className="text-xs font-semibold">2x</span>
              ) : (
                <span className="text-xs font-semibold">1x</span>
              )}
            </Button>

            {/* Time Display */}
            <div className="flex-1 text-center">
              <span className="font-mono text-sm text-gray-700">
                {formatTime(currentTime)}
                {' '}
                /
                {' '}
                {formatTime(duration)}
              </span>
            </div>

            {/* Regenerate Button */}
            {onRegenerate && (
              <Button
                onClick={onRegenerate}
                variant="secondary"
                size="sm"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Regenerate music
              </Button>
            )}
          </div>
        </div>
      ) : (
        // Empty State
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <Music className="h-8 w-8 text-indigo-600" />
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
      )}
    </div>
  );
}
