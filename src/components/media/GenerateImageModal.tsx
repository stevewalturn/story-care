'use client';

import type { PatientReferenceImage } from '@/models/Schema';
import { Check, Edit2, HelpCircle, Image as ImageIcon, Loader2, Plus, Save, Sparkles, Star, StarOff, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { getAvailableImageModels } from '@/libs/ModelMetadata';

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
  sessionId?: string; // For transcript page - to link images to session
  // Initial data support (for transcript page JSON actions)
  initialPrompt?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialSourceQuote?: string;
  initialStyle?: string;
};

// Atlas Cloud models from centralized metadata
const ATLAS_TEXT_TO_IMAGE_MODELS = [
  { id: 'flux-schnell', name: 'Flux Schnell', description: 'Fastest generation', supportsReference: false },
  { id: 'flux-dev', name: 'Flux Dev', description: 'High quality output', supportsReference: false },
];

const ATLAS_IMAGE_TO_IMAGE_MODELS = [
  { id: 'flux-redux-dev', name: 'Flux Redux Dev', description: 'Image-to-Image generation', supportsReference: true },
  { id: 'gemini-2.5-flash-image', name: 'Nano Banana', description: 'Gemini 2.5 Flash Image', supportsReference: true },
];

// Suppress unused import warning - kept for potential future use
void getAvailableImageModels;

