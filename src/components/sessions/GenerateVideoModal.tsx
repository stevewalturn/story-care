'use client';

import { useState } from 'react';

type GenerateVideoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (imageId: string, duration: number) => Promise<void>;
  selectedImage?: {
    id: string;
    url: string;
    title: string;
    patientName: string;
  };
};

export function GenerateVideoModal({
  isOpen,
  onClose,
  onGenerate,
  selectedImage,
}: GenerateVideoModalProps) {
  const [duration, setDuration] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [showContextMetadata, setShowContextMetadata] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!selectedImage || isGenerating) return;

    setIsGenerating(true);
    try {
      await onGenerate(selectedImage.id, duration);
      // Simulate video generation for demo
      setTimeout(() => {
        setGeneratedVideoUrl(selectedImage.url); // In reality, this would be the video URL
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating video:', error);
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setGeneratedVideoUrl(null);
    setIsGenerating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl bg-white rounded-lg shadow-xl mx-4 max-h-[90vh] flex">
        {/* Left Panel - Form */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Generate Video</h2>
              <p className="text-sm text-gray-500">Transform symbolic prompts into visual stories.</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Reference Image */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <label className="text-sm font-medium text-gray-700">Reference Image</label>
                  <svg className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <label className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Use Reference</span>
                  <button
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-indigo-600"
                  >
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                  </button>
                </label>
              </div>

              {selectedImage && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedImage.url}
                      alt="Selected for animation"
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">Selected for Animation</p>
                      <p className="text-xs text-green-700">{selectedImage.patientName}</p>
                      <p className="text-xs text-green-600 mt-1">This image will be used as the starting frame for video generation.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Override with Different Image */}
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Override with Different Image (Optional)</p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600 mb-1">Upload Image</p>
                  <p className="text-xs text-gray-500">or drag & drop</p>
                </div>
              </div>
            </div>

            {/* Context & Metadata */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setShowContextMetadata(!showContextMetadata)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
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
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-600">Patient context and session metadata will be included automatically.</p>
                </div>
              )}
            </div>

            {/* Advanced Prompt Settings */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
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
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Duration (seconds)</label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        min={3}
                        max={10}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {generatedVideoUrl ? 'Close' : 'Cancel'}
            </button>
            {!generatedVideoUrl && (
              <button
                onClick={handleGenerate}
                disabled={!selectedImage || isGenerating}
                className="px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Generate Video ({duration}s)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-[500px] border-l border-gray-200 bg-black flex flex-col items-center justify-center p-0">
          {generatedVideoUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={generatedVideoUrl}
                controls
                autoPlay
                loop
                className="max-w-full max-h-full"
              >
                <track kind="captions" />
              </video>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <button className="flex items-center justify-center h-10 w-10 rounded-full bg-white/90 hover:bg-white transition-colors">
                  <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.06m2.828-9.9a9 9 0 012.828 0" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-6">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-gray-800">
                <svg className="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">Video Preview</h3>
              <p className="text-xs text-gray-400">Your generated video will play here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
