'use client';

import { Check, Image as ImageIcon, Loader2, Sparkles, User, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getAvailableImageModels } from '@/libs/ModelMetadata';
import { authenticatedPost } from '@/utils/AuthenticatedFetch';

type Patient = {
  id: string;
  name: string;
  avatarUrl?: string;
  referenceImageUrl?: string; // For AI generation (priority)
};

type GenerateImageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (imageUrl: string, prompt: string) => void;
  patients?: Patient[];
  user: any;
  patientId?: string; // Current patient ID (for assets page)
};

// Get models from centralized metadata (Atlas models appear first)
const IMAGE_MODELS_RAW = getAvailableImageModels();

// Convert to UI format with descriptions (keep supportsReference flag)
const IMAGE_MODELS = Object.entries(IMAGE_MODELS_RAW).reduce(
  (acc, [provider, models]) => {
    acc[provider] = models.map(m => ({
      id: m.value,
      name: m.label,
      description: m.label.includes('$') ? m.label : `${m.label} - High quality generation`,
      maxLength: 10000,
      supportsReference: m.supportsReference,
    }));
    return acc;
  },
  {} as Record<string, Array<{ id: string; name: string; description: string; maxLength: number; supportsReference: boolean }>>,
);

const IMAGE_SIZES = [
  { id: '1024x1024', label: 'Square (1024x1024)', ratio: '1:1' },
  { id: '1792x1024', label: 'Landscape (1792x1024)', ratio: '16:9' },
  { id: '1024x1792', label: 'Portrait (1024x1792)', ratio: '9:16' },
];

const IMAGE_STYLES = [
  { id: 'vivid', label: 'Vivid', description: 'Hyper-real and dramatic' },
  { id: 'natural', label: 'Natural', description: 'More natural, less hyper-real' },
];

