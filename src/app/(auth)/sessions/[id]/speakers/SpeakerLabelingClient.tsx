'use client';

import { useRouter } from 'next/navigation';
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

type TherapistPatient = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type SpeakerLabelingClientProps = {
  sessionId: string;
};

export function SpeakerLabelingClient({
  sessionId,
}: SpeakerLabelingClientProps) {
  const router = useRouter();
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
  const [therapistPatients, setTherapistPatients] = useState<TherapistPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch speakers and session context from API
  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        setIsLoading(true);
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

        // Set therapist's patients from API response
        if (data.therapistPatients) {
          setTherapistPatients(data.therapistPatients);
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
  }, [sessionId, user]);

  const handleSave = async (updatedSpeakers: Speaker[]) => {
    try {
      // Transform speakers back to API format
      const speakersData = updatedSpeakers.map(speaker => ({
        id: speaker.id, // Include speaker ID to update existing record
        speakerLabel: speaker.label,
        speakerType: speaker.type,
        speakerName: speaker.name,
        userId: speaker.userId, // Include userId for linking to user records
        totalUtterances: speaker.utteranceCount,
        totalDurationSeconds: speaker.totalDuration,
      }));

      const response = await authenticatedPut(`/api/sessions/${sessionId}/speakers`, user, { speakers: speakersData });

      if (!response.ok) {
        throw new Error('Failed to save speakers');
      }

      // Navigate to transcript viewer
      router.push(`/sessions/${sessionId}/transcript`);
    } catch (err) {
      console.error('Error saving speakers:', err);
      alert(err instanceof Error ? err.message : 'Failed to save speakers');
    }
  };

  const handleCancel = () => {
    router.push(`/sessions`);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-gray-500">Loading speakers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <div className="py-16 text-center">
          <h3 className="mb-2 text-lg font-semibold text-red-600">Error Loading Speakers</h3>
          <p className="mb-4 text-gray-500">{error}</p>
          <button
            onClick={() => router.push(`/sessions`)}
            className="text-purple-600 hover:text-purple-700"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <SpeakerLabeling
        sessionId={sessionId}
        speakers={speakers}
        sessionContext={sessionContext}
        groupMembers={groupMembers}
        therapistPatients={therapistPatients}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
