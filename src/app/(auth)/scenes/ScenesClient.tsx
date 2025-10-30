'use client';

import { Download, Eye, Save } from 'lucide-react';
import { useState } from 'react';
import { ClipLibrary } from '@/components/scenes/ClipLibrary';
import { SceneTimeline } from '@/components/scenes/SceneTimeline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Clip = {
  id: string;
  type: 'video' | 'image';
  mediaId: string;
  title: string;
  thumbnailUrl: string;
  startTime: number;
  duration: number;
  audioTrack?: string;
};

type MediaItem = {
  id: string;
  type: 'video' | 'image' | 'audio';
  title: string;
  thumbnailUrl: string;
  duration?: number;
};

export function ScenesClient() {
  const [sceneName, setSceneName] = useState('Untitled Scene');
  const [clips, setClips] = useState<Clip[]>([]);
  const [totalDuration, setTotalDuration] = useState(60); // 60 seconds default
  const [isSaving, setIsSaving] = useState(false);

  const handleAddClip = (media: MediaItem, duration: number) => {
    // Calculate start time (end of last clip)
    const startTime = clips.reduce((sum, clip) => {
      const clipEnd = clip.startTime + clip.duration;
      return Math.max(sum, clipEnd);
    }, 0);

    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      type: media.type === 'audio' ? 'image' : media.type,
      mediaId: media.id,
      title: media.title,
      thumbnailUrl: media.thumbnailUrl,
      startTime,
      duration,
      audioTrack: media.type === 'audio' ? media.title : undefined,
    };

    const updatedClips = [...clips, newClip];
    setClips(updatedClips);

    // Adjust total duration if needed
    const sceneEnd = startTime + duration;
    if (sceneEnd > totalDuration) {
      setTotalDuration(Math.ceil(sceneEnd / 10) * 10); // Round up to nearest 10s
    }
  };

  const handleSaveScene = async () => {
    setIsSaving(true);
    // In real implementation, call API to save scene
    // await saveScene({ name: sceneName, clips, totalDuration });

    console.log('Saving scene:', { name: sceneName, clips, totalDuration });

    setTimeout(() => {
      setIsSaving(false);
      alert('Scene saved successfully!');
    }, 1000);
  };

  const handleExport = () => {
    // In real implementation, trigger video assembly/export
    alert('Export functionality will be implemented with FFmpeg or video API');
  };

  const handlePreview = () => {
    // In real implementation, generate preview
    alert('Preview functionality will show assembled scene');
  };

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="max-w-md flex-1">
            <Input
              value={sceneName}
              onChange={e => setSceneName(e.target.value)}
              className="text-2xl font-bold"
              placeholder="Scene name..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handlePreview}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveScene}
              disabled={isSaving || clips.length === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Scene'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Assemble video scenes with images, videos, and audio for your patient's story
        </p>
      </div>

      {/* Main Content */}
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-6">
        {/* Clip Library (Left) */}
        <div className="col-span-1 h-full overflow-hidden">
          <ClipLibrary onAddToTimeline={handleAddClip} />
        </div>

        {/* Timeline & Preview (Right) */}
        <div className="col-span-2 flex h-full flex-col gap-6">
          {/* Preview Area */}
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gray-900">
            {clips.length > 0 && clips[0] ? (
              <div className="relative h-full w-full">
                {/* Show first clip as preview */}
                <img
                  src={clips[0].thumbnailUrl}
                  alt="Scene preview"
                  className="h-full w-full object-cover"
                />
                <div className="bg-opacity-40 absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-center text-white">
                    <Eye className="mx-auto mb-3 h-12 w-12 opacity-75" />
                    <p className="text-sm">Click Preview to watch assembled scene</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p className="mb-2">Scene Preview</p>
                <p className="text-sm">Add clips from the library to start building your scene</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="min-h-0 flex-1">
            <SceneTimeline
              clips={clips}
              totalDuration={totalDuration}
              onClipsChange={setClips}
              onAddClip={() => {
                // Scroll to clip library or show modal
                console.log('Add clip from library');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
