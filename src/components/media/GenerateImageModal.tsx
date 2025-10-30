'use client';

import { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, Loader2, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Patient {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface GenerateImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (imageUrl: string, prompt: string) => void;
  patients?: Patient[];
}

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
    setSelectedPatients((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    );
  };

  const enhancePromptWithPatients = (basePrompt: string) => {
    if (selectedPatients.length === 0) return basePrompt;

    const patientNames = selectedPatients
      .map((id) => patients.find((p) => p.id === id)?.name)
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

  if (!isOpen) return null;

  const currentModel = IMAGE_MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Generate Image</h2>
              <p className="text-sm text-gray-600">Create AI-generated images for your stories</p>
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
                Describe Your Image *
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A serene beach at sunset with gentle waves..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                maxLength={currentModel?.maxLength}
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Be specific and detailed for best results</span>
                <span>
                  {prompt.length} / {currentModel?.maxLength}
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
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handlePatientToggle(patient.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                        selectedPatients.includes(patient.id)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {patient.avatarUrl ? (
                        <img
                          src={patient.avatarUrl}
                          alt={patient.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 flex-1 text-left truncate">
                        {patient.name}
                      </span>
                      {selectedPatients.includes(patient.id) && (
                        <Check className="w-4 h-4 text-indigo-600" />
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
                {IMAGE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setSelectedModel(model.id)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
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
                {IMAGE_SIZES.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSize(size.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      selectedSize === size.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{size.ratio}</div>
                    <div className="text-xs text-gray-600 mt-1">{size.label.split(' ')[0]}</div>
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
                  {IMAGE_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
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
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
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
            <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
              {isGenerating ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Generating your image...</p>
                  <p className="text-xs text-gray-500 mt-2">This may take 10-30 seconds</p>
                </div>
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">No image generated yet</p>
                  <p className="text-xs text-gray-500">
                    Configure your settings and click Generate
                  </p>
                </div>
              )}
            </div>

            {generatedImage && (
              <div className="space-y-3">
                <Button onClick={handleSave} variant="primary" className="w-full">
                  <Check className="w-4 h-4 mr-2" />
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
