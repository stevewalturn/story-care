'use client';

import { Eye, HelpCircle, Redo, Undo } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { IMAGE_GENERATION_MODELS } from '@/libs/ModelMetadata';

interface AIModel {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google';
}

interface ImageModel {
  value: string;
  label: string;
  supportsReference: boolean;
}

interface SceneGenerationTopBarProps {
  patientName: string;
  selectedModel: string;
  models: AIModel[];
  onModelChange: (modelId: string) => void;
  selectedImageModel: string;
  onImageModelChange: (modelValue: string) => void;
  useReference: boolean;
  onUseReferenceChange: (useReference: boolean) => void;
  onShowReferenceModal: () => void;
  onPreview?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function SceneGenerationTopBar({
  patientName,
  selectedModel,
  models,
  onModelChange,
  selectedImageModel,
  onImageModelChange,
  useReference,
  onUseReferenceChange,
  onShowReferenceModal,
  onPreview,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: SceneGenerationTopBarProps) {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showImageModelDropdown, setShowImageModelDropdown] = useState(false);

  const selectedModelData = models.find(m => m.id === selectedModel);

  // Group models by provider
  const modelsByProvider = models.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider]!.push(model);
      return acc;
    },
    {} as Record<string, AIModel[]>,
  );

  // Flatten image models and filter based on useReference
  const allImageModels: ImageModel[] = Object.values(IMAGE_GENERATION_MODELS).flat();
  const filteredImageModels = useReference
    ? allImageModels // Show all models when reference is enabled
    : allImageModels.filter(m => !m.supportsReference); // Hide image-to-image models when reference is disabled

  // Group filtered image models by provider
  const imageModelsByProvider = Object.entries(IMAGE_GENERATION_MODELS).reduce(
    (acc, [provider, models]) => {
      const filtered = models.filter(m =>
        filteredImageModels.some(fm => fm.value === m.value),
      );
      if (filtered.length > 0) {
        acc[provider] = filtered;
      }
      return acc;
    },
    {} as Record<string, ImageModel[]>,
  );

  const selectedImageModelData = allImageModels.find(m => m.value === selectedImageModel);

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      {/* Left Side - Patient Name & Model Selection */}
      <div className="flex items-center gap-4">
        {/* Patient Name (Read-only) */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Patient:
          </label>
          <span className="text-sm font-semibold text-gray-900">
            {patientName}
          </span>
        </div>

        {/* AI Model Selector (Text Generation) */}
        <div className="relative">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            AI Model
          </label>
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400"
          >
            <span>{selectedModelData?.name || 'Select Model'}</span>
            <svg
              className={`h-4 w-4 text-gray-500 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showModelDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowModelDropdown(false)}
              />

              {/* Menu */}
              <div className="absolute top-full left-0 z-20 mt-1 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                {Object.entries(modelsByProvider).map(([provider, providerModels]) => (
                  <div key={provider} className="border-b border-gray-100 last:border-b-0">
                    <div className="bg-gray-50 px-3 py-2">
                      <p className="text-xs font-semibold text-gray-500">{provider}</p>
                    </div>
                    {providerModels.map(model => (
                      <button
                        key={model.id}
                        onClick={() => {
                          onModelChange(model.id);
                          setShowModelDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                          model.id === selectedModel ? 'bg-indigo-50 font-medium text-indigo-600' : 'text-gray-700'
                        }`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Image Model Selector */}
        <div className="relative">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Image Model
          </label>
          <button
            onClick={() => setShowImageModelDropdown(!showImageModelDropdown)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400"
          >
            <span className="max-w-[180px] truncate">
              {selectedImageModelData?.label || 'Select Image Model'}
            </span>
            <svg
              className={`h-4 w-4 flex-shrink-0 text-gray-500 transition-transform ${showImageModelDropdown ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showImageModelDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowImageModelDropdown(false)}
              />

              {/* Menu */}
              <div className="absolute top-full left-0 z-20 mt-1 max-h-96 w-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {Object.entries(imageModelsByProvider).map(([provider, providerModels]) => (
                  <div key={provider} className="border-b border-gray-100 last:border-b-0">
                    <div className="bg-gray-50 px-3 py-2">
                      <p className="text-xs font-semibold text-gray-500">{provider}</p>
                    </div>
                    {providerModels.map(model => (
                      <button
                        key={model.value}
                        onClick={() => {
                          onImageModelChange(model.value);
                          setShowImageModelDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                          model.value === selectedImageModel ? 'bg-indigo-50 font-medium text-indigo-600' : 'text-gray-700'
                        }`}
                      >
                        {model.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Use Reference Toggle */}
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={useReference}
              onChange={(e) => onUseReferenceChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            />
            <span className="text-sm font-medium text-gray-700">
              Use Reference
            </span>
          </label>
          <button
            onClick={onShowReferenceModal}
            className="text-gray-400 transition-colors hover:text-gray-600"
            title="Manage reference images"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        {onUndo && (
          <Button
            onClick={onUndo}
            disabled={!canUndo}
            variant="ghost"
            size="sm"
            className="px-2"
          >
            <Undo className="h-4 w-4" />
          </Button>
        )}
        {onRedo && (
          <Button
            onClick={onRedo}
            disabled={!canRedo}
            variant="ghost"
            size="sm"
            className="px-2"
          >
            <Redo className="h-4 w-4" />
          </Button>
        )}

        {/* Preview Button */}
        {onPreview && (
          <Button
            onClick={onPreview}
            variant="secondary"
            size="sm"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        )}
      </div>
    </div>
  );
}
