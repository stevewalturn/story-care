'use client';

import { Check, Image as ImageIcon, Loader2, Sparkles, User, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type Patient = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type GenerateImageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (imageUrl: string, prompt: string) => void;
  patients?: Patient[];
};

const IMAGE_MODELS = [
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    description: 'High quality, detailed images with excellent prompt following',
    maxLength: 4000,
  },
  {
    id: 'dall-e-2',
    name: 'DALL-E 2',
    description: 'Faster generation with good quality',
    maxLength: 1000,
  },
];

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
}: GenerateImageModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('dall-e-3');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [selectedStyle, setSelectedStyle] = useState('vivid');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
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

      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          model: selectedModel,
          size: selectedSize,
          style: selectedStyle,
          patientIds: selectedPatients,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImage(data.imageUrl);
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
    setGeneratedImage(null);
    setError(null);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const currentModel = IMAGE_MODELS.find(m => m.id === selectedModel);

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
                      {patient.avatarUrl
                        ? (
                            <img
                              src={patient.avatarUrl}
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
              </div>
            )}

            {/* Model Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                AI Model
              </label>
              <div className="space-y-2">
                {IMAGE_MODELS.map(model => (
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
