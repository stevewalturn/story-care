'use client';

import type { SceneCardData } from './SceneCard';
import { Plus } from 'lucide-react';
import { SceneCard } from './SceneCard';

type SceneCardSequenceProps = {
  scenes: SceneCardData[];
  onUpdateScene: (id: string, updates: Partial<SceneCardData>) => void;
  onDeleteScene: (id: string) => void;
  onOptimizePrompt: (id: string) => void;
  onAddScene?: () => void;
  onGenerateImage?: (id: string) => void;
  onUploadImage?: (id: string, file: File) => void;
  onAnimateVideo?: (id: string) => void;
  maxScenes?: number;
  isGeneratingAnyImage?: boolean;
};

export function SceneCardSequence({
  scenes,
  onUpdateScene,
  onDeleteScene,
  onOptimizePrompt,
  onAddScene,
  onGenerateImage,
  onUploadImage,
  onAnimateVideo,
  maxScenes = 5,
  isGeneratingAnyImage,
}: SceneCardSequenceProps) {
  const canAddMore = scenes.length < maxScenes;

  return (
    <div className="w-full">
      {/* Horizontal scrollable container */}
      <div className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 overflow-x-auto pb-4">
        <div className="flex gap-6" style={{ minWidth: 'min-content' }}>
          {/* Scene Cards */}
          {scenes.map(scene => (
            <div
              key={scene.id}
              className="flex-shrink-0"
              style={{ width: '380px' }} // Fixed width for consistent layout
            >
              <SceneCard
                scene={scene}
                onUpdate={onUpdateScene}
                onDelete={onDeleteScene}
                onOptimize={onOptimizePrompt}
                onGenerateImage={onGenerateImage}
                onUploadImage={onUploadImage}
                onAnimateVideo={onAnimateVideo}
                isGeneratingAnyImage={isGeneratingAnyImage}
              />
            </div>
          ))}

          {/* Add Scene Button */}
          {canAddMore && onAddScene && (
            <div
              className="flex-shrink-0"
              style={{ width: '380px' }}
            >
              <button
                onClick={onAddScene}
                className="flex h-full min-h-[400px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-purple-400 hover:bg-purple-50"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <p className="mt-4 text-sm font-medium text-gray-600">
                  Add Another Scene
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {scenes.length}
                  {' '}
                  /
                  {maxScenes}
                  {' '}
                  scenes
                </p>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scene Count Indicator */}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{scenes.length}</span>
          {' '}
          {scenes.length === 1 ? 'scene' : 'scenes'}
          {' '}
          in sequence
        </p>
        {scenes.length >= maxScenes && (
          <p className="text-xs text-amber-600">
            Maximum scenes reached
          </p>
        )}
      </div>
    </div>
  );
}
