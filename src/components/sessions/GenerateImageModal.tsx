'use client';

import { useState } from 'react';

type GenerateImageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, model: string, useReference: boolean, referenceImageUrl?: string) => Promise<void>;
  patientName?: string;
  patientReferenceImage?: string;
  initialPrompt?: string;
};

const IMAGE_MODELS = {
  'OpenAI': [
    { id: 'dall-e-3', name: 'DALL-E 3' },
    { id: 'dall-e-2', name: 'DALL-E 2' },
  ],
  'Stability AI': [
    { id: 'sd3.5-large', name: 'Stable Diffusion 3.5 Large' },
    { id: 'sd3.5-medium', name: 'Stable Diffusion 3.5 Medium' },
    { id: 'sd3-large', name: 'Stable Diffusion 3 Large' },
    { id: 'sdxl-1.0', name: 'Stable Diffusion XL 1.0' },
  ],
  'FAL.AI': [
    { id: 'flux-pro', name: 'Flux Pro' },
    { id: 'flux-dev', name: 'Flux Dev' },
    { id: 'flux-schnell', name: 'Flux Schnell' },
    { id: 'flux-realism', name: 'Flux Realism' },
    { id: 'sdxl', name: 'Fast SDXL' },
    { id: 'sdxl-lightning', name: 'SDXL Lightning' },
  ],
  'Google Vertex AI': [
    { id: 'imagen-3.0-generate-001', name: 'Imagen 3' },
    { id: 'imagegeneration@006', name: 'Imagen 2' },
  ],
};

export function GenerateImageModal({
  isOpen,
  onClose,
  onGenerate,
  patientName,
  patientReferenceImage,
  initialPrompt = '',
}: GenerateImageModalProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [useReference, setUseReference] = useState(true);
  const [overrideImageUrl, _setOverrideImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showContextMetadata, setShowContextMetadata] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [aiModel, setAiModel] = useState('flux-pro');

  if (!isOpen) {
    return null;
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);
    try {
      const referenceUrl = overrideImageUrl || (useReference ? patientReferenceImage : undefined);
      await onGenerate(prompt, aiModel, useReference, referenceUrl);
      onClose();
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizePrompt = () => {
    // TODO: Implement AI prompt optimization
    console.error('Optimize prompt');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-5xl rounded-lg bg-white shadow-xl">
        {/* Left Panel - Form */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Generate Image</h2>
              <p className="text-sm text-gray-500">Transform symbolic prompts into visual imagery.</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* Context & Metadata */}
            <div className="rounded-lg border border-gray-200">
              <button
                onClick={() => setShowContextMetadata(!showContextMetadata)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Context & Metadata</span>
                </div>
                <svg className={`h-5 w-5 text-gray-400 transition-transform ${showContextMetadata ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showContextMetadata && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-600">Patient context and session metadata will be included automatically.</p>
                </div>
              )}
            </div>

            {/* AI Model */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">AI Model</label>
              <select
                value={aiModel}
                onChange={e => setAiModel(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {Object.entries(IMAGE_MODELS).map(([provider, models]) => (
                  <optgroup key={provider} label={provider}>
                    {models.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Prompt */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Prompt</label>
                <button
                  onClick={handleOptimizePrompt}
                  className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Optimize
                </button>
              </div>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  rows={6}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <div className="absolute right-2 bottom-2">
                  <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Reference Image */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <label className="text-sm font-medium text-gray-700">Reference Image</label>
                  <svg className="h-4 w-4 cursor-help text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
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

              {patientReferenceImage && useReference && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={patientReferenceImage}
                      alt="Patient reference"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Active Patient Reference</p>
                      <p className="text-xs text-blue-700">{patientName || 'Patient'}</p>
                      <p className="mt-1 text-xs text-blue-600">This patient reference image will be used for visual consistency.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Override with Different Image */}
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium text-gray-700">Override with Different Image (Optional)</p>
                <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400">
                  <svg className="mx-auto mb-2 h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-1 text-sm text-gray-600">Upload Image</p>
                  <p className="text-xs text-gray-500">or drag & drop</p>
                </div>
              </div>
            </div>

            {/* Advanced Prompt Settings */}
            <div className="rounded-lg border border-gray-200">
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Advanced Prompt Settings</span>
                </div>
                <svg className={`h-5 w-5 text-gray-400 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showAdvancedSettings && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-600">Advanced generation parameters coming soon...</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isGenerating
                ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </>
                  )
                : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Generate
                    </>
                  )}
            </button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex w-[400px] flex-col items-center justify-center border-l border-gray-200 bg-gray-50 p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
              <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Generation Result</h3>
            <p className="text-xs text-gray-500">Your generated media will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
