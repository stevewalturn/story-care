'use client';

import { Check, Film, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type Patient = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type GenerateVideoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (videoUrl: string, prompt: string) => void;
  patients?: Patient[];
};

const VIDEO_DURATIONS = [
  { id: '5', label: '5 seconds', desc: 'Quick animation' },
  { id: '10', label: '10 seconds', desc: 'Short scene' },
  { id: '30', label: '30 seconds', desc: 'Extended narrative' },
];

const VIDEO_STYLES = [
  { id: 'cinematic', label: 'Cinematic', description: 'Film-like quality with dramatic lighting' },
  { id: 'animation', label: 'Animation', description: 'Smooth animated style' },
  { id: 'realistic', label: 'Realistic', description: 'Photorealistic movement' },
  { id: 'dreamlike', label: 'Dreamlike', description: 'Surreal, flowing transitions' },
];

const MOTION_TYPES = [
  { id: 'slow', label: 'Slow', description: 'Gentle, peaceful movement' },
  { id: 'medium', label: 'Medium', description: 'Natural pacing' },
  { id: 'dynamic', label: 'Dynamic', description: 'Energetic, engaging' },
];

export function GenerateVideoModal({
  isOpen,
  onClose,
  onGenerate,
  patients: _patients = [],
}: GenerateVideoModalProps) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('10');
  const [style, setStyle] = useState('cinematic');
  const [motion, setMotion] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      // Start video generation (returns taskId immediately)
      const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          duration: Number.parseInt(duration),
          style,
          motion,
          model: 'seedance-v1.5-pro-i2v',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start video generation');
      }

      const taskId = data.taskId;

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      const pollInterval = setInterval(async () => {
        attempts++;

        try {
          const statusResponse = await fetch(`/api/ai/video-task/${taskId}`);
          const statusData = await statusResponse.json();

          if (statusData.data.status === 'completed') {
            clearInterval(pollInterval);
            setProgress(100);
            setGeneratedVideo(statusData.data.media.mediaUrl);
            setIsGenerating(false);
          } else if (statusData.data.status === 'failed' || attempts >= maxAttempts) {
            clearInterval(pollInterval);
            throw new Error(statusData.data.error || 'Video generation timed out');
          } else {
            // Update progress from server
            setProgress(statusData.data.progress || Math.min(attempts * 2, 90));
          }
        } catch (pollError: any) {
          clearInterval(pollInterval);
          throw pollError;
        }
      }, 5000); // Poll every 5 seconds
    } catch (err: any) {
      setError(err.message || 'Failed to generate video');
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (generatedVideo) {
      onGenerate(generatedVideo, prompt);
      handleClose();
    }
  };

  const handleClose = () => {
    setPrompt('');
    setGeneratedVideo(null);
    setError(null);
    setProgress(0);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Generate Video</h2>
              <p className="text-sm text-gray-600">Create AI-generated videos for patient stories</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Prompt */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Describe Your Video *
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="A person walking through a peaceful forest path, sunlight filtering through trees..."
                className="h-32 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                maxLength={2000}
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Describe movement, transitions, and atmosphere</span>
                <span>
                  {prompt.length}
                  {' '}
                  / 2000
                </span>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VIDEO_DURATIONS.map(dur => (
                  <button
                    key={dur.id}
                    type="button"
                    onClick={() => setDuration(dur.id)}
                    className={`rounded-lg border-2 p-3 text-center transition-all ${
                      duration === dur.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{dur.label}</div>
                    <div className="mt-1 text-xs text-gray-600">{dur.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Visual Style
              </label>
              <div className="space-y-2">
                {VIDEO_STYLES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                      style === s.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{s.label}</div>
                    <div className="text-xs text-gray-600">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Motion */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Motion Speed
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MOTION_TYPES.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMotion(m.id)}
                    className={`rounded-lg border-2 p-3 text-center transition-all ${
                      motion === m.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{m.label}</div>
                    <div className="mt-1 text-xs text-gray-600">{m.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong>
                {' '}
                Video generation typically takes 2-5 minutes depending on duration and complexity. You'll be notified when it's ready.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              variant="primary"
              className="w-full"
            >
              {isGenerating
                ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                      {' '}
                      {progress}
                      %
                    </>
                  )
                : (
                    <>
                      <Film className="mr-2 h-4 w-4" />
                      Generate Video
                    </>
                  )}
            </Button>

            {/* Progress Bar */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-2 bg-purple-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-xs text-gray-600">
                  This may take a few minutes...
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Preview
            </label>
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              {isGenerating
                ? (
                    <div className="p-8 text-center">
                      <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-purple-600" />
                      <p className="mb-2 text-sm text-gray-600">Generating your video...</p>
                      <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-2 bg-purple-600 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {progress}
                        % complete
                      </p>
                    </div>
                  )
                : generatedVideo
                  ? (
                      <video
                        src={generatedVideo}
                        controls
                        className="h-full w-full object-contain"
                      >
                        Your browser does not support video playback.
                      </video>
                    )
                  : (
                      <div className="p-8 text-center">
                        <Film className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-600">No video generated yet</p>
                        <p className="text-xs text-gray-500">
                          Configure your settings and click Generate
                        </p>
                      </div>
                    )}
            </div>

            {generatedVideo && (
              <div className="space-y-3">
                <Button onClick={handleSave} variant="primary" className="w-full">
                  <Check className="mr-2 h-4 w-4" />
                  Save to Library
                </Button>
                <Button
                  onClick={() => setGeneratedVideo(null)}
                  variant="ghost"
                  className="w-full"
                >
                  Generate Another
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
