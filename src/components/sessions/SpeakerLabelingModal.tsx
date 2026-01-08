'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SpeakerLabeling } from '@/components/sessions/SpeakerLabeling';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch, authenticatedPut } from '@/utils/AuthenticatedFetch';

type Speaker = {
  id: string;
  label: string;
  type: 'therapist' | 'patient' | 'group_member' | null;
  name: string;
  userId?: string;
  avatarUrl?: string;
  sampleAudioUrl?: string;
  utteranceCount: number;
  totalDuration: number;
};

type SessionContext = {
  sessionType: 'individual' | 'group';
  therapistName: string;
  patientName: string;
  therapistId: string;
  patientId?: string | null;
  therapistAvatarUrl?: string | null;
  patientAvatarUrl?: string | null;
};

type GroupMember = {
  userId: string;
  name: string;
  avatarUrl?: string;
};

type SpeakerLabelingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onSave: () => void;
};

export function SpeakerLabelingModal({
  isOpen,
  onClose,
  sessionId,
  onSave,
}: SpeakerLabelingModalProps) {
  const { user } = useAuth();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [sessionContext, setSessionContext] = useState<SessionContext>({
    sessionType: 'individual',
    therapistName: 'Therapist',
    patientName: 'Patient',
    therapistId: '',
    patientId: null,
    therapistAvatarUrl: null,
    patientAvatarUrl: null,
  });
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch speakers and session context from API when modal opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchSpeakers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await authenticatedFetch(`/api/sessions/${sessionId}/speakers`, user);

        if (!response.ok) {
          throw new Error('Failed to fetch speakers');
        }

        const data = await response.json();

        // Set session context from API response
        if (data.sessionContext) {
          setSessionContext(data.sessionContext);
        }

        // Set group members from API response
        if (data.groupMembers) {
          setGroupMembers(data.groupMembers);
        }

        // Transform API data to match component interface
        const transformedSpeakers: Speaker[] = data.speakers.map((speaker: any) => ({
          id: speaker.id,
          label: speaker.speakerLabel || `Speaker ${speaker.id}`,
          type: speaker.speakerType,
          name: speaker.speakerName || '',
          userId: speaker.userId,
          avatarUrl: speaker.avatarUrl,
          utteranceCount: speaker.totalUtterances || 0,
          totalDuration: speaker.totalDurationSeconds || 0,
          sampleAudioUrl: speaker.sampleAudioUrl,
        }));

        setSpeakers(transformedSpeakers);
      } catch (err) {
        console.error('Error fetching speakers:', err);
        setError(err instanceof Error ? err.message : 'Failed to load speakers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpeakers();
  }, [isOpen, sessionId, user]);

  const handleSave = async (updatedSpeakers: Speaker[]) => {
    try {
      setIsSaving(true);

      // Transform speakers back to API format
      const speakersData = updatedSpeakers.map(speaker => ({
        id: speaker.id,
        speakerLabel: speaker.label,
        speakerType: speaker.type,
        speakerName: speaker.name,
        userId: speaker.userId,
        totalUtterances: speaker.utteranceCount,
        totalDurationSeconds: speaker.totalDuration,
      }));

      const response = await authenticatedPut(`/api/sessions/${sessionId}/speakers`, user, { speakers: speakersData });

      if (!response.ok) {
        throw new Error('Failed to save speakers');
      }

      // Call onSave callback to refresh transcript data
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving speakers:', err);
      alert(err instanceof Error ? err.message : 'Failed to save speakers');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-gray-900 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading
            ? (
                <div className="flex min-h-[400px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                    <p className="text-gray-400">Loading speakers...</p>
                  </div>
                </div>
              )
            : error
              ? (
                  <div className="flex min-h-[400px] items-center justify-center">
                    <div className="text-center">
                      <h3 className="mb-2 text-lg font-semibold text-red-400">Error Loading Speakers</h3>
                      <p className="mb-4 text-gray-400">{error}</p>
                      <button
                        onClick={onClose}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )
              : (
                  <SpeakerLabeling
                    sessionId={sessionId}
                    speakers={speakers}
                    sessionContext={sessionContext}
                    groupMembers={groupMembers}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                )}
        </div>

        {/* Saving overlay */}
        {isSaving && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-900/80">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
              <p className="text-gray-300">Saving speakers...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
