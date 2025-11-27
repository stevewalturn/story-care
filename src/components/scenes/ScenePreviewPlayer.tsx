'use client';

import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

type PreviewClip = {
  id: string;
  type: 'video' | 'image';
  mediaUrl?: string;
  title: string;
  duration: number;
  startTime: number;
};

type PreviewAudio = {
  id: string;
  audioUrl: string;
  startTime: number;
  duration: number;
};

type ScenePreviewPlayerProps = {
  clips: PreviewClip[];
  audioTracks: PreviewAudio[];
  totalDuration: number;
  sceneName: string;
  onClose: () => void;
};

export function ScenePreviewPlayer({
  clips,
  audioTracks,
  totalDuration,
  sceneName,
  onClose,
}: ScenePreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);

  // Get current clip to display
  const currentClip = clips[currentClipIndex];

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle playback
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const newTime = currentTime + elapsed;

      if (newTime >= totalDuration) {
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentClipIndex(0);
        return;
      }

      setCurrentTime(newTime);

      // Check if we need to move to next clip
      const nextClipIndex = clips.findIndex(
        (clip, idx) =>
          newTime >= clip.startTime
          && (idx === clips.length - 1 || newTime < (clips[idx + 1]?.startTime ?? Infinity)),
      );

      if (nextClipIndex !== -1 && nextClipIndex !== currentClipIndex) {
        setCurrentClipIndex(nextClipIndex);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    startTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, clips, totalDuration, currentClipIndex]);

  // Sync video playback
  useEffect(() => {
    if (!currentClip || currentClip.type !== 'video' || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    const clipStartTime = currentTime - currentClip.startTime;

    if (isPlaying) {
      video.currentTime = clipStartTime;
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [currentClip, isPlaying, currentClipIndex]);

  // Sync audio playback
  useEffect(() => {
    audioTracks.forEach((track, idx) => {
      const audio = audioRefs.current[idx];
      if (!audio) {
        return;
      }

      const trackTime = currentTime - track.startTime;
      const shouldPlay = isPlaying && trackTime >= 0 && trackTime <= track.duration;

      if (shouldPlay) {
        audio.currentTime = trackTime;
        audio.play().catch(console.error);
      } else {
        audio.pause();
      }
    });
  }, [isPlaying, currentTime, audioTracks]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * totalDuration;

    setCurrentTime(newTime);
    setIsPlaying(false);

    // Find which clip this time falls into
    const clipIndex = clips.findIndex(
      (clip, idx) =>
        newTime >= clip.startTime
        && (idx === clips.length - 1 || newTime < (clips[idx + 1]?.startTime ?? Infinity)),
    );
    if (clipIndex !== -1) {
      setCurrentClipIndex(clipIndex);
    }
  };

  const skipBackward = () => {
    setCurrentTime(Math.max(0, currentTime - 5));
    setIsPlaying(false);
  };

  const skipForward = () => {
    setCurrentTime(Math.min(totalDuration, currentTime + 5));
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white transition-colors hover:text-gray-300"
      >
        <X className="h-8 w-8" />
      </button>

      <div className="w-full max-w-5xl px-4">
        {/* Scene name */}
        <h2 className="mb-4 text-center text-2xl font-semibold text-white">
          {sceneName}
          {' '}
          <span className="text-sm font-normal text-gray-400">(Draft Preview)</span>
        </h2>

        {/* Video/Image display */}
        <div className="relative mb-6 aspect-video overflow-hidden rounded-lg bg-black">
          {currentClip ? (
            currentClip.mediaUrl ? (
              currentClip.type === 'video' ? (
                <video
                  ref={videoRef}
                  src={currentClip.mediaUrl}
                  className="h-full w-full object-contain"
                  playsInline
                  muted={audioTracks.length > 0} // Mute video if audio tracks exist
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <img
                    src={currentClip.mediaUrl}
                    alt={currentClip.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white">
                <p>Media URL not available</p>
              </div>
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-500">
              No clips added
            </div>
          )}

          {/* Clip title overlay */}
          {currentClip && (
            <div className="absolute bottom-4 left-4 rounded-lg bg-black/70 px-3 py-2">
              <p className="text-sm font-medium text-white">{currentClip.title}</p>
            </div>
          )}
        </div>

        {/* Audio elements (hidden) */}
        {audioTracks.map((track, idx) => (
          <audio
            key={track.id}
            ref={(el) => {
              if (el) audioRefs.current[idx] = el;
            }}
            src={track.audioUrl}
            preload="auto"
          />
        ))}

        {/* Controls */}
        <div className="rounded-lg bg-gray-900 p-6">
          {/* Timeline */}
          <div className="mb-4">
            <div
              onClick={handleSeek}
              className="relative h-2 cursor-pointer rounded-full bg-gray-700"
            >
              {/* Progress */}
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-indigo-600"
                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
              />

              {/* Playhead */}
              <div
                className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-lg"
                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              />
            </div>

            {/* Time display */}
            <div className="mt-2 flex justify-between text-sm text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="ghost" onClick={skipBackward}>
              <SkipBack className="h-5 w-5 text-white" />
            </Button>

            <button
              onClick={togglePlayPause}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 transition-colors hover:bg-indigo-700"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-white" />
              ) : (
                <Play className="ml-0.5 h-6 w-6 text-white" />
              )}
            </button>

            <Button variant="ghost" onClick={skipForward}>
              <SkipForward className="h-5 w-5 text-white" />
            </Button>
          </div>

          {/* Clip indicator */}
          {clips.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-400">
              Clip
              {' '}
              {currentClipIndex + 1}
              {' '}
              of
              {' '}
              {clips.length}
              {audioTracks.length > 0 && ` • ${audioTracks.length} audio track${audioTracks.length > 1 ? 's' : ''}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
