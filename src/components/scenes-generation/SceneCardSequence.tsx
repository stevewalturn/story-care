'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import type { SceneCardData } from './SceneCard';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  onBrowseAssets?: (id: string) => void;
  onAnimateVideo?: (id: string) => void;
  onReorderScenes?: (oldIndex: number, newIndex: number) => void;
  maxScenes?: number;
  isGeneratingAnyImage?: boolean;
  /** Whether the selected model supports prompt input */
  supportsPrompt?: boolean;
};

// Sortable wrapper for SceneCard
function SortableSceneCard({
  scene,
  onUpdate,
  onDelete,
  onOptimize,
  onGenerateImage,
  onUploadImage,
  onBrowseAssets,
  onAnimateVideo,
  isGeneratingAnyImage,
  supportsPrompt,
}: {
  scene: SceneCardData;
  onUpdate: (id: string, updates: Partial<SceneCardData>) => void;
  onDelete: (id: string) => void;
  onOptimize: (id: string) => void;
  onGenerateImage?: (id: string) => void;
  onUploadImage?: (id: string, file: File) => void;
  onBrowseAssets?: (id: string) => void;
  onAnimateVideo?: (id: string) => void;
  isGeneratingAnyImage?: boolean;
  supportsPrompt?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className="flex-shrink-0"
      style={{ width: '380px' }}
    >
      <SceneCard
        ref={setNodeRef}
        scene={scene}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onOptimize={onOptimize}
        onGenerateImage={onGenerateImage}
        onUploadImage={onUploadImage}
        onBrowseAssets={onBrowseAssets}
        onAnimateVideo={onAnimateVideo}
        isGeneratingAnyImage={isGeneratingAnyImage}
        supportsPrompt={supportsPrompt}
        dragHandleProps={{ attributes, listeners }}
        sortableStyle={style}
        isSortableDragging={isDragging}
      />
    </div>
  );
}

export function SceneCardSequence({
  scenes,
  onUpdateScene,
  onDeleteScene,
  onOptimizePrompt,
  onAddScene,
  onGenerateImage,
  onUploadImage,
  onBrowseAssets,
  onAnimateVideo,
  onReorderScenes,
  maxScenes = 5,
  isGeneratingAnyImage,
  supportsPrompt = true,
}: SceneCardSequenceProps) {
  const canAddMore = scenes.length < maxScenes;

  // Drag sensors with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // Handle drag end - reorder scenes
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorderScenes) {
      const oldIndex = scenes.findIndex(s => s.id === active.id);
      const newIndex = scenes.findIndex(s => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderScenes(oldIndex, newIndex);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Horizontal scrollable container */}
      <div className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={scenes.map(s => s.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-6" style={{ minWidth: 'min-content' }}>
              {/* Scene Cards */}
              {scenes.map(scene => (
                <SortableSceneCard
                  key={scene.id}
                  scene={scene}
                  onUpdate={onUpdateScene}
                  onDelete={onDeleteScene}
                  onOptimize={onOptimizePrompt}
                  onGenerateImage={onGenerateImage}
                  onUploadImage={onUploadImage}
                  onBrowseAssets={onBrowseAssets}
                  onAnimateVideo={onAnimateVideo}
                  isGeneratingAnyImage={isGeneratingAnyImage}
                  supportsPrompt={supportsPrompt}
                />
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
          </SortableContext>
        </DndContext>
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