export function GenerateImageModal({
  isOpen,
  onClose,
  onGenerate, // Keeping for backward compatibility but not used in batch mode
  patients = [],
  patientName,
  patientId,
  patientReferenceImage,
  sessionId,
  initialPrompt = '',
  initialTitle = '',
  initialDescription = '',
  initialSourceQuote = '',
  initialStyle = '',
}: GenerateImageModalProps) {
  // Suppress unused warnings - kept for backward compatibility
  void onGenerate;
  void patients;
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [sourceQuote, setSourceQuote] = useState(initialSourceQuote);
  const [style, setStyle] = useState(initialStyle);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [uploadedReferenceImage, setUploadedReferenceImage] = useState<string | null>(null);
  const [savingAsReference, setSavingAsReference] = useState(false);
  const [useReference, setUseReference] = useState(false); // Default to text-to-image

  // Get available models based on useReference toggle
  const availableModels = useReference ? ATLAS_IMAGE_TO_IMAGE_MODELS : ATLAS_TEXT_TO_IMAGE_MODELS;
  const [selectedModel, setSelectedModel] = useState(availableModels[0]?.id || 'flux-schnell');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reference images management
  const [referenceImages, setReferenceImages] = useState<PatientReferenceImage[]>([]);
  const [loadingReferenceImages, setLoadingReferenceImages] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelValue, setLabelValue] = useState('');
  const [selectedRefImageIds, setSelectedRefImageIds] = useState<string[]>([]); // Multi-select for reference images

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

  // Check if we have generated any images (determines layout)
  const hasGeneratedImages = generatedImages.length > 0 || generatingSlots.length > 0;

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

  // Switch model when useReference changes
  useEffect(() => {
    const models = useReference ? ATLAS_IMAGE_TO_IMAGE_MODELS : ATLAS_TEXT_TO_IMAGE_MODELS;
    // If current model is not in new list, switch to first available
    if (!models.find(m => m.id === selectedModel)) {
      setSelectedModel(models[0]?.id || 'flux-schnell');
    }
  }, [useReference, selectedModel]);

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
        const images = data.images || [];
        setReferenceImages(images);
        // Auto-select all reference images by default (user can deselect if needed)
        setSelectedRefImageIds(images.map((img: PatientReferenceImage) => img.id));
      } catch (err) {
        console.error('Error fetching reference images:', err);
      } finally {
        setLoadingReferenceImages(false);
      }
    };

    fetchReferenceImages();
  }, [isOpen, patientId, user]);

  // Handle saving uploaded image as reference
  const handleSaveAsReference = async () => {
    if (!uploadedReferenceImage || !patientId || savingAsReference) return;

    setSavingAsReference(true);
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
      const byteNumbers: number[] = new Array(byteCharacters.length);
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save reference image');
      }

      // Refresh reference images and clear the uploaded image (hides the save prompt)
      const data = await response.json();
      setReferenceImages(prev => [data.image, ...prev]);
      setUploadedReferenceImage(null); // Hide the "Save as reference" prompt
    } catch (err) {
      console.error('Error saving reference image:', err);
      alert(err instanceof Error ? err.message : 'Failed to save reference image');
    } finally {
      setSavingAsReference(false);
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
          'Authorization': `Bearer ${idToken}`,
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
        })),
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
          'Authorization': `Bearer ${idToken}`,
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
          img.id === imageId ? { ...img, label: labelValue } : img,
        ),
      );
      setEditingLabelId(null);
      setLabelValue('');
    } catch (err) {
      console.error('Error updating label:', err);
      alert(err instanceof Error ? err.message : 'Failed to update label');
    }
  };

  // Toggle reference image selection
  const toggleRefImageSelection = (imageId: string) => {
    setSelectedRefImageIds(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId],
    );
  };

  // Select/deselect all reference images
  const toggleAllRefImages = () => {
    if (selectedRefImageIds.length === referenceImages.length) {
      setSelectedRefImageIds([]); // Deselect all
    } else {
      setSelectedRefImageIds(referenceImages.map(img => img.id)); // Select all
    }
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

  // Optimize prompt with AI
  const handleOptimizePrompt = async () => {
    if (!prompt.trim()) return;

    setIsOptimizing(true);
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) throw new Error('Not authenticated');

      const response = await fetch('/api/ai/optimize-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ prompt, type: 'image' }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize prompt');
      }

      const data = await response.json();
      setPrompt(data.optimizedPrompt || prompt);
    } catch (err) {
      console.error('Error optimizing prompt:', err);
    } finally {
      setIsOptimizing(false);
    }
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
      // Build reference images array from selected images
      const selectedReferenceImages: string[] = [];

      // First priority: uploaded image
      if (uploadedReferenceImage) {
        selectedReferenceImages.push(uploadedReferenceImage);
      }

      // Second priority: selected patient reference images
      if (useReference && selectedRefImageIds.length > 0) {
        const selectedImages = referenceImages
          .filter(img => selectedRefImageIds.includes(img.id))
          .map(img => img.imageUrl);
        selectedReferenceImages.push(...selectedImages);
      } else if (useReference && patientReferenceImage) {
        // Fallback: legacy single reference image
        selectedReferenceImages.push(patientReferenceImage);
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
              'Authorization': `Bearer ${await user?.getIdToken()}`,
            },
            body: JSON.stringify({
              prompt,
              model: selectedModel,
              useReference,
              referenceImages: selectedReferenceImages.length > 0 ? selectedReferenceImages : undefined,
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
              prompt,
              model: selectedModel,
              index,
              saved: false,
              saving: false,
            };
            return newImages;
          });

          // Remove this slot from generating list
          setGeneratingSlots(prev => prev.filter(slot => slot !== index));

          return data;
        } catch (err: any) {
          console.error(`Error generating image ${index + 1}:`, err);
          // Remove this slot from generating list
          setGeneratingSlots(prev => prev.filter(slot => slot !== index));
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
    setGeneratedImages(prev =>
      prev.map(img =>
        img && img.index === image.index ? { ...img, saving: true } : img,
      ),
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
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          imageUrl: image.url,
          prompt: image.prompt,
          model: image.model,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          sourceQuote: sourceQuote.trim() || undefined,
          style: style.trim() || undefined,
          patientId: patientId || undefined,
          sessionId: sessionId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save image');
      }

      // Mark as saved
      setGeneratedImages(prev =>
        prev.map(img =>
          img && img.index === image.index ? { ...img, saved: true, saving: false } : img,
        ),
      );

      // Trigger media library refresh (if parent provides callback)
      // The parent component will handle this through onGenerate callback
    } catch (err: any) {
      console.error('Error saving image:', err);
      alert(err.message || 'Failed to save image');
      // Revert saving state
      setGeneratedImages(prev =>
        prev.map(img =>
          img.index === image.index ? { ...img, saving: false } : img,
        ),
      );
    }
  };

  const handleClose = () => {
    setPrompt('');
    setTitle('');
    setDescription('');
    setSourceQuote('');
    setStyle('');
    setUploadedReferenceImage(null);
    setUseReference(true);
    setError(null);
    setGeneratedImages([]);
    setGeneratingSlots([]);
    setShowModelDropdown(false);
    setSelectedRefImageIds([]); // Reset selected reference images
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  // Get current model info from available models
  const currentModel = availableModels.find(m => m.id === selectedModel) || availableModels[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={hasGeneratedImages ? '2xl' : 'lg'}
      hideHeader
      footer={(
        <div className="flex w-full items-center justify-between">
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {hasGeneratedImages ? 'Regenerate Images' : 'Generate Images'}
          </button>
        </div>
      )}
    >
      {/* Custom Header */}
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <ImageIcon className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Generate Image</h2>
        </div>
        <button
          onClick={handleClose}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className={`grid gap-6 ${hasGeneratedImages ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* Left Column - Form */}
        <div className="space-y-5">
          {/* Reference Image Section */}
          <div className={`space-y-3 ${isGenerating ? 'opacity-50' : ''}`}>
            {/* Reference Image Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Reference Image</span>
                <HelpCircle className="h-4 w-4 text-gray-400" />
              </div>
              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Use Reference</span>
                <button
                  onClick={() => !isGenerating && setUseReference(!useReference)}
                  disabled={isGenerating}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
                    useReference ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useReference ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Reference Images Section - Always visible when toggle is ON */}
            {useReference && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                {patientId && patientName ? (
                  <>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Active Patient Reference</span>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {patientName}
                      </span>
                    </div>
                    <p className="mb-3 text-xs text-gray-500">
                      This patient reference image will be used for visual consistency.
                    </p>

                    {loadingReferenceImages ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading reference images...
                      </div>
                    ) : (
                      <>
                        {/* Select All / Deselect All toggle */}
                        {referenceImages.length > 0 && (
                          <div className="mb-2 flex items-center gap-2">
                            <button
                              onClick={toggleAllRefImages}
                              className="text-xs text-purple-600 hover:text-purple-700"
                            >
                              {selectedRefImageIds.length === referenceImages.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <span className="text-xs text-gray-500">
                              (
                              {selectedRefImageIds.length}
                              {' '}
                              of
                              {' '}
                              {referenceImages.length}
                              {' '}
                              selected)
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {referenceImages.map(img => (
                            <div
                              key={img.id}
                              className="group relative cursor-pointer"
                              onClick={() => toggleRefImageSelection(img.id)}
                            >
                              <img
                                src={img.imageUrl.startsWith('http') ? img.imageUrl : `/api/media/signed-url?path=${encodeURIComponent(img.imageUrl)}`}
                                alt={img.label || 'Reference'}
                                className={`h-16 w-16 rounded-lg border-2 object-cover transition-all ${
                                  selectedRefImageIds.includes(img.id)
                                    ? 'border-purple-500 ring-2 ring-purple-300'
                                    : 'border-gray-200 opacity-60'
                                }`}
                              />
                              {/* Selection checkbox indicator */}
                              <div
                                className={`absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                  selectedRefImageIds.includes(img.id)
                                    ? 'border-purple-500 bg-purple-500'
                                    : 'border-gray-300 bg-white'
                                }`}
                              >
                                {selectedRefImageIds.includes(img.id) && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              {/* Primary indicator */}
                              {img.isPrimary && (
                                <div className="absolute -top-1 -right-1 rounded-full bg-purple-500 p-0.5">
                                  <Star className="h-2.5 w-2.5 fill-white text-white" />
                                </div>
                              )}
                              {/* Action buttons on hover */}
                              <div
                                className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={e => e.stopPropagation()} // Prevent toggle when clicking actions
                              >
                                {!img.isPrimary && (
                                  <button
                                    onClick={() => handleSetPrimary(img.id)}
                                    className="rounded-full bg-white p-1 hover:bg-gray-100"
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
                                  className="rounded-full bg-white p-1 hover:bg-gray-100"
                                  title="Edit label"
                                >
                                  <Edit2 className="h-3 w-3 text-gray-700" />
                                </button>
                                <button
                                  onClick={() => handleDeleteReference(img.id)}
                                  className="rounded-full bg-white p-1 hover:bg-gray-100"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Upload new reference image button */}
                          <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white transition-colors hover:border-purple-400">
                            <Plus className="h-6 w-6 text-gray-400" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleReferenceImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </>
                    )}

                    {/* Show "Save as Reference" button for uploaded images */}
                    {uploadedReferenceImage && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 p-2">
                        <img src={uploadedReferenceImage} alt="Uploaded" className="h-10 w-10 rounded object-cover" />
                        <p className="flex-1 text-xs text-blue-700">
                          Save this as a reference for
                          {' '}
                          {patientName}
                          ?
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleSaveAsReference}
                          disabled={savingAsReference}
                          className="flex items-center gap-1"
                        >
                          {savingAsReference ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3" />
                              Save
                            </>
                          )}
                        </Button>
                        <button
                          onClick={() => setUploadedReferenceImage(null)}
                          disabled={savingAsReference}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Label editing modal */}
                    {editingLabelId && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={labelValue}
                          onChange={e => setLabelValue(e.target.value)}
                          placeholder="Enter label"
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateLabel(editingLabelId)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingLabelId(null);
                            setLabelValue('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* No patient context - show upload only */}
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Upload Reference Image</span>
                    </div>
                    <p className="mb-3 text-xs text-gray-500">
                      Upload an image to use as a reference for image-to-image generation.
                    </p>

                    {uploadedReferenceImage ? (
                      <div className="flex items-center gap-3">
                        <img src={uploadedReferenceImage} alt="Uploaded" className="h-20 w-20 rounded-lg border-2 border-purple-500 object-cover" />
                        <button
                          onClick={() => setUploadedReferenceImage(null)}
                          className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-20 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white transition-colors hover:border-purple-400">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Plus className="h-5 w-5" />
                          <span className="text-sm">Click to upload reference image</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReferenceImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Image Name */}
          <div className={isGenerating ? 'opacity-50' : ''}>
            <label className="mb-2 block text-sm font-medium text-gray-700">Image name</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give this image a name..."
              disabled={isGenerating}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </div>

          {/* Model Dropdown */}
          <div className={isGenerating ? 'opacity-50' : ''}>
            <label className="mb-2 block text-sm font-medium text-gray-700">Model</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => !isGenerating && setShowModelDropdown(!showModelDropdown)}
                disabled={isGenerating}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <div>
                  <span className="font-medium text-gray-900">{currentModel?.name}</span>
                  <span className="ml-2 text-gray-500">
                    -
                    {currentModel?.description}
                  </span>
                </div>
                <svg className={`h-5 w-5 text-gray-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showModelDropdown && (
                <div className="absolute top-full right-0 left-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {availableModels.map(model => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-gray-50 ${
                        selectedModel === model.id ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div>
                        <span className="font-medium text-gray-900">{model.name}</span>
                        <span className="ml-2 text-gray-500">
                          -
                          {model.description}
                        </span>
                      </div>
                      {selectedModel === model.id && (
                        <Check className="h-4 w-4 text-purple-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prompt with Optimize button */}
          <div className={isGenerating ? 'opacity-50' : ''}>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Prompt</label>
              <button
                type="button"
                onClick={handleOptimizePrompt}
                disabled={!prompt.trim() || isOptimizing || isGenerating}
                className="flex items-center gap-1 text-sm text-purple-600 transition-colors hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isOptimizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Optimize
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={4}
              disabled={isGenerating}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </div>

          {/* Source Quote (Display only if provided) */}
          {sourceQuote && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
              <p className="mb-1 text-xs font-medium text-purple-700">Source Quote</p>
              <p className="text-sm text-purple-900 italic">
                "
                {sourceQuote}
                "
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Right Column - Generated Variations (only shown after generation) */}
        {hasGeneratedImages && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Generated Variations</h4>
              <p className="mt-1 text-xs text-gray-500">
                Each variation uses a different seed for unique results
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((slotIndex) => {
                const image = generatedImages.find(img => img && img.index === slotIndex);
                const isGeneratingSlot = generatingSlots.includes(slotIndex);

                return (
                  <div
                    key={slotIndex}
                    className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-gray-200 bg-gray-50"
                  >
                    {isGeneratingSlot ? (
                      // Loading state
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-purple-600" />
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
                        <div className="absolute right-2 bottom-2">
                          <button
                            onClick={() => handleSaveImage(image)}
                            disabled={image.saved || image.saving}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium shadow-lg transition-all ${
                              image.saved
                                ? 'bg-green-500 text-white'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            } disabled:cursor-not-allowed`}
                          >
                            {image.saved ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Saved
                              </>
                            ) : image.saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="h-3.5 w-3.5" />
                                Save
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      // Empty slot
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                          <p className="text-xs text-gray-400">
                            Variation
                            {slotIndex + 1}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
