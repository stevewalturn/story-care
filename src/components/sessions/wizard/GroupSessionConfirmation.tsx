'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

type GroupSessionConfirmationProps = {
  isOpen: boolean;
  patientCount: number;
  onContinue: () => void;
  onCancel: () => void;
};

export function GroupSessionConfirmation({
  isOpen,
  onContinue,
  onCancel,
}: GroupSessionConfirmationProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      hideHeader
      footer={(
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onContinue}>
            Continue
          </Button>
        </>
      )}
    >
      {/* Illustration */}
      <div className="mb-6 flex justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-purple-600">
          {/* Network illustration with connected people icons */}
          {/* Center circle */}
          <circle cx="60" cy="60" r="12" fill="currentColor" opacity="0.2" />
          <circle cx="60" cy="60" r="8" fill="currentColor" />

          {/* Surrounding circles */}
          <circle cx="30" cy="30" r="8" fill="currentColor" opacity="0.6" />
          <circle cx="90" cy="30" r="8" fill="currentColor" opacity="0.6" />
          <circle cx="30" cy="90" r="8" fill="currentColor" opacity="0.6" />
          <circle cx="90" cy="90" r="8" fill="currentColor" opacity="0.6" />
          <circle cx="60" cy="20" r="8" fill="currentColor" opacity="0.6" />
          <circle cx="60" cy="100" r="8" fill="currentColor" opacity="0.6" />

          {/* Connecting lines */}
          <line x1="60" y1="60" x2="30" y2="30" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <line x1="60" y1="60" x2="90" y2="30" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <line x1="60" y1="60" x2="30" y2="90" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <line x1="60" y1="60" x2="90" y2="90" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <line x1="60" y1="60" x2="60" y2="20" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <line x1="60" y1="60" x2="60" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        </svg>
      </div>

      {/* Title and Description */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          You've selected multiple patients
        </h2>
        <p className="mt-3 text-sm text-gray-500">
          You're about to create a group session. Would you like to proceed?
        </p>
      </div>
    </Modal>
  );
}
