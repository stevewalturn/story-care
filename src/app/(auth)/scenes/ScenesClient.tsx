'use client';

import { useState } from 'react';
import { Save, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SceneTimeline } from '@/components/scenes/SceneTimeline';
import { ClipLibrary } from '@/components/scenes/ClipLibrary';

interface Clip {
  id: string;
  type: 'video' | 'image';
  mediaId: string;
  title: string;
  thumbnailUrl: string;
  startTime: number;
  duration: number;
  audioTrack?: string;
}

interface MediaItem {
  id: string;
  type: 'video' | 'image' | 'audio';
  title: string;
  thumbnailUrl: string;
  duration?: number;
}

interface ScenesClientProps {
  locale: string;
}

export function ScenesClient({ locale }: ScenesClientProps) {
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
    <div className="p-8 h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 max-w-md">
            <Input
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              className="text-2xl font-bold"
              placeholder="Scene name..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveScene}
              disabled={isSaving || clips.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Scene'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Assemble video scenes with images, videos, and audio for your patient's story
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
        {/* Clip Library (Left) */}
        <div className="col-span-1 h-full overflow-hidden">
          <ClipLibrary onAddToTimeline={handleAddClip} />
        </div>

        {/* Timeline & Preview (Right) */}
        <div className="col-span-2 flex flex-col gap-6 h-full">
          {/* Preview Area */}
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
            {clips.length > 0 ? (
              <div className="relative w-full h-full">
                {/* Show first clip as preview */}
                <img
                  src={clips[0].thumbnailUrl}
                  alt="Scene preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Eye className="w-12 h-12 mx-auto mb-3 opacity-75" />
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
          <div className="flex-1 min-h-0">
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
