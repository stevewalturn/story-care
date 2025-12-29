'use client';

import { GripVertical, Loader2, Maximize2, Pause, Play, RotateCw, SkipBack, SkipForward, Sparkles, Trash2, Upload, Video, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/Input';

export type SceneCardData = {
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
};

type SceneCardProps = {
  scene: SceneCardData;
  onUpdate: (id: string, updates: Partial<SceneCardData>) => void;
  onDelete: (id: string) => void;
  onOptimize: (id: string) => void;
  onGenerateImage?: (id: string) => void;
  onUploadImage?: (id: string, file: File) => void;
  onAnimateVideo?: (id: string) => void;
  isGeneratingAnyImage?: boolean;
};

export function SceneCard({
  scene,
  onUpdate,
  onDelete,
  onOptimize,
  onGenerateImage,
  onUploadImage,
  onAnimateVideo,
  isGeneratingAnyImage,
}: SceneCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadImage) {
      onUploadImage(scene.id, file);
    }
    // Reset input
    if (e.target) e.target.value = '';
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/') && onUploadImage) {
      onUploadImage(scene.id, file);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    onUpdate(scene.id, { title: newTitle });
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  const handlePromptChange = (newPrompt: string) => {
    onUpdate(scene.id, { prompt: newPrompt });
  };

  // Video controls
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [scene.videoUrl]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                  className="h-1.5 bg-purple-500 transition-all duration-300"
                  style={{ width: `${scene.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Status: Ready - Show video with custom controls
    if (scene.status === 'ready' && scene.videoUrl) {
      return (
        <div className="group relative h-full w-full bg-black">
          <video
            ref={videoRef}
            src={scene.videoUrl}
            className="h-full w-full object-cover"
            poster={scene.imageUrl}
            muted={isMuted}
          />
          {/* Play button overlay (when paused) */}
          {!isPlaying && (
            <div
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/20"
              onClick={togglePlayPause}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110">
                <Play className="ml-1 h-7 w-7 text-purple-600" />
              </div>
            </div>
          )}
          {/* Video controls at bottom */}
          <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayPause}
                className="text-white transition-colors hover:text-purple-400"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={skipBackward}
                className="text-white transition-colors hover:text-purple-400"
              >
                <SkipBack className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={skipForward}
                className="text-white transition-colors hover:text-purple-400"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={toggleMute}
                className="text-white transition-colors hover:text-purple-400"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <div className="flex-1">
                <div className="h-1 overflow-hidden rounded-full bg-white/30">
                  <div
                    className="h-full bg-white transition-all"
                    style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <span className="text-xs text-white">
                {formatTime(currentTime)}
                {' '}
                /
                {formatTime(duration || 300)}
              </span>
              <button className="text-white transition-colors hover:text-purple-400">
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
            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm text-gray-600">Generating image...</p>
          </div>
        </div>
      );
    }

    // Status: Has Image - Show image
    if (scene.imageUrl) {
      return (
        <div className="h-full w-full">
          <img
            src={scene.imageUrl}
            alt={scene.title}
            className="h-full w-full object-cover"
          />
        </div>
      );
    }

    // Status: Draft - Show upload placeholder
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center transition-colors ${
          isDragging ? 'border-2 border-dashed border-purple-500 bg-purple-50' : 'bg-gray-100'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div
          className="cursor-pointer text-center"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
            isDragging ? 'bg-purple-200' : 'bg-gray-200'
          }`}
          >
            <Upload className={`h-6 w-6 ${isDragging ? 'text-purple-600' : 'text-gray-400'}`} />
          </div>
          <p className={`text-sm font-medium ${isDragging ? 'text-purple-600' : 'text-gray-600'}`}>
            {isDragging ? 'Drop image here' : 'Upload or drag image'}
          </p>
          <p className="mt-1 text-xs text-gray-400">or generate with AI below</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-purple-300 hover:shadow-md">
      {/* Header Row - Drag handle + Number + Title + Trash */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        {/* Drag handle + Number */}
        <div className="flex items-center gap-1.5 text-gray-400">
          <GripVertical className="h-4 w-4 cursor-grab" />
          <span className="text-sm font-medium text-gray-700">{scene.sequence}</span>
        </div>

        {/* Title - Editable */}
        <div className="flex-1">
          {isEditingTitle ? (
            <Input
              value={scene.title}
              onChange={e => handleTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={e => e.key === 'Enter' && handleTitleBlur()}
              autoFocus
              className="h-7 text-sm font-medium"
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="cursor-pointer truncate text-sm font-medium text-gray-900 hover:text-purple-600"
            >
              {scene.title}
            </h3>
          )}
        </div>

        {/* Trash icon */}
        <button
          onClick={() => onDelete(scene.id)}
          className="rounded p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Preview Area - 16:9 aspect ratio */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        {renderPreview()}
      </div>

      {/* Content Area */}
      <div className="flex flex-col p-4">
        {/* Prompt Section Header */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Prompt</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOptimize(scene.id)}
              className="flex items-center gap-1 text-sm font-medium text-purple-600 transition-colors hover:text-purple-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Optimize
            </button>
          </div>
        </div>

        {/* Prompt Textarea */}
        <textarea
          value={scene.prompt}
          onChange={e => handlePromptChange(e.target.value)}
          placeholder="Describe the scene..."
          className="mb-4 min-h-[80px] w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Upload Image Button */}
          {onUploadImage && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={scene.status === 'generating_image'}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              title="Upload your own image"
            >
              <Upload className="h-4 w-4" />
            </button>
          )}

          {/* Regenerate Image Button */}
          <button
            onClick={() => onGenerateImage?.(scene.id)}
            disabled={isGeneratingAnyImage || scene.status === 'generating_image'}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCw className="h-4 w-4" />
            {scene.imageUrl ? 'Regenerate' : 'Generate'}
          </button>

          {/* Generate Video Button */}
          <button
            onClick={() => onAnimateVideo?.(scene.id)}
            disabled={!scene.imageUrl || scene.status === 'animating' || scene.status === 'generating_image'}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-purple-600 bg-white px-3 py-2.5 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Video className="h-4 w-4" />
            Video
          </button>
        </div>
      </div>
    </div>
  );
}
