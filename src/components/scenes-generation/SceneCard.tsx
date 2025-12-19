'use client';

import { Loader2, Maximize2, Play, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface SceneCardData {
  id: string;
  sequence: number;
  title: string;
  prompt: string;
  imageUrl?: string;
  videoUrl?: string;
  imageMediaId?: string; // Media library ID for the generated image
  videoMediaId?: string; // Media library ID for the generated video
  status: 'draft' | 'generating_image' | 'animating' | 'ready';
  progress?: number;
  metadata?: {
    patientQuote?: string;
    meaning?: string;
    imageToScene?: string;
  };
}

interface SceneCardProps {
  scene: SceneCardData;
  onUpdate: (id: string, updates: Partial<SceneCardData>) => void;
  onDelete: (id: string) => void;
  onOptimize: (id: string) => void;
  onGenerateImage?: (id: string) => void;
  onAnimateVideo?: (id: string) => void;
  isGeneratingAnyImage?: boolean;
}

export function SceneCard({
  scene,
  onUpdate,
  onDelete,
  onOptimize,
  onGenerateImage,
  onAnimateVideo,
  isGeneratingAnyImage,
}: SceneCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  const handleTitleChange = (newTitle: string) => {
    onUpdate(scene.id, { title: newTitle });
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  const renderPreview = () => {
    // Status: Animating - Show progress overlay
    if (scene.status === 'animating') {
      return (
        <div className="relative h-full w-full bg-gray-900">
          {scene.imageUrl && (
            <img
              src={scene.imageUrl}
              alt={scene.title}
              className="h-full w-full object-cover opacity-50"
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-white" />
            <p className="mb-2 text-sm font-medium text-white">Animating Image</p>
            {scene.progress !== undefined && (
              <div className="w-48 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-1.5 bg-indigo-500 transition-all duration-300"
                  style={{ width: `${scene.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Status: Ready - Show video with play button
    if (scene.status === 'ready' && scene.videoUrl) {
      return (
        <div className="group relative h-full w-full bg-black">
          <video
            src={scene.videoUrl}
            className="h-full w-full object-cover"
            poster={scene.imageUrl}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity group-hover:bg-black/40">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
              <Play className="ml-1 h-8 w-8 text-indigo-600" />
            </div>
          </div>
          {/* Video controls at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex items-center gap-2">
              <button className="text-white hover:text-indigo-400">
                <Play className="h-4 w-4" />
              </button>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                <div className="h-full w-0 bg-white" />
              </div>
              <span className="text-xs text-white">1:00 / 5:00</span>
              <button className="text-white hover:text-indigo-400">
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Status: Generating Image - Show spinner
    if (scene.status === 'generating_image') {
      return (
        <div className="flex h-full w-full items-center justify-center bg-gray-100">
          <div className="text-center">
            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm text-gray-600">Generating image...</p>
          </div>
        </div>
      );
    }

    // Status: Has Image - Show image
    if (scene.imageUrl) {
      return (
        <div className="group relative h-full w-full">
          <img
            src={scene.imageUrl}
            alt={scene.title}
            className="h-full w-full object-cover"
          />
          {/* Animate button overlay */}
          {onAnimateVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/40">
              <Button
                onClick={() => onAnimateVideo(scene.id)}
                variant="primary"
                className="translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100"
              >
                <Play className="mr-2 h-4 w-4" />
                Animate to Video
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Status: Draft - Show placeholder
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="mb-2 text-sm font-medium text-gray-600">No image yet</p>
          {onGenerateImage && (
            <div className="relative">
              <Button
                onClick={() => onGenerateImage(scene.id)}
                variant="secondary"
                size="sm"
                disabled={isGeneratingAnyImage}
                title={isGeneratingAnyImage ? 'Another image is being generated. Please wait.' : ''}
              >
                <Sparkles className="mr-2 h-3 w-3" />
                Generate Image
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const truncatedPrompt = scene.prompt.length > 120
    ? `${scene.prompt.substring(0, 120)}...`
    : scene.prompt;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
      {/* Sequence Number Badge */}
      <div className="absolute top-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-lg">
        {scene.sequence}
      </div>

      {/* Preview Area - 16:9 aspect ratio */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
        {renderPreview()}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title - Editable */}
        <div className="mb-3">
          {isEditingTitle ? (
            <Input
              value={scene.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
              autoFocus
              className="text-base font-semibold"
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="cursor-pointer text-base font-semibold text-gray-900 hover:text-indigo-600"
            >
              {scene.title}
            </h3>
          )}
        </div>

        {/* Prompt Text */}
        <div className="mb-3 flex-1">
          <p className="text-sm leading-relaxed text-gray-600">
            {showFullPrompt ? scene.prompt : truncatedPrompt}
          </p>
          {scene.prompt.length > 120 && (
            <button
              onClick={() => setShowFullPrompt(!showFullPrompt)}
              className="mt-1 text-xs text-indigo-600 hover:text-indigo-700"
            >
              {showFullPrompt ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onOptimize(scene.id)}
            variant="secondary"
            size="sm"
            className="flex-1"
          >
            <Sparkles className="mr-2 h-3 w-3" />
            Optimize
          </Button>
          <Button
            onClick={() => onDelete(scene.id)}
            variant="ghost"
            size="sm"
            className="px-2"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}
