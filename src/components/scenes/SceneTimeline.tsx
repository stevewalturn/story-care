'use client';

import { Image as ImageIcon, Pause, Play, Plus, Trash2, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

type Clip = {
  id: string;
  type: 'video' | 'image';
  mediaId: string;
  title: string;
  thumbnailUrl: string;
  startTime: number; // Position in timeline (seconds)
  duration: number; // Duration in seconds
  audioTrack?: string; // Optional audio overlay
};

type SceneTimelineProps = {
  clips: Clip[];
  totalDuration: number;
  onClipsChange: (clips: Clip[]) => void;
  onAddClip: () => void;
};

export function SceneTimeline({
  clips,
  totalDuration,
  onClipsChange,
  onAddClip,
}: SceneTimelineProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [_draggingClipId, _setDraggingClipId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Handle playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) {
      return;
    }
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setCurrentTime(percentage * totalDuration);
  };

  const handleDeleteClip = (clipId: string) => {
    const updatedClips = clips.filter(c => c.id !== clipId);
    onClipsChange(updatedClips);
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const getClipPosition = (clip: Clip) => {
    const left = (clip.startTime / totalDuration) * 100;
    const width = (clip.duration / totalDuration) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  const selectedClip = clips.find(c => c.id === selectedClipId);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Controls */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-4">
          <Button variant="icon" onClick={togglePlayPause}>
            {isPlaying
              ? (
                  <Pause className="h-5 w-5" />
                )
              : (
                  <Play className="h-5 w-5" />
                )}
          </Button>
          <div className="flex-1">
            <div className="font-mono text-sm text-gray-700">
              {formatTime(currentTime)}
              {' '}
              /
              {formatTime(totalDuration)}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onAddClip}>
            <Plus className="mr-2 h-4 w-4" />
            Add Clip
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4">
        {/* Time markers */}
        <div className="mb-2 flex justify-between px-2 text-xs text-gray-500">
          {Array.from({ length: 11 }).map((_, i) => {
            const time = (totalDuration / 10) * i;
            return (
              <span key={i} className="font-mono">
                {formatTime(time)}
              </span>
            );
          })}
        </div>

        {/* Timeline track */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          className="relative h-24 cursor-pointer rounded bg-gray-100"
        >
          {/* Clips */}
          {clips.map((clip) => {
            const position = getClipPosition(clip);
            const isSelected = selectedClipId === clip.id;

            return (
              <div
                key={clip.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedClipId(clip.id);
                }}
                style={position}
                className={`absolute top-1 h-[calc(100%-8px)] overflow-hidden rounded border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-500 shadow-lg'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative h-full w-full">
                  <img
                    src={clip.thumbnailUrl}
                    alt={clip.title}
                    className="h-full w-full object-cover"
                  />
                  {/* Type badge */}
                  <div className="absolute top-1 left-1">
                    {clip.type === 'image'
                      ? (
                          <ImageIcon className="h-3 w-3 text-white drop-shadow" />
                        )
                      : (
                          <Play className="h-3 w-3 text-white drop-shadow" />
                        )}
                  </div>
                  {/* Audio indicator */}
                  {clip.audioTrack && (
                    <div className="absolute top-1 right-1">
                      <Volume2 className="h-3 w-3 text-white drop-shadow" />
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Title */}
                  <div className="absolute right-1 bottom-1 left-1">
                    <p className="truncate text-[10px] font-medium text-white drop-shadow">
                      {clip.title}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Playhead */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-red-500"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
          >
            <div className="h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500" />
          </div>

          {/* Empty state */}
          {clips.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="mb-2 text-sm text-gray-500">No clips added yet</p>
                <Button variant="secondary" size="sm" onClick={onAddClip}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Clip
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clip Details */}
      {selectedClip && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">{selectedClip.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClip(selectedClip.id)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Start Time</p>
              <p className="font-mono text-gray-900">
                {formatTime(selectedClip.startTime)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Duration</p>
              <p className="font-mono text-gray-900">
                {formatTime(selectedClip.duration)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Type</p>
              <p className="text-gray-900 capitalize">{selectedClip.type}</p>
            </div>
          </div>
          {selectedClip.audioTrack && (
            <div className="mt-3 border-t border-gray-200 pt-3">
              <p className="mb-1 text-sm text-gray-600">Audio Track</p>
              <p className="text-sm text-gray-900">{selectedClip.audioTrack}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
