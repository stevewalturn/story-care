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
  avatarUrl?: string;
  sampleAudioUrl?: string;
  utteranceCount: number;
  totalDuration: number;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch speakers from API
  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        setIsLoading(true);
        const response = await authenticatedFetch(`/api/sessions/${sessionId}/speakers`, user);

        if (!response.ok) {
          throw new Error('Failed to fetch speakers');
        }

        const data = await response.json();

        // Transform API data to match component interface
        const transformedSpeakers: Speaker[] = data.speakers.map((speaker: any) => ({
          id: speaker.id,
          label: speaker.speakerLabel || `Speaker ${speaker.id}`,
          type: speaker.speakerType,
          name: speaker.speakerName || '',
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
  }, [sessionId]);

  const handleSave = async (updatedSpeakers: Speaker[]) => {
    try {
      // Transform speakers back to API format
      const speakersData = updatedSpeakers.map(speaker => ({
        id: speaker.id, // Include speaker ID to update existing record
        speakerLabel: speaker.label,
        speakerType: speaker.type,
        speakerName: speaker.name,
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
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
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
            className="text-indigo-600 hover:text-indigo-700"
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
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
