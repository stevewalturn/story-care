'use client';

import { Download, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type AudioPlayerProps = {
  audioUrl?: string;
  duration?: string;
  currentTime?: string;
};

// Generate waveform heights at module level for visual consistency
// Uses deterministic values based on index
const WAVEFORM_HEIGHTS = Array.from({ length: 80 }).map((_, i) => {
  const seed = (i * 7919) % 100;
  return 20 + (seed * 0.6);
});

export function AudioPlayer({ duration = '01:02', currentTime = '00:30' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    if (nextSpeed !== undefined) {
      setSpeed(nextSpeed);
    }
  };

  return (
    <div className="space-y-3">
      {/* Waveform */}
      <div className="flex h-20 items-center gap-px rounded-lg bg-gray-50 px-4">
        {WAVEFORM_HEIGHTS.map((height, i) => {
          const isActive = i < 40; // First half is "played"
          return (
            <div
              key={`waveform-${i}`}
              className={`w-1 ${isActive ? 'bg-purple-600' : 'bg-gray-300'}`}
              style={{
                height: `${height}%`,
              }}
            />
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <Button
            variant="primary"
            size="sm"
            onClick={togglePlay}
            className="size-10 rounded-full p-0"
          >
            {isPlaying ? (
              <Pause className="size-5" fill="currentColor" />
            ) : (
              <Play className="size-5" fill="currentColor" />
            )}
          </Button>

          {/* Skip Back 10s */}
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <SkipBack className="size-4" />
            10
          </Button>

          {/* Skip Forward 10s */}
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            10
            <SkipForward className="size-4" />
          </Button>

          {/* Speed Control */}
          <Button variant="ghost" size="sm" onClick={cycleSpeed} className="text-xs font-medium">
            {speed}
            x
          </Button>
        </div>

        {/* Time & Download */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {currentTime}
            {' '}
            /
            {duration}
          </span>
          <Button variant="ghost" size="sm">
            <Download className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
