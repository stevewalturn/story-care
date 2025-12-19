'use client';

import { Check, Edit2, Image as ImageIcon, Loader2, Save, Star, StarOff, Trash2, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { getAvailableImageModels } from '@/libs/ModelMetadata';
import type { PatientReferenceImage } from '@/models/Schema';

type Patient = {
  id: string;
  name: string;
  avatarUrl?: string;
  referenceImageUrl?: string; // For AI generation (priority)
};

type GenerateImageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    prompt: string,
    model: string,
    useReference: boolean,
    referenceImage?: string,
    metadata?: {
      title?: string;
      description?: string;
      sourceQuote?: string;
      style?: string;
    },
  ) => Promise<void> | void;
  patients?: Patient[];
  patientName?: string; // For transcript page
  patientId?: string; // For transcript page - to fetch reference images
  patientReferenceImage?: string; // For transcript page
  // Initial data support (for transcript page JSON actions)
  initialPrompt?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialSourceQuote?: string;
  initialStyle?: string;
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

export function GenerateImageModal({
  isOpen,
  onClose,
  onGenerate, // Keeping for backward compatibility but not used in batch mode
  patients = [],
  patientName,
  patientId,
  patientReferenceImage,
  initialPrompt = '',
  initialTitle = '',
  initialDescription = '',
  initialSourceQuote = '',
  initialStyle = '',
}: GenerateImageModalProps) {
  // Suppress unused warning - onGenerate kept for backward compatibility
  void onGenerate;
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [sourceQuote, setSourceQuote] = useState(initialSourceQuote);
  const [style, setStyle] = useState(initialStyle);
  const [selectedModel, setSelectedModel] = useState('flux-schnell'); // Atlas Cloud default
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [uploadedReferenceImage, setUploadedReferenceImage] = useState<string | null>(null); // Base64 or URL
  const [useReference, setUseReference] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reference images management
  const [referenceImages, setReferenceImages] = useState<PatientReferenceImage[]>([]);
  const [loadingReferenceImages, setLoadingReferenceImages] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelValue, setLabelValue] = useState('');

  // Batch generation state (4 variations)
  type GeneratedImage = {
    url: string;
    prompt: string;
    model: string;
    index: number;
    saved: boolean;
    saving: boolean;
  };
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generatingSlots, setGeneratingSlots] = useState<number[]>([]);

  // Update state when initial props change (when modal opens with new data from JSON actions)
  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt);
      setTitle(initialTitle);
      setDescription(initialDescription);
      setSourceQuote(initialSourceQuote);
      setStyle(initialStyle);
    }
  }, [isOpen, initialPrompt, initialTitle, initialDescription, initialSourceQuote, initialStyle]);

  // Fetch reference images for the patient (transcript page)
  useEffect(() => {
    const fetchReferenceImages = async () => {
      if (!isOpen || !patientId) {
        setReferenceImages([]);
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

        if (!response.ok) {
          throw new Error('Failed to fetch reference images');
        }

        const data = await response.json();
        setReferenceImages(data.images || []);
      } catch (err) {
        console.error('Error fetching reference images:', err);
      } finally {
        setLoadingReferenceImages(false);
      }
    };

    fetchReferenceImages();
  }, [isOpen, patientId, user]);

  // Auto-switch model when reference image availability changes
  useEffect(() => {
    if (!isOpen) return;

    // Find the currently selected model in the metadata
    const currentModel = Object.values(IMAGE_MODELS)
      .flat()
      .find(m => m.id === selectedModel);

    if (!currentModel) return;

    const hasRef = !!(uploadedReferenceImage || (useReference && (patientReferenceImage || (selectedPatients.length > 0 && patients.find(p => p.id === selectedPatients[0])?.referenceImageUrl))));

    // If current model requires reference but there's no reference, switch to first non-reference model
    if (currentModel.supportsReference === true && !hasRef) {
      const firstTextToImageModel = Object.values(IMAGE_MODELS)
        .flat()
        .find(m => m.supportsReference !== true);

      if (firstTextToImageModel) {
        console.log('[GenerateImageModal] Auto-switching from image-to-image model to text-to-image model:', firstTextToImageModel.id);
        setSelectedModel(firstTextToImageModel.id);
      }
    }
  }, [isOpen, uploadedReferenceImage, useReference, patientReferenceImage, selectedPatients, patients, selectedModel]);

  // Handle saving uploaded image as reference
  const handleSaveAsReference = async () => {
    if (!uploadedReferenceImage || !patientId) return;

    try {
      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // Convert base64 data URL to blob
      const matches = uploadedReferenceImage.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches || !matches[1] || !matches[2]) {
        throw new Error('Invalid image format');
      }
      const contentType = matches[1];
      const base64Data = matches[2];

      // Decode base64 to binary
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });

      // Create file from blob
      const file = new File([blob], 'reference-image.png', { type: contentType });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('isPrimary', referenceImages.length === 0 ? 'true' : 'false');
      formData.append('label', 'From image generation');

      const response = await fetch(`/api/patients/${patientId}/reference-images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save reference image');
      }

      // Refresh reference images
      const data = await response.json();
      setReferenceImages(prev => [data.image, ...prev]);
      alert('Reference image saved successfully!');
    } catch (err) {
      console.error('Error saving reference image:', err);
      alert(err instanceof Error ? err.message : 'Failed to save reference image');
    }
  };

  // Handle setting primary reference
  const handleSetPrimary = async (imageId: string) => {
    if (!patientId) return;

    try {
      const idToken = await user?.getIdToken();
      if (!idToken) return;

      const response = await fetch(`/api/patients/${patientId}/reference-images/${imageId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'set_primary' }),
      });

      if (!response.ok) {
        throw new Error('Failed to set primary image');
      }

      // Update local state
      setReferenceImages(prev =>
        prev.map(img => ({
          ...img,
          isPrimary: img.id === imageId,
        }))
      );
    } catch (err) {
      console.error('Error setting primary image:', err);
      alert(err instanceof Error ? err.message : 'Failed to set primary image');
    }
  };

  // Handle deleting reference
  const handleDeleteReference = async (imageId: string) => {
    if (!patientId) return;
    if (!confirm('Are you sure you want to delete this reference image?')) {
      return;
    }

    try {
      const idToken = await user?.getIdToken();
      if (!idToken) return;

      const response = await fetch(`/api/patients/${patientId}/reference-images/${imageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Update local state
      setReferenceImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      console.error('Error deleting image:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  // Handle updating label
  const handleUpdateLabel = async (imageId: string) => {
    if (!patientId) return;

    try {
      const idToken = await user?.getIdToken();
      if (!idToken) return;

      const response = await fetch(`/api/patients/${patientId}/reference-images/${imageId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'update_label', label: labelValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update label');
      }

      // Update local state
      setReferenceImages(prev =>
        prev.map(img =>
          img.id === imageId ? { ...img, label: labelValue } : img
        )
      );
      setEditingLabelId(null);
      setLabelValue('');
    } catch (err) {
      console.error('Error updating label:', err);
      alert(err instanceof Error ? err.message : 'Failed to update label');
    }
  };

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

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
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
  const patientImageUrl = selectedPatientWithAvatar?.referenceImageUrl
    || selectedPatientWithAvatar?.avatarUrl
    || patientReferenceImage; // For transcript page

  // Force image-to-image mode when any reference image exists (regardless of toggle)
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
    setGeneratedImages([]); // Clear previous results
    setGeneratingSlots([0, 1, 2, 3]); // All 4 slots are generating

    try {
      const enhancedPrompt = enhancePromptWithPatients(prompt);

      // Get reference image (priority: uploaded > selected patient > transcript page patient)
      let referenceImage: string | undefined;
      if (uploadedReferenceImage) {
        referenceImage = uploadedReferenceImage;
      } else if (selectedPatients.length > 0) {
        const firstPatient = patients.find(p => p.id === selectedPatients[0]);
        // Check both referenceImageUrl (priority) and avatarUrl (fallback)
        referenceImage = firstPatient?.referenceImageUrl || firstPatient?.avatarUrl;
      } else if (useReference && patientReferenceImage) {
        // Use transcript page patient reference image
        referenceImage = patientReferenceImage;
      }

      // Generate 4 variations in parallel with different seeds for variety
      const generatePromises = Array.from({ length: 4 }, async (_, index) => {
        try {
          // Use different random seeds for each variation to ensure variety
          const randomSeed = Math.floor(Math.random() * 1000000);

          // Call the parent's generate function which handles API call
          const result = await fetch('/api/ai/generate-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await user?.getIdToken()}`,
            },
            body: JSON.stringify({
              prompt: enhancedPrompt,
              model: selectedModel,
              useReference,
              referenceImage,
              title: title.trim() || undefined,
              description: description.trim() || undefined,
              sourceQuote: sourceQuote.trim() || undefined,
              style: style.trim() || undefined,
              seed: randomSeed, // Different seed for each variation
              skipSave: true, // Don't auto-save, we'll save individually
            }),
          });

          if (!result.ok) {
            throw new Error(`Generation ${index + 1} failed`);
          }

          const data = await result.json();

          // Update this slot's result
          setGeneratedImages((prev) => {
            const newImages = [...prev];
            newImages[index] = {
              url: data.imageUrl,
              prompt: enhancedPrompt,
              model: selectedModel,
              index,
              saved: false,
              saving: false,
            };
            return newImages;
          });

          // Remove this slot from generating list
          setGeneratingSlots((prev) => prev.filter(slot => slot !== index));

          return data;
        } catch (err: any) {
          console.error(`Error generating image ${index + 1}:`, err);
          // Remove this slot from generating list
          setGeneratingSlots((prev) => prev.filter(slot => slot !== index));
          return null;
        }
      });

      // Wait for all 4 generations to complete (or fail)
      await Promise.all(generatePromises);

      // DON'T close modal - let user review and save
    } catch (err: any) {
      setError(err.message || 'Failed to generate images');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle saving individual generated image to media library
  const handleSaveImage = async (image: GeneratedImage) => {
    if (image.saved || image.saving) return;

    // Mark as saving
    setGeneratedImages((prev) =>
      prev.map((img) =>
        img && img.index === image.index ? { ...img, saving: true } : img
      )
    );

    try {
      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/ai/generated-image/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          imageUrl: image.url,
          prompt: image.prompt,
          model: image.model,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          sourceQuote: sourceQuote.trim() || undefined,
          style: style.trim() || undefined,
          patientId: patientId || (selectedPatients.length > 0 ? selectedPatients[0] : undefined),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save image');
      }

      // Mark as saved
      setGeneratedImages((prev) =>
        prev.map((img) =>
          img && img.index === image.index ? { ...img, saved: true, saving: false } : img
        )
      );

      // Trigger media library refresh (if parent provides callback)
      // The parent component will handle this through onGenerate callback
    } catch (err: any) {
      console.error('Error saving image:', err);
      alert(err.message || 'Failed to save image');
      // Revert saving state
      setGeneratedImages((prev) =>
        prev.map((img) =>
          img.index === image.index ? { ...img, saving: false } : img
        )
      );
    }
  };

  const handleClose = () => {
    setPrompt('');
    setTitle('');
    setDescription('');
    setSourceQuote('');
    setStyle('');
    setSelectedPatients([]);
    setUploadedReferenceImage(null);
    setUseReference(true);
    setError(null);
    setGeneratedImages([]);
    setGeneratingSlots([]);
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Generate Image"
      description="Transform symbolic prompts into visual imagery"
      size="2xl"
      footer={(
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            isLoading={isGenerating}
          >
            {isGenerating ? 'Generating 4 Variations...' : 'Generate 4 Variations'}
          </Button>
        </>
      )}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          {/* AI Model */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              AI Model
              {hasReferenceImage && (
                <span className="ml-2 text-xs text-indigo-600">(Using reference image - only image-to-image models shown)</span>
              )}
              {!hasReferenceImage && (
                <span className="ml-2 text-xs text-gray-500">(Image-to-image models hidden - add reference image to enable)</span>
              )}
            </label>
            <div className="max-h-64 space-y-4 overflow-y-auto rounded-lg border border-gray-200 p-3">
              {Object.entries(IMAGE_MODELS).map(([provider, models]) => {
                // Filter models based on reference image availability
                const filteredModels = hasReferenceImage
                  ? models.filter(m => m.supportsReference === true)  // Show only image-to-image models when reference exists
                  : models.filter(m => m.supportsReference !== true); // Hide image-to-image models when no reference

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

          {/* Prompt */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Prompt *
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="h-32 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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

          {/* Title (Optional) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give this image a title..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the therapeutic purpose or meaning..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Source Quote (Display only if provided) */}
          {sourceQuote && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Source Quote</label>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <p className="text-sm text-blue-900 italic">
                  "
                  {sourceQuote}
                  "
                </p>
              </div>
            </div>
          )}

          {/* Style (Display only if provided) */}
          {style && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Style</label>
              <input
                type="text"
                value={style}
                onChange={e => setStyle(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Reference Image Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Reference Image (Optional)
              </label>
              {/* Only show toggle when NO reference images exist */}
              {!hasReferenceImage && (
                <label className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Use Reference</span>
                  <button
                    onClick={() => setUseReference(!useReference)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      useReference ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        useReference ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              )}
            </div>

            {/* Show "Save as Reference" button for uploaded images */}
            {uploadedReferenceImage && patientId && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-2">
                <p className="flex-1 text-xs text-blue-700">
                  Want to save this as a reference image for {patientName}?
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveAsReference}
                  className="flex items-center gap-1"
                >
                  <Save className="h-3 w-3" />
                  Save
                </Button>
              </div>
            )}

            <p className="text-xs text-gray-600">
              {uploadedReferenceImage
                ? 'Using uploaded reference image'
                : patientImageUrl
                  ? `Using ${patientName || selectedPatientWithAvatar?.name || 'patient'}'s reference image`
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
                : patientImageUrl && useReference
                  ? (
                      <div className="relative">
                        <img
                          src={patientImageUrl}
                          alt="Patient reference"
                          className="h-32 w-full rounded-lg object-cover"
                        />
                        <div className="absolute bottom-2 left-2 rounded-md bg-black bg-opacity-70 px-2 py-1 text-xs text-white">
                          {patientName || selectedPatientWithAvatar?.name || 'Patient'}
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
            {!uploadedReferenceImage && patientImageUrl && useReference && (
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

            {/* Active Patient Reference Images (when on transcript page) */}
            {patientId && patientName && (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    {patientName}'s Reference Images
                  </h4>
                  {loadingReferenceImages && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>

                {referenceImages.length === 0 && !loadingReferenceImages ? (
                  <p className="text-xs text-gray-500">
                    No reference images yet. Upload an image above and save it as a reference.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {referenceImages.map((img) => (
                      <div key={img.id} className="group relative">
                        <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
                          <img
                            src={img.imageUrl.startsWith('http') ? img.imageUrl : `/api/media/signed-url?path=${encodeURIComponent(img.imageUrl)}`}
                            alt={img.label || 'Reference'}
                            className="size-full object-cover"
                          />
                          {img.isPrimary && (
                            <div className="absolute left-1 top-1 rounded-full bg-yellow-400 p-1">
                              <Star className="h-2 w-2 fill-white text-white" />
                            </div>
                          )}
                          {/* Action buttons on hover */}
                          <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            {!img.isPrimary && (
                              <button
                                onClick={() => handleSetPrimary(img.id)}
                                className="rounded-full bg-white p-1.5 hover:bg-gray-100"
                                title="Set as primary"
                              >
                                <StarOff className="h-3 w-3 text-gray-700" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingLabelId(img.id);
                                setLabelValue(img.label || '');
                              }}
                              className="rounded-full bg-white p-1.5 hover:bg-gray-100"
                              title="Edit label"
                            >
                              <Edit2 className="h-3 w-3 text-gray-700" />
                            </button>
                            <button
                              onClick={() => handleDeleteReference(img.id)}
                              className="rounded-full bg-white p-1.5 hover:bg-gray-100"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </button>
                          </div>
                        </div>
                        {/* Label editing */}
                        {editingLabelId === img.id ? (
                          <div className="mt-1 flex gap-1">
                            <input
                              type="text"
                              value={labelValue}
                              onChange={(e) => setLabelValue(e.target.value)}
                              placeholder="Label"
                              className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdateLabel(img.id)}
                              className="px-2 py-1 text-xs"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <p className="mt-1 truncate text-xs text-gray-600">
                            {img.label || 'Untitled'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reference Patients (Only show if patients array provided - Assets page) */}
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

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Right Column - 4 Variations Grid */}
        <div className="space-y-4">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Generated Variations
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Each variation uses a different seed for unique results
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((slotIndex) => {
              const image = generatedImages.find(img => img && img.index === slotIndex);
              const isGenerating = generatingSlots.includes(slotIndex);

              return (
                <div key={slotIndex} className="relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
                  {isGenerating ? (
                    // Loading state
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-indigo-600" />
                        <p className="text-xs text-gray-600">Generating...</p>
                      </div>
                    </div>
                  ) : image ? (
                    // Image generated
                    <>
                      <img
                        src={image.url}
                        alt={`Variation ${slotIndex + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {/* Save button overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <Button
                          size="sm"
                          variant={image.saved ? 'secondary' : 'primary'}
                          onClick={() => handleSaveImage(image)}
                          disabled={image.saved || image.saving}
                          isLoading={image.saving}
                          className="w-full"
                        >
                          {image.saved ? (
                            <>
                              <Check className="mr-1 h-3 w-3" />
                              Saved
                            </>
                          ) : image.saving ? (
                            'Saving...'
                          ) : (
                            <>
                              <Save className="mr-1 h-3 w-3" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    // Empty slot
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-xs text-gray-400">Variation {slotIndex + 1}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {generatedImages.length === 0 && generatingSlots.length === 0 && (
            <p className="text-center text-xs text-gray-500">
              Click "Generate 4 Variations" to create different versions with varying seeds. Review all variations and save your favorites to the media library.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
