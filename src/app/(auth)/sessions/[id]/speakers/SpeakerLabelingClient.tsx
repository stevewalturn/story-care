'use client';

import { useRouter } from 'next/navigation';
import { SpeakerLabeling } from '@/components/sessions/SpeakerLabeling';

interface Speaker {
  id: string;
  label: string;
  type: 'therapist' | 'patient' | 'group_member' | null;
  name: string;
  sampleAudioUrl?: string;
  utteranceCount: number;
  totalDuration: number;
}

interface SpeakerLabelingClientProps {
  sessionId: string;
}

export function SpeakerLabelingClient({
  sessionId,
}: SpeakerLabelingClientProps) {
  const router = useRouter();

  // Mock data - In real implementation, this would come from API
  const mockSpeakers: Speaker[] = [
    {
      id: '1',
      label: 'Speaker 1',
      type: null,
      name: '',
      utteranceCount: 42,
      totalDuration: 1250, // ~20 minutes
      sampleAudioUrl: '/audio/speaker1-sample.mp3',
    },
    {
      id: '2',
      label: 'Speaker 2',
      type: null,
      name: '',
      utteranceCount: 38,
      totalDuration: 1180,
      sampleAudioUrl: '/audio/speaker2-sample.mp3',
    },
  ];

  const handleSave = async (speakers: Speaker[]) => {
    // In real implementation:
    // await updateSpeakers(sessionId, speakers);

    console.log('Saving speakers:', speakers);

    // Navigate to transcript viewer
    router.push(`/sessions/${sessionId}/transcript`);
  };

  const handleCancel = () => {
    router.push(`/sessions`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <SpeakerLabeling
        sessionId={sessionId}
        speakers={mockSpeakers}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
