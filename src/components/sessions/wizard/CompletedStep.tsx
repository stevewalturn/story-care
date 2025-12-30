'use client';

import { Check } from 'lucide-react';
import { useEffect } from 'react';

type CompletedStepProps = {
  sessionId: string;
  onClose: () => void;
  setStepReady?: (ready: boolean) => void;
  stepProceedRef?: { current: (() => void) | null };
};

export function CompletedStep({ onClose, setStepReady, stepProceedRef }: CompletedStepProps) {
  // Wire up the footer button to call onClose
  useEffect(() => {
    if (stepProceedRef) {
      stepProceedRef.current = onClose;
    }
    if (setStepReady) {
      setStepReady(true);
    }
  }, [onClose, setStepReady, stepProceedRef]);

  return (
    <div className="py-20 text-center">
      {/* Success Checkmark */}
      <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-emerald-600 shadow-lg">
        <Check className="h-16 w-16 text-white" strokeWidth={3} />
      </div>

      {/* Text */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-gray-900">Transcript Completed</h2>
        <p className="mt-3 text-base text-gray-500">
          Successfully transcribed the audio session
        </p>
      </div>
    </div>
  );
}
