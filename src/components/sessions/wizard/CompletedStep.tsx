'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type CompletedStepProps = {
  sessionId: string;
  onClose: () => void;
};

export function CompletedStep({ sessionId }: CompletedStepProps) {
  const handleContinue = () => {
    // Navigate to session transcript page
    window.location.href = `/sessions/${sessionId}/transcript`;
  };

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

      {/* Continue Button */}
      <Button
        variant="primary"
        onClick={handleContinue}
        className="!px-16 !py-3.5 !text-base !font-semibold"
        style={{ minWidth: '360px' }}
      >
        Continue
      </Button>
    </div>
  );
}
