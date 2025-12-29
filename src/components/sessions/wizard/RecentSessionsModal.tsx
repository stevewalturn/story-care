'use client';

import { Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

type Patient = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type RecentSession = {
  id: string;
  title: string;
  patients: Patient[];
  createdAt: Date;
};

type RecentSessionsModalProps = {
  isOpen: boolean;
  sessions: RecentSession[];
  onSelect: (session: RecentSession) => void;
  onClose: () => void;
};

export function RecentSessionsModal({
  isOpen,
  sessions,
  onSelect,
  onClose,
}: RecentSessionsModalProps) {
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

  const handleToggleSession = (sessionId: string) => {
    setSelectedSessionIds(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId],
    );
  };

  const handleUncheckAll = () => {
    setSelectedSessionIds([]);
  };

  const handleSave = () => {
    // For now, just select the first selected session
    if (selectedSessionIds.length > 0) {
      const session = sessions.find(s => s.id === selectedSessionIds[0]);
      if (session) {
        onSelect(session);
        setSelectedSessionIds([]);
      }
    }
  };

  const handleCancel = () => {
    setSelectedSessionIds([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title=""
      size="md"
      hideHeader
      footer={(
        <>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={selectedSessionIds.length === 0}
          >
            Save
          </Button>
        </>
      )}
    >
      {/* Icon */}
      <div className="mb-4 flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <Users className="h-6 w-6 text-gray-600" />
        </div>
      </div>

      {/* Title and Description */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Select From Recent</h2>
        <p className="mt-2 text-sm text-gray-500">
          Choose who from recent sessions will join this new session
        </p>
      </div>

      {/* Patients Count and Uncheck All */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {sessions.reduce((acc, s) => acc + (s.patients?.length || 0), 0)}
          {' '}
          Patients
        </span>
        {selectedSessionIds.length > 0 && (
          <button
            onClick={handleUncheckAll}
            className="text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            Uncheck all
          </button>
        )}
      </div>

      {/* Session List */}
      <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
        {sessions.map((session) => {
          const isSelected = selectedSessionIds.includes(session.id);

          return (
            <button
              key={session.id}
              onClick={() => handleToggleSession(session.id)}
              className="flex w-full items-center gap-3 rounded-lg bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
            >
              {/* Checkbox */}
              <div
                className={`
                  flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors
                  ${isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300 bg-white'}
                `}
              >
                {isSelected && (
                  <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Avatar(s) */}
              <div className="flex items-center">
                {session.patients?.slice(0, 3).map((patient, idx) => (
                  <div
                    key={patient.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-400 text-xs font-semibold text-white ring-2 ring-white"
                    style={{ marginLeft: idx > 0 ? '-8px' : '0', zIndex: 3 - idx }}
                  >
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>

              {/* Name */}
              <span className="flex-1 text-sm font-medium text-gray-900">
                {session.patients?.map(p => p.name).join(', ') || 'No patients'}
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
