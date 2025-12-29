'use client';

import { Film, Play, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type SceneCompilationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onEditTimeframe?: () => void;
  onCompileNow: () => void;
  sceneCount: number;
  isCompiling?: boolean;
  // New compilation settings
  loopAudio: boolean;
  onLoopAudioChange: (value: boolean) => void;
  loopScenes: boolean;
  onLoopScenesChange: (value: boolean) => void;
  sceneDuration: number;
  onSceneDurationChange: (value: number) => void;
  musicDuration?: number;
};

const DURATION_OPTIONS = [5, 10, 15, 20];

export function SceneCompilationModal({
  isOpen,
  onClose,
  onEditTimeframe,
  onCompileNow,
  sceneCount,
  isCompiling = false,
  loopAudio,
  onLoopAudioChange,
  loopScenes,
  onLoopScenesChange,
  sceneDuration,
  onSceneDurationChange,
  musicDuration = 0,
}: SceneCompilationModalProps) {
  if (!isOpen) return null;

  const totalVideoDuration = sceneCount * sceneDuration;
  const musicDurationSec = musicDuration || 0;

  // Calculate if we need to loop scenes
  const scenesNeedLooping = loopScenes && musicDurationSec > totalVideoDuration;
  const sceneLoopCount = scenesNeedLooping
    ? Math.ceil(musicDurationSec / totalVideoDuration)
    : 1;
  const finalVideoDuration = totalVideoDuration * sceneLoopCount;

  // For music looping preview
  const musicLoopCount = !scenesNeedLooping && loopAudio && musicDurationSec > 0
    ? Math.ceil(finalVideoDuration / musicDurationSec)
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={!isCompiling ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="mb-6 text-center">
              {/* Icon */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Play className="h-8 w-8 text-purple-600" />
              </div>

              {/* Title */}
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Compile into one video
              </h2>

              {/* Description */}
              <p className="text-sm text-gray-600">
                Combine your scenes and music into a final video
              </p>
            </div>

            {/* Settings Section */}
            <div className="mb-6 space-y-5">
              {/* Scene Duration Selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Duration per scene
                </label>
                <div className="flex gap-2">
                  {DURATION_OPTIONS.map(duration => (
                    <button
                      key={duration}
                      onClick={() => onSceneDurationChange(duration)}
                      disabled={isCompiling}
                      className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                        sceneDuration === duration
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {duration}
                      s
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Loop Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <Repeat className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Loop background music</p>
                    <p className="text-xs text-gray-500">Music repeats to fit video length</p>
                  </div>
                </div>
                <button
                  onClick={() => onLoopAudioChange(!loopAudio)}
                  disabled={isCompiling}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    loopAudio ? 'bg-purple-600' : 'bg-gray-300'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      loopAudio ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Loop Scenes Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <Film className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Loop scenes to fit music</p>
                    <p className="text-xs text-gray-500">Scenes repeat to match music duration</p>
                  </div>
                </div>
                <button
                  onClick={() => onLoopScenesChange(!loopScenes)}
                  disabled={isCompiling}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    loopScenes ? 'bg-purple-600' : 'bg-gray-300'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      loopScenes ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Preview Info */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="mb-2 text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Preview
                </p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">
                      {sceneCount}
                      {' '}
                      scenes
                    </span>
                    {' × '}
                    <span className="font-medium">
                      {sceneDuration}
                      {' '}
                      seconds
                    </span>
                    {scenesNeedLooping && (
                      <>
                        {' × '}
                        <span className="font-medium">
                          {sceneLoopCount}
                          {' '}
                          loops
                        </span>
                      </>
                    )}
                    {' = '}
                    <span className="font-semibold text-purple-600">
                      {finalVideoDuration}
                      {' '}
                      seconds
                    </span>
                    {' total'}
                  </p>
                  {musicLoopCount > 1 && (
                    <p className="text-xs text-gray-500">
                      Music will loop
                      {' '}
                      {musicLoopCount}
                      × to fill video
                    </p>
                  )}
                  {scenesNeedLooping && (
                    <p className="text-xs text-gray-500">
                      Scenes will loop
                      {' '}
                      {sceneLoopCount}
                      × to match
                      {' '}
                      {Math.floor(musicDurationSec)}
                      s music
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={onCompileNow}
                variant="primary"
                className="w-full"
                disabled={isCompiling}
              >
                {isCompiling ? 'Compiling...' : 'Compile now'}
              </Button>

              {onEditTimeframe && (
                <Button
                  onClick={onEditTimeframe}
                  variant="secondary"
                  className="w-full"
                  disabled={isCompiling}
                >
                  Edit Timeframe
                </Button>
              )}

              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full"
                disabled={isCompiling}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
