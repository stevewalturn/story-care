'use client';

import { useState } from 'react';
import { X, Film, Loader2, Check, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Patient {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface GenerateVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (videoUrl: string, prompt: string) => void;
  patients?: Patient[];
}

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
  patients = [],
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
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 3000);

      const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          duration: parseInt(duration),
          style,
          motion,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video');
      }

      setGeneratedVideo(data.videoUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate video');
    } finally {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Generate Video</h2>
              <p className="text-sm text-gray-600">Create AI-generated videos for patient stories</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Prompt */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Describe Your Video *
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A person walking through a peaceful forest path, sunlight filtering through trees..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                maxLength={2000}
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Describe movement, transitions, and atmosphere</span>
                <span>{prompt.length} / 2000</span>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VIDEO_DURATIONS.map((dur) => (
                  <button
                    key={dur.id}
                    type="button"
                    onClick={() => setDuration(dur.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      duration === dur.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{dur.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{dur.desc}</div>
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
                {VIDEO_STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      style === s.id
                        ? 'border-indigo-500 bg-indigo-50'
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
                {MOTION_TYPES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMotion(m.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      motion === m.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{m.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{m.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Video generation typically takes 2-5 minutes depending on duration and complexity. You'll be notified when it's ready.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
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
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating... {progress}%
                </>
              ) : (
                <>
                  <Film className="w-4 h-4 mr-2" />
                  Generate Video
                </>
              )}
            </Button>

            {/* Progress Bar */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 text-center">
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
            <div className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
              {isGenerating ? (
                <div className="text-center p-8">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">Generating your video...</p>
                  <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{progress}% complete</p>
                </div>
              ) : generatedVideo ? (
                <video
                  src={generatedVideo}
                  controls
                  className="w-full h-full object-contain"
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="text-center p-8">
                  <Film className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">No video generated yet</p>
                  <p className="text-xs text-gray-500">
                    Configure your settings and click Generate
                  </p>
                </div>
              )}
            </div>

            {generatedVideo && (
              <div className="space-y-3">
                <Button onClick={handleSave} variant="primary" className="w-full">
                  <Check className="w-4 h-4 mr-2" />
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
