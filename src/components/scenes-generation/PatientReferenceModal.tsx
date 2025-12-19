'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ReferenceImage {
  id: string;
  url: string;
  name?: string;
}

interface PatientReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  referenceImages: ReferenceImage[];
  onToggleReference: (enabled: boolean) => void;
  useReference: boolean;
  onAddImage?: (file: File) => void;
  onRemoveImage?: (imageId: string) => void;
}

export function PatientReferenceModal({
  isOpen,
  onClose,
  patientName,
  referenceImages,
  onToggleReference,
  useReference,
  onAddImage,
  onRemoveImage,
}: PatientReferenceModalProps) {
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAddImage) {
      onAddImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onAddImage) {
      onAddImage(file);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Active Patient Reference
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                This image will be used for visual consistency
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Use Reference Toggle */}
            <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="font-medium text-gray-900">Use Reference Images</p>
                <p className="mt-1 text-sm text-gray-600">
                  Enable to maintain visual consistency across generated images
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={useReference}
                  onChange={(e) => onToggleReference(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-indigo-500" />
              </label>
            </div>

            {/* Patient Info */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700">
                Patient:
                {' '}
                <span className="text-gray-900">{patientName}</span>
              </p>
            </div>

            {/* Reference Images Grid */}
            <div className="grid grid-cols-4 gap-4">
              {/* Existing Images */}
              {referenceImages.map(image => (
                <div
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100"
                >
                  <img
                    src={image.url}
                    alt={image.name || 'Reference image'}
                    className="h-full w-full object-cover"
                  />
                  {onRemoveImage && (
                    <button
                      onClick={() => onRemoveImage(image.id)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add Image Button */}
              {onAddImage && referenceImages.length < 6 && (
                <label
                  className={`relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
                    <Plus className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-600">
                    Add Image
                  </p>
                </label>
              )}
            </div>

            {/* Help Text */}
            <p className="mt-4 text-xs text-gray-500">
              Upload reference images of the patient for AI-generated content. Maximum 6 images.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <Button
              onClick={onClose}
              variant="ghost"
            >
              Close
            </Button>
            <Button
              onClick={onClose}
              variant="primary"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
