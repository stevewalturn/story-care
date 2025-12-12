'use client';

import { Check, Image as ImageIcon, Loader2, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
  onGenerate,
  patients = [],
  patientName,
  patientReferenceImage,
  initialPrompt = '',
  initialTitle = '',
  initialDescription = '',
  initialSourceQuote = '',
  initialStyle = '',
}: GenerateImageModalProps) {
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

  // Only filter models to image-to-image if toggle is ON and reference exists
  const hasReferenceImage = (uploadedReferenceImage !== null || !!patientImageUrl) && useReference;

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

      await onGenerate(
        enhancedPrompt,
        selectedModel,
        useReference,
        referenceImage,
        {
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          sourceQuote: sourceQuote.trim() || undefined,
          style: style.trim() || undefined,
        }
      );

      // Close modal on success
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
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
            {isGenerating ? 'Generating...' : 'Generate Image'}
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
                <span className="ml-2 text-xs text-indigo-600">(Showing image-to-image models only)</span>
              )}
            </label>
            <div className="max-h-64 space-y-4 overflow-y-auto rounded-lg border border-gray-200 p-3">
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
            </div>
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

        {/* Right Column - Preview / Info */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Generation Info
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
              : (
                  <div className="p-8 text-center">
                    <ImageIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                    <p className="mb-2 text-sm font-medium text-gray-900">Ready to Generate</p>
                    <p className="text-xs text-gray-500">
                      Your generated image will be saved to the media library automatically
                    </p>
                  </div>
                )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
