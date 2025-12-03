'use client';

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,

  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Image as ImageIcon, Music, Pause, Play, Plus, Trash2, Video, Volume2 } from 'lucide-react';
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

type AudioTrack = {
  id: string;
  audioId: string;
  audioUrl: string;
  title: string;
  startTime: number;
  duration: number;
};

type SceneTimelineProps = {
  clips: Clip[];
  audioTracks?: AudioTrack[];
  totalDuration: number;
  onClipsChange: (clips: Clip[]) => void;
  onAudioTracksChange?: (tracks: AudioTrack[]) => void;
  onAddClip: () => void;
};

// Sortable clip item component
function SortableClipItem({
  clip,
  isSelected,
  onClick,
  onDelete,
  formatTime,
}: {
  clip: Clip;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  formatTime: (seconds: number) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clip.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>

      <div className="h-16 w-28 flex-shrink-0 overflow-hidden rounded bg-gradient-to-br from-gray-100 to-gray-200">
        {clip.type === 'video'
          ? (
              <div className="flex h-full w-full items-center justify-center">
                <Video className="h-8 w-8 text-gray-400" />
              </div>
            )
          : (
              <img src={clip.thumbnailUrl} alt={clip.title} className="h-full w-full object-cover" />
            )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate font-medium text-gray-900">{clip.title}</h4>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            {clip.type === 'image' ? (
              <ImageIcon className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {clip.type}
          </span>
          <span className="font-mono">{formatTime(clip.duration)}</span>
          {clip.audioTrack && (
            <span className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              Audio
            </span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

export function SceneTimeline({
  clips,
  audioTracks = [],
  totalDuration,
  onClipsChange,
  onAudioTracksChange,
  onAddClip,
}: SceneTimelineProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

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
    // Recalculate start times after deletion
    let currentStartTime = 0;
    const recalculatedClips = updatedClips.map((clip) => {
      const updatedClip = { ...clip, startTime: currentStartTime };
      currentStartTime += clip.duration;
      return updatedClip;
    });
    onClipsChange(recalculatedClips);
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
  };

  const handleDeleteAudio = (audioId: string) => {
    if (!onAudioTracksChange) return;
    const updatedAudio = audioTracks.filter(a => a.id !== audioId);
    onAudioTracksChange(updatedAudio);
    if (selectedAudioId === audioId) {
      setSelectedAudioId(null);
    }
  };

  const handleDragStart = (_event: DragStartEvent) => {
    // Can add visual feedback here if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = clips.findIndex(clip => clip.id === active.id);
    const newIndex = clips.findIndex(clip => clip.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder clips array
    const reorderedClips = [...clips];
    const [movedClip] = reorderedClips.splice(oldIndex, 1);
    if (movedClip) {
      reorderedClips.splice(newIndex, 0, movedClip);
    }

    // Recalculate start times based on new order
    let currentStartTime = 0;
    const updatedClips = reorderedClips.map((clip) => {
      const updatedClip = { ...clip, startTime: currentStartTime };
      currentStartTime += clip.duration;
      return updatedClip;
    });

    onClipsChange(updatedClips);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleAudioPlayPause = (trackId: string, _audioUrl: string) => {
    const audioElement = audioRefs.current.get(trackId);

    if (playingAudioId === trackId && audioElement) {
      // Pause currently playing audio
      audioElement.pause();
      setPlayingAudioId(null);
    } else {
      // Stop any currently playing audio
      if (playingAudioId) {
        const currentAudio = audioRefs.current.get(playingAudioId);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }

      // Play new audio
      if (audioElement) {
        audioElement.play();
        setPlayingAudioId(trackId);
      }
    }
  };

  const getClipPosition = (clip: Clip) => {
    const left = (clip.startTime / totalDuration) * 100;
    const width = (clip.duration / totalDuration) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  const selectedClip = clips.find(c => c.id === selectedClipId);

  return (
    <div className="grid h-full grid-cols-2 gap-4">
      {/* Clip List (Left) - Sortable */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <h3 className="font-medium text-gray-900">
            Clips (
            {clips.length}
            )
          </h3>
          <p className="mt-1 text-xs text-gray-600">Drag to reorder clips</p>
        </div>

        <div className="max-h-[500px] space-y-2 overflow-y-auto p-4">
          {clips.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-center">
              <div>
                <p className="mb-2 text-sm text-gray-500">No clips added yet</p>
                <Button variant="secondary" size="sm" onClick={onAddClip}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Clip
                </Button>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={clips.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {clips.map(clip => (
                  <SortableClipItem
                    key={clip.id}
                    clip={clip}
                    isSelected={selectedClipId === clip.id}
                    onClick={() => setSelectedClipId(clip.id)}
                    onDelete={() => handleDeleteClip(clip.id)}
                    formatTime={formatTime}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Timeline Visualization (Right) */}
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
                    {clip.type === 'video'
                      ? (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                            <Video className="h-8 w-8 text-gray-300" />
                          </div>
                        )
                      : (
                          <img
                            src={clip.thumbnailUrl}
                            alt={clip.title}
                            className="h-full w-full object-cover"
                          />
                        )}
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

          {/* Audio Track */}
          <div className="mt-4">
            <div className="mb-2 px-2 text-xs font-medium text-gray-700">
              Audio Track
            </div>
            <div
              className="relative h-12 rounded bg-gray-100"
            >
              {/* Empty state */}
              {(!audioTracks || audioTracks.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs text-gray-400">No audio tracks added</p>
                </div>
              )}

              {/* Audio clips */}
              {audioTracks && audioTracks.map((track) => {
                const left = (track.startTime / totalDuration) * 100;
                const width = (track.duration / totalDuration) * 100;
                const isSelected = selectedAudioId === track.id;
                const isPlaying = playingAudioId === track.id;

                return (
                  <div key={track.id}>
                    {/* Hidden audio element */}
                    <audio
                      ref={(el) => {
                        if (el) {
                          audioRefs.current.set(track.id, el);
                        }
                      }}
                      src={track.audioUrl}
                      onEnded={() => setPlayingAudioId(null)}
                    />

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAudioId(track.id);
                      }}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      className={`absolute top-1 h-[calc(100%-8px)] overflow-hidden rounded border-2 transition-all ${
                        isSelected
                          ? 'border-purple-500 shadow-lg'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {/* Audio visualization */}
                      <div className="relative h-full w-full bg-gradient-to-br from-purple-500 to-purple-700">
                        {/* Waveform-style bars */}
                        <div className="flex h-full items-center justify-around px-1">
                          {Array.from({ length: Math.min(Math.floor(width / 2), 20) }).map((_, i) => (
                            <div
                              key={i}
                              className="w-0.5 bg-white/60"
                              style={{
                                height: `${30 + Math.random() * 70}%`,
                              }}
                            />
                          ))}
                        </div>

                        {/* Play/Pause Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAudioPlayPause(track.id, track.audioUrl);
                          }}
                          className="absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-purple-600 transition-all hover:bg-white hover:shadow-lg"
                          title={isPlaying ? 'Pause' : 'Play'}
                        >
                          {isPlaying ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </button>

                        {/* Title */}
                        <div className="absolute right-1 bottom-1 left-1">
                          <p className="truncate text-[10px] font-medium text-white drop-shadow">
                            {track.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

        {/* Audio Track Details */}
        {audioTracks && selectedAudioId && audioTracks.find(a => a.id === selectedAudioId) && (
          <div className="border-t border-gray-200 bg-purple-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-purple-600" />
                <h3 className="font-medium text-gray-900">
                  {audioTracks.find(a => a.id === selectedAudioId)?.title}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteAudio(selectedAudioId)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Start Time</p>
                <p className="font-mono text-gray-900">
                  {formatTime(audioTracks.find(a => a.id === selectedAudioId)?.startTime || 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Duration</p>
                <p className="font-mono text-gray-900">
                  {formatTime(audioTracks.find(a => a.id === selectedAudioId)?.duration || 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Type</p>
                <p className="text-gray-900">Audio</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
