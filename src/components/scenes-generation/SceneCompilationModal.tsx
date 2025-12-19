'use client';

import { Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SceneCompilationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditTimeframe?: () => void;
  onCompileNow: () => void;
  sceneCount: number;
  isCompiling?: boolean;
}

export function SceneCompilationModal({
  isOpen,
  onClose,
  onEditTimeframe,
  onCompileNow,
  sceneCount,
  isCompiling = false,
}: SceneCompilationModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={!isCompiling ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Content */}
          <div className="p-8 text-center">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
              <Play className="h-8 w-8 text-indigo-600" />
            </div>

            {/* Title */}
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              Compile into one video
            </h2>

            {/* Description */}
            <p className="mb-8 text-sm leading-relaxed text-gray-600">
              You're about to combine
              {' '}
              <span className="font-semibold text-gray-900">
                {sceneCount}
                {' '}
                {sceneCount === 1 ? 'clip' : 'clips'}
              </span>
              {' '}
              into a single video. You can edit each clip's start/end time before exporting.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={onCompileNow}
                variant="primary"
                className="w-full"
                disabled={isCompiling}
              >
                {isCompiling ? 'Compiling...' : 'Compile now'}
              </Button>

              {onEditTimeframe && (
                <Button
                  onClick={onEditTimeframe}
                  variant="secondary"
                  className="w-full"
                  disabled={isCompiling}
                >
                  Edit Timeframe
                </Button>
              )}

              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full"
                disabled={isCompiling}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