export function GenerateImageModal({
  isOpen,
  onClose,
  onGenerate,
  patients = [],
  user,
  patientId,
}: GenerateImageModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('flux-schnell'); // Atlas Cloud default
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [selectedStyle, setSelectedStyle] = useState('vivid');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [uploadedReferenceImage, setUploadedReferenceImage] = useState<string | null>(null); // Base64 or URL
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePatientToggle = (patientId: string) => {
    setSelectedPatients(prev =>
      prev.includes(patientId)
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId],
    );
  };

  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedReferenceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Check if we have an actual reference image source (uploaded OR patient with image)
  const selectedPatientWithAvatar = selectedPatients.length > 0
    ? patients.find(p => p.id === selectedPatients[0])
    : null;

  // Check BOTH referenceImageUrl (priority) and avatarUrl (fallback)
  const patientImageUrl = selectedPatientWithAvatar?.referenceImageUrl || selectedPatientWithAvatar?.avatarUrl;

  const hasReferenceImage = uploadedReferenceImage !== null || !!patientImageUrl;

  const enhancePromptWithPatients = (basePrompt: string) => {
    if (selectedPatients.length === 0) {
      return basePrompt;
    }

    const patientNames = selectedPatients
      .map(id => patients.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    return `${basePrompt}\n\nInclude character representations for: ${patientNames}. Use their reference images for consistent character appearance.`;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const enhancedPrompt = enhancePromptWithPatients(prompt);

      // Get reference image (from upload or first selected patient)
      let referenceImage: string | undefined;
      if (uploadedReferenceImage) {
        referenceImage = uploadedReferenceImage;
      } else if (selectedPatients.length > 0) {
        const firstPatient = patients.find(p => p.id === selectedPatients[0]);
        // Check both referenceImageUrl (priority) and avatarUrl (fallback)
        referenceImage = firstPatient?.referenceImageUrl || firstPatient?.avatarUrl;
      }

      const response = await authenticatedPost('/api/ai/generate-image', user, {
        prompt: enhancedPrompt,
        model: selectedModel,
        size: selectedSize,
        style: selectedStyle,
        patientId, // Pass the current patient ID
        patientIds: selectedPatients, // Also pass selected patients for reference
        referenceImage, // Pass reference image to API
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      console.log('[GenerateImageModal] Received image data:', {
        hasMedia: !!data.media,
        mediaUrlPreview: data.media?.mediaUrl ? `${data.media.mediaUrl.substring(0, 100)}...` : null,
        isPresigned: data.media?.mediaUrl ? (data.media.mediaUrl.includes('X-Goog-Signature') || data.media.mediaUrl.includes('GoogleAccessId')) : false,
      });

      // API returns media object with mediaUrl
      setGeneratedImage(data.media?.mediaUrl || null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (generatedImage) {
      onGenerate(generatedImage, prompt);
      handleClose();
    }
  };

  const handleClose = () => {
    setPrompt('');
    setSelectedPatients([]);
    setUploadedReferenceImage(null);
    setGeneratedImage(null);
    setError(null);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  // Find current model from any provider
  const getCurrentModel = () => {
    for (const provider of Object.values(IMAGE_MODELS)) {
      const model = provider.find(m => m.id === selectedModel);
      if (model) {
        return model;
      }
    }
    return null;
  };

  const currentModel = getCurrentModel();

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Generate Image</h2>
              <p className="text-sm text-gray-600">Create AI-generated images for your stories</p>
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
                Describe Your Image *
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="A serene beach at sunset with gentle waves..."
                className="h-32 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                maxLength={currentModel?.maxLength}
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Be specific and detailed for best results</span>
                <span>
                  {prompt.length}
                  {' '}
                  /
                  {currentModel?.maxLength}
                </span>
              </div>
            </div>

            {/* Reference Image Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Reference Image (Optional)
              </label>
              <p className="text-xs text-gray-600">
                {uploadedReferenceImage
                  ? 'Using uploaded reference image'
                  : patientImageUrl
                    ? `Using ${selectedPatientWithAvatar?.name}'s image`
                    : 'Upload a reference image for image-to-image generation'}
              </p>
              <div className="relative">
                {uploadedReferenceImage
                  ? (
                      <div className="relative">
                        <img
                          src={uploadedReferenceImage}
                          alt="Reference"
                          className="h-32 w-full rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadedReferenceImage(null)}
                          className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  : patientImageUrl
                    ? (
                        <div className="relative">
                          <img
                            src={patientImageUrl}
                            alt={`${selectedPatientWithAvatar!.name}'s reference`}
                            className="h-32 w-full rounded-lg object-cover"
                          />
                          <div className="absolute bottom-2 left-2 rounded-md bg-black bg-opacity-70 px-2 py-1 text-xs text-white">
                            {selectedPatientWithAvatar!.name}
                          </div>
                        </div>
                      )
                    : (
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-indigo-500">
                          <ImageIcon className="mb-2 h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-600">Click to upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleReferenceImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
              </div>
              {/* Show upload option even when patient is selected */}
              {!uploadedReferenceImage && patientImageUrl && (
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-indigo-500 hover:bg-gray-50">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  <span>Or upload a different reference image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Reference Patients */}
            {patients.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Include Patients (Optional)
                </label>
                <p className="text-xs text-gray-600">
                  Select patients to include their likeness in the generated image
                </p>
                <div className="grid max-h-32 grid-cols-2 gap-2 overflow-y-auto">
                  {patients.map(patient => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handlePatientToggle(patient.id)}
                      className={`flex items-center gap-2 rounded-lg border-2 p-2 transition-all ${
                        selectedPatients.includes(patient.id)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {patient.referenceImageUrl || patient.avatarUrl
                        ? (
                            <img
                              src={patient.referenceImageUrl || patient.avatarUrl}
                              alt={patient.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          )
                        : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                          )}
                      <span className="flex-1 truncate text-left text-sm font-medium text-gray-900">
                        {patient.name}
                      </span>
                      {selectedPatients.includes(patient.id) && (
                        <Check className="h-4 w-4 text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
                {/* Show warning if patient selected but no image */}
                {selectedPatients.length > 0 && !patientImageUrl && (
                  <div className="rounded-md bg-yellow-50 p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> This patient doesn't have a reference image set. Image-to-image models won't be available. Please upload a reference image above or select a patient with an avatar.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Model Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                AI Model
                {hasReferenceImage && (
                  <span className="ml-2 text-xs text-indigo-600">(Showing image-to-image models only)</span>
                )}
              </label>
              <div className="max-h-96 space-y-4 overflow-y-auto rounded-lg border border-gray-200 p-3">
                {Object.entries(IMAGE_MODELS).map(([provider, models]) => {
                  // Filter models based on reference image
                  const filteredModels = hasReferenceImage
                    ? models.filter(m => m.supportsReference === true)
                    : models;

                  // Skip provider if no models match
                  if (filteredModels.length === 0) {
                    return null;
                  }

                  return (
                    <div key={provider} className="space-y-2">
                      <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        {provider}
                      </div>
                      <div className="space-y-2">
                        {filteredModels.map(model => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => setSelectedModel(model.id)}
                          className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                            selectedModel === model.id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-gray-900">{model.name}</div>
                          <div className="text-xs text-gray-600">{model.description}</div>
                        </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Size Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Image Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {IMAGE_SIZES.map(size => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSize(size.id)}
                    className={`rounded-lg border-2 p-3 text-center transition-all ${
                      selectedSize === size.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{size.ratio}</div>
                    <div className="mt-1 text-xs text-gray-600">{size.label.split(' ')[0]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selection */}
            {selectedModel === 'dall-e-3' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Image Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {IMAGE_STYLES.map(style => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      className={`rounded-lg border-2 p-3 text-left transition-all ${
                        selectedStyle === style.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{style.label}</div>
                      <div className="text-xs text-gray-600">{style.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                    </>
                  )
                : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
            </Button>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Preview
            </label>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              {isGenerating
                ? (
                    <div className="text-center">
                      <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-600" />
                      <p className="text-sm text-gray-600">Generating your image...</p>
                      <p className="mt-2 text-xs text-gray-500">This may take 10-30 seconds</p>
                    </div>
                  )
                : generatedImage
                  ? (
                      <img
                        src={generatedImage}
                        alt="Generated"
                        className="h-full w-full object-contain"
                      />
                    )
                  : (
                      <div className="p-8 text-center">
                        <ImageIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-600">No image generated yet</p>
                        <p className="text-xs text-gray-500">
                          Configure your settings and click Generate
                        </p>
                      </div>
                    )}
            </div>

            {generatedImage && (
              <div className="space-y-3">
                <Button onClick={handleSave} variant="primary" className="w-full">
                  <Check className="mr-2 h-4 w-4" />
                  Save to Library
                </Button>
                <Button
                  onClick={() => setGeneratedImage(null)}
                  variant="ghost"
                  className="w-full"
                >
                  Generate Another
                </Button>
                <Button
                  onClick={handleClose}
                  variant="secondary"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
