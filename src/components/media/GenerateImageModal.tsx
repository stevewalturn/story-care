'use client';

import type { PatientReferenceImage } from '@/models/Schema';
import { Check, Edit2, HelpCircle, Image as ImageIcon, Info, Loader2, Plus, Save, Sparkles, Star, StarOff, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { getAllImageModelsFlat, getFilteredImageModels } from '@/libs/ModelMetadata';

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

// Get all available models from centralized metadata
// Models are filtered based on useReference toggle state

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

  // Refs for request cancellation and generation tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const generationIdRef = useRef<number>(0);

  const [prompt, setPrompt] = useState(initialPrompt);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [sourceQuote, setSourceQuote] = useState(initialSourceQuote);
  const [style, setStyle] = useState(initialStyle);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [savingAsReference, setSavingAsReference] = useState(false);
  // Default to text-to-image when a prompt is provided (so prompt is used), otherwise image-to-image
  const [useReference, setUseReference] = useState(!initialPrompt);

  // Get available models based on useReference toggle - filtered by category
  const imageModels = getFilteredImageModels(useReference);
  const allAvailableModels = Object.values(imageModels).flat();
  const [selectedModel, setSelectedModel] = useState(() => {
    // Default based on mode: flux-schnell for text-to-image, flux-redux-dev for image-to-image
    const preferredModel = useReference
      ? allAvailableModels.find(m => m.value === 'flux-redux-dev')
      : allAvailableModels.find(m => m.value === 'flux-schnell');
    return preferredModel?.value || allAvailableModels[0]?.value || 'flux-schnell';
  });
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

  // Get current model metadata for reference image limits
  const currentModelMeta = getAllImageModelsFlat().find(m => m.value === selectedModel);
  const maxReferenceImages = currentModelMeta?.maxReferenceImages ?? 0;

  // Update state when initial props change (when modal opens with new data from JSON actions)
  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt);
      setTitle(initialTitle);
      setDescription(initialDescription);
      setSourceQuote(initialSourceQuote);
      setStyle(initialStyle);
      // Default to text-to-image when prompt is provided (so the prompt is actually used)
      setUseReference(!initialPrompt);
    }
  }, [isOpen, initialPrompt, initialTitle, initialDescription, initialSourceQuote, initialStyle]);

  // Switch model when useReference changes
  useEffect(() => {
    const filteredModels = getFilteredImageModels(useReference);
    const allModels = Object.values(filteredModels).flat();
    // If current model is not in new list, switch to preferred or first available
    if (!allModels.find(m => m.value === selectedModel)) {
      // Prefer appropriate model based on mode
      const preferredModel = useReference
        ? allModels.find(m => m.value === 'flux-redux-dev')
        : allModels.find(m => m.value === 'flux-schnell');
      setSelectedModel(preferredModel?.value || allModels[0]?.value || 'flux-schnell');
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

  // Trim selection when model changes and has a lower maxReferenceImages limit
  useEffect(() => {
    if (maxReferenceImages > 0 && selectedRefImageIds.length > maxReferenceImages) {
      // Keep only the first maxReferenceImages selections
      setSelectedRefImageIds(prev => prev.slice(0, maxReferenceImages));
    }
  }, [maxReferenceImages, selectedRefImageIds.length]);

  // Cleanup on unmount - cancel any in-flight requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
      toast.error(err instanceof Error ? err.message : 'Failed to set primary image');
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
      toast.error(err instanceof Error ? err.message : 'Failed to delete image');
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
      toast.error(err instanceof Error ? err.message : 'Failed to update label');
    }
  };

  // Toggle reference image selection (respects model's maxReferenceImages limit)
  const toggleRefImageSelection = (imageId: string) => {
    setSelectedRefImageIds((prev) => {
      // If already selected, always allow deselection
      if (prev.includes(imageId)) {
        return prev.filter(id => id !== imageId);
      }

      // If model only supports 1 reference, replace selection
      if (maxReferenceImages === 1) {
        return [imageId];
      }

      // For multi-image models, check if at limit
      if (maxReferenceImages > 0 && prev.length >= maxReferenceImages) {
        // At limit - replace oldest selection
        return [...prev.slice(1), imageId];
      }

      // Add to selection
      return [...prev, imageId];
    });
  };

  // Select/deselect all reference images (respects model's maxReferenceImages limit)
  const toggleAllRefImages = () => {
    if (selectedRefImageIds.length > 0) {
      setSelectedRefImageIds([]); // Deselect all
    } else {
      // Select up to maxReferenceImages
      const limit = maxReferenceImages > 0 ? maxReferenceImages : referenceImages.length;
      const toSelect = referenceImages.slice(0, limit).map(img => img.id);
      setSelectedRefImageIds(toSelect);
    }
  };

  // Core upload function used by both click and drag-drop
  const uploadReferenceImage = async (file: File) => {
    if (!patientId) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      toast.error('Please upload an image file');
      return;
    }

    // Auto-save: Upload directly to API
    setSavingAsReference(true);
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('isPrimary', referenceImages.length === 0 ? 'true' : 'false');
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

      // Add to reference images and auto-select it (respecting model limit)
      const data = await response.json();
      setReferenceImages(prev => [data.image, ...prev]);
      setSelectedRefImageIds((prev) => {
        // If model only supports 1 reference, replace selection
        if (maxReferenceImages === 1) {
          return [data.image.id];
        }
        // If at limit, replace oldest
        if (maxReferenceImages > 0 && prev.length >= maxReferenceImages) {
          return [...prev.slice(1), data.image.id];
        }
        // Add to selection
        return [...prev, data.image.id];
      });
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

  // Drag and drop handlers
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

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
      toast.error('Failed to optimize prompt');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Fetch with timeout wrapper to prevent infinite hanging requests
  const fetchWithTimeout = async (
    url: string,
    options: RequestInit,
    timeout = 120000,
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Combine the timeout abort with any existing signal
      const existingSignal = options.signal;
      if (existingSignal) {
        existingSignal.addEventListener('abort', () => controller.abort());
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      toast.error('Please enter a prompt');
      return;
    }

    // Cancel any existing in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Track this generation batch to prevent stale updates
    const currentGenerationId = ++generationIdRef.current;

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]); // Clear previous results
    setGeneratingSlots([0, 1, 2, 3]); // All 4 slots are generating

    try {
      // Build reference images array from selected images
      const selectedReferenceImages: string[] = [];

      // Use selected patient reference images
      if (useReference && selectedRefImageIds.length > 0) {
        const selectedImages = referenceImages
          .filter(img => selectedRefImageIds.includes(img.id))
          .map(img => img.imageUrl);
        selectedReferenceImages.push(...selectedImages);
      } else if (useReference && patientReferenceImage) {
        // Fallback: legacy single reference image
        selectedReferenceImages.push(patientReferenceImage);
      }

      // Get token once before parallel requests
      const idToken = await user?.getIdToken();

      // Generate 4 variations in parallel with different seeds for variety
      const generatePromises = Array.from({ length: 4 }, async (_, index) => {
        try {
          // Use different random seeds for each variation to ensure variety
          const randomSeed = Math.floor(Math.random() * 1000000);

          // Call the API with timeout and abort signal
          const result = await fetchWithTimeout(
            '/api/ai/generate-image',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
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
              signal: abortControllerRef.current?.signal,
            },
            120000, // 2 minute timeout per image
          );

          // Check if this generation was superseded by a new one
          if (currentGenerationId !== generationIdRef.current) {
            return null;
          }

          if (!result.ok) {
            const errorData = await result.json().catch(() => ({}));
            const errorMsg = errorData.error || `Generation ${index + 1} failed`;
            toast.error(errorMsg);
            // Remove this slot from generating list
            if (currentGenerationId === generationIdRef.current) {
              setGeneratingSlots(prev => prev.filter(slot => slot !== index));
            }
            return null;
          }

          const data = await result.json();

          // Only update state if this is still the active generation
          if (currentGenerationId === generationIdRef.current) {
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
          }

          return data;
        } catch (err: any) {
          // Don't show errors for aborted requests (user-initiated cancel)
          if (err.name === 'AbortError') {
            return null;
          }

          // Only update state if this is still the active generation
          if (currentGenerationId === generationIdRef.current) {
            // Check for timeout (abort from timeout controller)
            const isTimeout = err.name === 'AbortError' || err.message?.includes('abort');
            const errorMsg = isTimeout
              ? `Image ${index + 1} timed out`
              : (err.message || `Generation ${index + 1} failed`);

            console.error(`Error generating image ${index + 1}:`, err);
            toast.error(errorMsg);

            // Remove this slot from generating list
            setGeneratingSlots(prev => prev.filter(slot => slot !== index));
          }
          return null;
        }
      });

      // Wait for all 4 generations to complete (or fail)
      await Promise.all(generatePromises);

      // Only clear state if this is still the active generation
      if (currentGenerationId === generationIdRef.current) {
        setGeneratingSlots([]);
      }

      // DON'T close modal - let user review and save
    } catch (err: any) {
      // Don't show errors for aborted requests
      if (err.name === 'AbortError') {
        return;
      }

      if (currentGenerationId === generationIdRef.current) {
        const errorMessage = err.message || 'Failed to generate images';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      // Only clear state if this is still the active generation
      if (currentGenerationId === generationIdRef.current) {
        setIsGenerating(false);
        setGeneratingSlots([]); // Ensure slots are cleared on any exit path
      }
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
      toast.error(err.message || 'Failed to save image');
      // Revert saving state
      setGeneratedImages(prev =>
        prev.map(img =>
          img.index === image.index ? { ...img, saving: false } : img,
        ),
      );
    }
  };

  const handleClose = () => {
    // Cancel any in-flight requests to prevent state updates after close
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setPrompt('');
    setTitle('');
    setDescription('');
    setSourceQuote('');
    setStyle('');
    setUseReference(true);
    setError(null);
    setIsGenerating(false);
    setGeneratedImages([]);
    setGeneratingSlots([]);
    setShowModelDropdown(false);
    setSelectedRefImageIds([]); // Reset selected reference images
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  // Get additional model info for UI display
  const currentModelLabel = currentModelMeta?.label || selectedModel;
  const modelSupportsPrompt = currentModelMeta?.supportsPrompt ?? true;

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
                {patientId ? (
                  <>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Active Patient Reference</span>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {patientName || 'Patient'}
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
                        {/* Select All / Deselect All toggle with model limit info */}
                        {referenceImages.length > 0 && (
                          <div className="mb-2 flex items-center gap-2">
                            <button
                              onClick={toggleAllRefImages}
                              className="text-xs text-purple-600 hover:text-purple-700"
                            >
                              {selectedRefImageIds.length > 0
                                ? 'Deselect All'
                                : maxReferenceImages === 1
                                  ? 'Select 1'
                                  : `Select ${Math.min(maxReferenceImages || referenceImages.length, referenceImages.length)}`}
                            </button>
                            <span className="text-xs text-gray-500">
                              (
                              {selectedRefImageIds.length}
                              {maxReferenceImages > 0 && ` of ${maxReferenceImages} max`}
                              {maxReferenceImages === 0 && ` of ${referenceImages.length}`}
                              {' '}
                              selected)
                            </span>
                            {maxReferenceImages === 1 && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                                1 image only
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-3">
                          {referenceImages.map(img => (
                            <div
                              key={img.id}
                              className="group relative"
                            >
                              {/* Main clickable area for selection */}
                              <button
                                type="button"
                                onClick={() => toggleRefImageSelection(img.id)}
                                className={`relative h-20 w-20 overflow-hidden rounded-lg border-3 transition-all ${
                                  selectedRefImageIds.includes(img.id)
                                    ? 'border-purple-500 shadow-lg shadow-purple-200'
                                    : 'border-gray-200 opacity-70 hover:border-gray-300 hover:opacity-100'
                                }`}
                              >
                                <img
                                  src={img.imageUrl.startsWith('http') ? img.imageUrl : `/api/media/signed-url?path=${encodeURIComponent(img.imageUrl)}`}
                                  alt={img.label || 'Reference'}
                                  className="h-full w-full object-cover"
                                />
                                {/* Selection overlay on hover */}
                                <div
                                  className={`absolute inset-0 flex items-center justify-center transition-all ${
                                    selectedRefImageIds.includes(img.id)
                                      ? 'bg-purple-500/20'
                                      : 'bg-black/0 hover:bg-black/30'
                                  }`}
                                >
                                  {!selectedRefImageIds.includes(img.id) && (
                                    <span className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 opacity-0 group-hover:opacity-100">
                                      Select
                                    </span>
                                  )}
                                </div>
                              </button>
                              {/* Selection checkbox indicator */}
                              <div
                                onClick={() => toggleRefImageSelection(img.id)}
                                className={`absolute -top-1.5 -left-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 shadow-sm transition-all ${
                                  selectedRefImageIds.includes(img.id)
                                    ? 'border-purple-500 bg-purple-500'
                                    : 'border-gray-400 bg-white hover:border-purple-400'
                                }`}
                              >
                                {selectedRefImageIds.includes(img.id) && (
                                  <Check className="h-3.5 w-3.5 text-white" />
                                )}
                              </div>
                              {/* Primary indicator */}
                              {img.isPrimary && (
                                <div className="absolute -top-1.5 -right-1.5 rounded-full bg-purple-500 p-1 shadow-sm">
                                  <Star className="h-3 w-3 fill-white text-white" />
                                </div>
                              )}
                              {/* Action buttons - visible on hover, positioned at bottom */}
                              <div className="absolute right-0 bottom-0 left-0 flex justify-center gap-1 rounded-b-lg bg-gradient-to-t from-black/70 to-transparent px-1 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                                {!img.isPrimary && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSetPrimary(img.id);
                                    }}
                                    className="rounded-full bg-white/90 p-1.5 hover:bg-white"
                                    title="Set as primary"
                                  >
                                    <StarOff className="h-3 w-3 text-gray-700" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingLabelId(img.id);
                                    setLabelValue(img.label || '');
                                  }}
                                  className="rounded-full bg-white/90 p-1.5 hover:bg-white"
                                  title="Edit label"
                                >
                                  <Edit2 className="h-3 w-3 text-gray-700" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteReference(img.id);
                                  }}
                                  className="rounded-full bg-white/90 p-1.5 hover:bg-white"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Upload new reference image button */}
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
                            {isDragging ? (
                              <div className="h-6 w-6 rounded-full border-2 border-purple-500" />
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
                      </>
                    )}

                    {/* Show saving indicator */}
                    {savingAsReference && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 p-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <p className="text-xs text-blue-700">Saving reference image...</p>
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

                    {savingAsReference ? (
                      <div className="flex h-20 w-full items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-sm">Saving reference image...</span>
                        </div>
                      </div>
                    ) : (
                      <label
                        className={`flex h-20 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed bg-white transition-colors ${
                          isDragging
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-300 hover:border-purple-400'
                        }`}
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="flex items-center gap-2 text-gray-500">
                          <Plus className="h-5 w-5" />
                          <span className="text-sm">
                            {isDragging ? 'Drop image here' : 'Click or drag image here'}
                          </span>
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
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{currentModelLabel}</span>
                  {currentModelMeta?.supportsReference && currentModelMeta.maxReferenceImages > 0 && (
                    <span className={`rounded px-1.5 py-0.5 text-xs ${
                      currentModelMeta.maxReferenceImages === 1
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                    >
                      {currentModelMeta.maxReferenceImages === 1 ? '1 ref' : `${currentModelMeta.maxReferenceImages}+ refs`}
                    </span>
                  )}
                </div>
                <svg className={`h-5 w-5 text-gray-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showModelDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowModelDropdown(false)}
                  />
                  <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {useReference && (
                      <div className="border-b border-purple-200 bg-purple-50 px-3 py-2">
                        <p className="text-xs font-medium text-purple-600">Reference Mode - Image-to-Image models only</p>
                      </div>
                    )}
                    {Object.entries(imageModels).map(([provider, providerModels]) => (
                      <div key={provider} className="border-b border-gray-100 last:border-b-0">
                        <div className="bg-gray-50 px-3 py-2">
                          <p className="text-xs font-semibold text-gray-500">{provider}</p>
                        </div>
                        {providerModels.map(model => (
                          <button
                            key={model.value}
                            type="button"
                            onClick={() => {
                              setSelectedModel(model.value);
                              setShowModelDropdown(false);
                            }}
                            className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                              model.value === selectedModel ? 'bg-purple-50 font-medium text-purple-600' : 'text-gray-700'
                            }`}
                          >
                            <span>{model.label}</span>
                            <div className="flex items-center gap-2">
                              {model.supportsReference && model.maxReferenceImages > 0 && (
                                <span className={`rounded px-1.5 py-0.5 text-xs ${
                                  model.maxReferenceImages === 1
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                                >
                                  {model.maxReferenceImages === 1 ? '1 ref' : `${model.maxReferenceImages}+ refs`}
                                </span>
                              )}
                              {model.value === selectedModel && (
                                <Check className="h-4 w-4 text-purple-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* No Prompt Support Notice */}
          {!modelSupportsPrompt && (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
              <Info className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs text-amber-700">No prompt input - transforms reference only</span>
            </div>
          )}

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
