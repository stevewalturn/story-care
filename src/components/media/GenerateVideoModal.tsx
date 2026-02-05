'use client';

import type { PatientReferenceImage } from '@/models/Schema';
import { Check, ChevronDown, Film, HelpCircle, Loader2, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoModels } from '@/hooks/useAiModels';

type ReferenceImage = {
  id: string;
  url: string;
  title: string;
};

type GenerateVideoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (videoUrl: string, prompt: string) => void;
  initialPrompt?: string;
  sessionId?: string;
  patientId?: string;
  patientName?: string;
  referenceImage?: ReferenceImage; // Optional pre-selected image (e.g., from media library)
};

const VIDEO_DURATIONS = [
  { id: '5', label: '5 seconds', desc: 'Quick animation' },
  { id: '10', label: '10 seconds', desc: 'Short scene' },
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

// Helper function moved to component to access hook data

export function GenerateVideoModal({
  isOpen,
  onClose,
  onGenerate,
  initialPrompt = '',
  sessionId,
  patientId,
  patientName,
  referenceImage,
}: GenerateVideoModalProps) {
  const { user } = useAuth();

  // Get video models from database
  const { models: videoModels, allModels: allVideoModels, findModel } = useVideoModels();

  // Form state
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedModel, setSelectedModel] = useState('sora-2-i2v-pro'); // Default to best model
  const [duration, setDuration] = useState('5');
  const [style, setStyle] = useState('cinematic');
  const [motion, setMotion] = useState('medium');
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Set default model when models load
  useEffect(() => {
    if (allVideoModels.length > 0 && !allVideoModels.find(m => m.modelId === selectedModel)) {
      setSelectedModel(allVideoModels[0]?.modelId || 'sora-2-i2v-pro');
    }
  }, [allVideoModels, selectedModel]);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Patient reference images (select ONE as starting frame for i2v)
  const [patientReferenceImages, setPatientReferenceImages] = useState<PatientReferenceImage[]>([]);
  const [loadingReferenceImages, setLoadingReferenceImages] = useState(false);
  const [selectedRefImageId, setSelectedRefImageId] = useState<string | null>(null);

  // Drag and drop state for uploading
  const [isDragging, setIsDragging] = useState(false);
  const [savingAsReference, setSavingAsReference] = useState(false);
  const dragCounterRef = useRef(0);

  // If referenceImage prop is provided, use it directly; otherwise use selected patient reference
  const hasPreSelectedImage = !!referenceImage;
  const selectedPatientImage = patientReferenceImages.find(img => img.id === selectedRefImageId);
  const selectedImage = hasPreSelectedImage
    ? { imageUrl: referenceImage.url, label: referenceImage.title, id: referenceImage.id, isPrimary: false }
    : selectedPatientImage;

  // Reset prompt when initialPrompt changes
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Fetch patient reference images
  useEffect(() => {
    const fetchReferenceImages = async () => {
      if (!isOpen || !patientId) {
        setPatientReferenceImages([]);
        return;
      }

      try {
        setLoadingReferenceImages(true);
        const idToken = await user?.getIdToken();
        if (!idToken) return;

        const response = await fetch(`/api/patients/${patientId}/reference-images`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const images = data.images || [];
          setPatientReferenceImages(images);
          // Auto-select first (primary) image if available
          if (images.length > 0 && !selectedRefImageId) {
            const primaryImage = images.find((img: PatientReferenceImage) => img.isPrimary);
            setSelectedRefImageId(primaryImage?.id || images[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching reference images:', err);
      } finally {
        setLoadingReferenceImages(false);
      }
    };

    fetchReferenceImages();
  }, [isOpen, patientId, user, selectedRefImageId]);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadReferenceImage(file);
  };

  // Upload new reference image
  const uploadReferenceImage = async (file: File) => {
    if (!patientId) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      toast.error('Please upload an image file');
      return;
    }

    setSavingAsReference(true);
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('isPrimary', patientReferenceImages.length === 0 ? 'true' : 'false');
      formData.append('label', 'Reference image');

      const response = await fetch(`/api/patients/${patientId}/reference-images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save reference image');
      }

      const data = await response.json();
      setPatientReferenceImages(prev => [data.image, ...prev]);
      // Auto-select the newly uploaded image
      setSelectedRefImageId(data.image.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save reference image';
      console.error('Error saving reference image:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSavingAsReference(false);
    }
  };

  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadReferenceImage(file);
  };

  // Generate video directly from selected reference image
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter an animation prompt');
      toast.error('Please enter an animation prompt');
      return;
    }

    if (!selectedImage) {
      setError('Please select a reference image');
      toast.error('Please select a reference image');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const idToken = await user?.getIdToken();

      // Get the image URL (handle GCS paths)
      const imageUrl = selectedImage.imageUrl.startsWith('http')
        ? selectedImage.imageUrl
        : `/api/media/signed-url?path=${encodeURIComponent(selectedImage.imageUrl)}`;

      // Build request body
      const requestBody = {
        prompt,
        duration: Number.parseInt(duration),
        style,
        motion,
        model: selectedModel,
        referenceImage: imageUrl,
        sessionId,
        patientId,
      };

      // Start video generation
      const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(requestBody),
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
          const statusResponse = await fetch(`/api/ai/video-task/${taskId}`, {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
          const statusData = await statusResponse.json();

          if (statusData.data?.status === 'completed') {
            clearInterval(pollInterval);
            setProgress(100);
            // Get playable URL for the video
            const mediaUrl = statusData.data.media?.mediaUrl;
            let playableUrl = mediaUrl;

            // If it's a GCS path, fetch the signed URL with auth
            if (mediaUrl && !mediaUrl.startsWith('http')) {
              try {
                const signedUrlResponse = await fetch(
                  `/api/media/signed-url?path=${encodeURIComponent(mediaUrl)}`,
                  {
                    headers: {
                      Authorization: `Bearer ${idToken}`,
                    },
                  },
                );
                if (signedUrlResponse.ok) {
                  const signedUrlData = await signedUrlResponse.json();
                  playableUrl = signedUrlData.signedUrl || signedUrlData.url;
                }
              } catch (err) {
                console.error('Failed to get signed URL:', err);
              }
            }
            setGeneratedVideo(playableUrl);
            setIsGenerating(false);
          } else if (statusData.data?.status === 'failed' || attempts >= maxAttempts) {
            clearInterval(pollInterval);
            throw new Error(statusData.data?.error || 'Video generation timed out');
          } else {
            setProgress(statusData.data?.progress || Math.min(attempts * 2, 90));
          }
        } catch (pollError: any) {
          clearInterval(pollInterval);
          const errorMsg = pollError.message || 'Failed to check video status';
          setError(errorMsg);
          toast.error(errorMsg);
          setIsGenerating(false);
        }
      }, 5000);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate video';
      setError(errorMsg);
      toast.error(errorMsg);
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
    setSelectedRefImageId(null);
    setIsDragging(false);
    setSavingAsReference(false);
    setShowModelDropdown(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const currentModel = findModel(selectedModel);

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Generate Video</h2>
              <p className="text-sm text-gray-600">
                Select a reference image and animate it into a video
              </p>
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
          <div className="space-y-5">
            {/* Reference Image Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Reference Image</span>
                <span title="Select an image to animate into video">
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </span>
                {patientName && !hasPreSelectedImage && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    {patientName}
                  </span>
                )}
              </div>

              {/* Pre-selected image from media library */}
              {hasPreSelectedImage && referenceImage && (
                <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={referenceImage.url}
                        alt={referenceImage.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{referenceImage.title}</p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-purple-600">
                        <Check className="h-3 w-3" />
                        <span>Ready to animate</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient reference images selection */}
              {!hasPreSelectedImage && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  {loadingReferenceImages ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading reference images...
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-3">
                        {patientReferenceImages.map(img => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setSelectedRefImageId(img.id)}
                            className={`relative h-20 w-20 overflow-hidden rounded-lg border-3 transition-all ${
                              selectedRefImageId === img.id
                                ? 'border-purple-500 shadow-lg shadow-purple-200'
                                : 'border-gray-200 opacity-70 hover:border-gray-300 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={img.imageUrl.startsWith('http') ? img.imageUrl : `/api/media/signed-url?path=${encodeURIComponent(img.imageUrl)}`}
                              alt={img.label || 'Reference'}
                              className="h-full w-full object-cover"
                            />
                            {selectedRefImageId === img.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-purple-500/20">
                                <Check className="h-6 w-6 text-purple-600" />
                              </div>
                            )}
                          </button>
                        ))}

                        {/* Upload new reference image */}
                        <label
                          className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white transition-colors ${
                            isDragging
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                          }`}
                          onDragEnter={handleDragEnter}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          title="Click or drag to add reference image"
                        >
                          {savingAsReference ? (
                            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                          ) : (
                            <>
                              <Plus className="h-6 w-6 text-gray-400" />
                              <span className="mt-1 text-xs text-gray-400">Add</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleReferenceImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {patientReferenceImages.length === 0 && (
                        <p className="mt-3 text-xs text-gray-500">
                          No reference images yet. Upload an image to use as the starting frame.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Video Model Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Video Model</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm transition-colors hover:border-gray-300"
                >
                  <div>
                    <span className="font-medium text-gray-900">{currentModel?.displayName || selectedModel}</span>
                    <span className="ml-2 text-xs text-gray-500">{currentModel?.description}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showModelDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowModelDropdown(false)} />
                    <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {Object.entries(videoModels).map(([provider, models]) => (
                        <div key={provider}>
                          <div className="sticky top-0 border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            {provider}
                          </div>
                          {models.map(model => (
                            <button
                              key={model.modelId}
                              type="button"
                              onClick={() => {
                                setSelectedModel(model.modelId);
                                setShowModelDropdown(false);
                              }}
                              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                                model.modelId === selectedModel ? 'bg-purple-50' : ''
                              }`}
                            >
                              <div>
                                <span className="font-medium text-gray-900">{model.displayName}</span>
                                <span className="ml-2 text-xs text-gray-500">{model.description}</span>
                              </div>
                              {model.modelId === selectedModel && <Check className="h-4 w-4 text-purple-600" />}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Animation Prompt */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Animation Prompt *
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Gentle camera push-in, subtle movement, light rays slowly shifting..."
                className="h-24 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                maxLength={2000}
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Describe camera movement, motion, lighting changes</span>
                <span>
                  {prompt.length}
                  {' '}
                  / 2000
                </span>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Duration</label>
              <div className="grid grid-cols-2 gap-2">
                {VIDEO_DURATIONS.map(dur => (
                  <button
                    key={dur.id}
                    type="button"
                    onClick={() => setDuration(dur.id)}
                    className={`rounded-lg border-2 p-2.5 text-center transition-all ${
                      duration === dur.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{dur.label}</div>
                    <div className="text-xs text-gray-600">{dur.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Visual Style</label>
              <div className="grid grid-cols-2 gap-2">
                {VIDEO_STYLES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`rounded-lg border-2 p-2 text-left transition-all ${
                      style === s.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{s.label}</div>
                    <div className="text-xs text-gray-600">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Motion */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Motion Speed</label>
              <div className="grid grid-cols-3 gap-2">
                {MOTION_TYPES.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMotion(m.id)}
                    className={`rounded-lg border-2 p-2 text-center transition-all ${
                      motion === m.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{m.label}</div>
                    <div className="text-xs text-gray-600">{m.description}</div>
                  </button>
                ))}
              </div>
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
              disabled={!prompt.trim() || !selectedImage || isGenerating}
              variant="primary"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                  {' '}
                  {progress}
                  %
                </>
              ) : (
                <>
                  <Film className="mr-2 h-4 w-4" />
                  Generate Video (
                  {duration}
                  s)
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
                  Video generation typically takes 2-5 minutes...
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Preview</label>
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              {isGenerating ? (
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
              ) : generatedVideo ? (
                <video
                  src={generatedVideo}
                  controls
                  className="h-full w-full object-contain"
                >
                  Your browser does not support video playback.
                </video>
              ) : selectedImage ? (
                <img
                  src={selectedImage.imageUrl.startsWith('http') ? selectedImage.imageUrl : `/api/media/signed-url?path=${encodeURIComponent(selectedImage.imageUrl)}`}
                  alt="Selected reference"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="p-8 text-center">
                  <Film className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-600">No image selected</p>
                  <p className="text-xs text-gray-500">
                    Select a reference image to preview
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
