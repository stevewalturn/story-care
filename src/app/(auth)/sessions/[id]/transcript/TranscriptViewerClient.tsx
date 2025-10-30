'use client';

import { useState, useEffect } from 'react';
import { AIAssistant } from '@/components/sessions/AIAssistant';
import { TranscriptViewer } from '@/components/sessions/TranscriptViewer';
import { Modal } from '@/components/ui/Modal';

type Utterance = {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerType: 'therapist' | 'patient' | 'group_member';
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
};

type TranscriptViewerClientProps = {
  sessionId: string;
};

export function TranscriptViewerClient({
  sessionId,
}: TranscriptViewerClientProps) {
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedContext, setSelectedContext] = useState<{
    text: string;
    utteranceIds: string[];
  } | null>(null);
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session and transcript data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch session to get audio URL
        const sessionResponse = await fetch(`/api/sessions/${sessionId}`);
        if (!sessionResponse.ok) {
          throw new Error('Failed to fetch session');
        }
        const sessionData = await sessionResponse.json();
        setAudioUrl(sessionData.session.audioUrl);

        // Fetch transcript and utterances
        const transcriptResponse = await fetch(`/api/sessions/${sessionId}/transcript`);
        if (!transcriptResponse.ok) {
          throw new Error('Failed to fetch transcript');
        }
        const transcriptData = await transcriptResponse.json();

        // Transform API data to match component interface
        const transformedUtterances: Utterance[] = transcriptData.utterances.map((u: any) => ({
          id: u.id,
          speakerId: u.speakerId,
          speakerName: u.speaker?.speakerName || u.speaker?.speakerLabel || 'Unknown',
          speakerType: u.speaker?.speakerType || 'patient',
          text: u.text,
          startTime: parseFloat(u.startTimeSeconds || '0'),
          endTime: parseFloat(u.endTimeSeconds || '0'),
          confidence: parseFloat(u.confidenceScore || '1'),
        }));

        setUtterances(transformedUtterances);
      } catch (err) {
        console.error('Error fetching transcript:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transcript');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const handleTextSelect = (text: string, utteranceIds: string[]) => {
    setSelectedContext({ text, utteranceIds });
    setShowAIModal(true);
  };

  return (
    <>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Session Transcript
          </h1>
          <p className="text-sm text-gray-600">
            Select text to analyze with AI or extract quotes
          </p>
        </div>

        <TranscriptViewer
          sessionId={sessionId}
          utterances={mockUtterances}
          audioUrl="/audio/session-sample.mp3"
          onTextSelect={handleTextSelect}
        />
      </div>

      {/* AI Assistant Modal */}
      <Modal
        isOpen={showAIModal}
        onClose={() => {
          setShowAIModal(false);
          setSelectedContext(null);
        }}
        title=""
      >
        <div className="h-[600px]">
          <AIAssistant
            sessionId={sessionId}
            contextText={selectedContext?.text}
            initialPrompt="Analyze the key themes in this passage"
            onClose={() => {
              setShowAIModal(false);
              setSelectedContext(null);
            }}
          />
        </div>
      </Modal>
    </>
  );
}
