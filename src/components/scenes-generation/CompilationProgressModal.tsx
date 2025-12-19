'use client';

import { ArrowRight, CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface CompilationProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'processing' | 'completed' | 'failed';
  currentStep: string;
  progress: number;
  sceneId: string | null;
  errorMessage?: string;
}

export function CompilationProgressModal({
  isOpen,
  onClose,
  status,
  currentStep,
  progress,
  sceneId,
  errorMessage,
}: CompilationProgressModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoToScenes = () => {
    if (sceneId) {
      // Navigate directly to the scene if we have an ID
      router.push(`/scenes?sceneId=${sceneId}`);
    } else {
      // Navigate to scenes page
      router.push('/scenes');
    }
  };

  const handleViewScene = () => {
    if (sceneId) {
      router.push(`/scenes?sceneId=${sceneId}`);
    } else {
      router.push('/scenes');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={status !== 'processing' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Content */}
          <div className="p-8">
            {/* Processing State */}
            {status === 'processing' && (
              <>
                {/* Icon */}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>

                {/* Title */}
                <h2 className="mb-3 text-center text-xl font-semibold text-gray-900">
                  Compiling Your Scene
                </h2>

                {/* Current Step */}
                <p className="mb-4 text-center text-sm text-gray-600">
                  {currentStep}
                </p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
                    <span>Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Helper Text */}
                <p className="mb-6 text-center text-xs text-gray-500">
                  This may take 1-2 minutes. You can check the scene on your Scenes page while it processes.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleGoToScenes}
                    variant="primary"
                    className="w-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Go to Scenes Page
                  </Button>

                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="w-full"
                  >
                    Stay Here
                  </Button>
                </div>
              </>
            )}

            {/* Completed State */}
            {status === 'completed' && (
              <>
                {/* Icon */}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>

                {/* Title */}
                <h2 className="mb-3 text-center text-xl font-semibold text-gray-900">
                  Scene Compiled Successfully!
                </h2>

                {/* Description */}
                <p className="mb-6 text-center text-sm text-gray-600">
                  Your therapeutic scene has been compiled and saved. You can now view it in your Scenes library.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleViewScene}
                    variant="primary"
                    className="w-full"
                  >
                    View Scene
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </>
            )}

            {/* Failed State */}
            {status === 'failed' && (
              <>
                {/* Icon */}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>

                {/* Title */}
                <h2 className="mb-3 text-center text-xl font-semibold text-gray-900">
                  Compilation Failed
                </h2>

                {/* Error Message */}
                <p className="mb-6 text-center text-sm text-gray-600">
                  {errorMessage || 'An error occurred while compiling your scene. Please try again.'}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {sceneId && (
                    <Button
                      onClick={handleGoToScenes}
                      variant="secondary"
                      className="w-full"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Check Scenes Page
                    </Button>
                  )}

                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
