'use client';

import { useState } from 'react';
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
  locale: string;
};

export function TranscriptViewerClient({
  sessionId,
  locale: _locale,
}: TranscriptViewerClientProps) {
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedContext, setSelectedContext] = useState<{
    text: string;
    utteranceIds: string[];
  } | null>(null);

  // Mock data - In real implementation, this would come from API
  const mockUtterances: Utterance[] = [
    {
      id: '1',
      speakerId: 'spk1',
      speakerName: 'Dr. Sarah',
      speakerType: 'therapist',
      text: 'Good morning. How have you been feeling since our last session?',
      startTime: 0,
      endTime: 5,
      confidence: 0.95,
    },
    {
      id: '2',
      speakerId: 'spk2',
      speakerName: 'Emma',
      speakerType: 'patient',
      text: 'I\'ve been reflecting a lot on what we discussed. It\'s been challenging but also enlightening.',
      startTime: 6,
      endTime: 12,
      confidence: 0.92,
    },
    {
      id: '3',
      speakerId: 'spk1',
      speakerName: 'Dr. Sarah',
      speakerType: 'therapist',
      text: 'That\'s wonderful to hear. Can you tell me more about what felt enlightening?',
      startTime: 13,
      endTime: 18,
      confidence: 0.94,
    },
    {
      id: '4',
      speakerId: 'spk2',
      speakerName: 'Emma',
      speakerType: 'patient',
      text: 'I started writing down my thoughts each day, like you suggested. And I noticed patterns in how I respond to stress. It\'s like I\'m finally seeing myself from the outside.',
      startTime: 19,
      endTime: 30,
      confidence: 0.91,
    },
    {
      id: '5',
      speakerId: 'spk1',
      speakerName: 'Dr. Sarah',
      speakerType: 'therapist',
      text: 'That\'s a significant insight. When you say you\'re seeing yourself from the outside, what does that perspective reveal?',
      startTime: 31,
      endTime: 39,
      confidence: 0.96,
    },
    {
      id: '6',
      speakerId: 'spk2',
      speakerName: 'Emma',
      speakerType: 'patient',
      text: 'It reveals that I\'m stronger than I thought. That even in difficult moments, there\'s a part of me that knows how to cope. It\'s just about learning to trust that part more.',
      startTime: 40,
      endTime: 52,
      confidence: 0.93,
    },
    {
      id: '7',
      speakerId: 'spk1',
      speakerName: 'Dr. Sarah',
      speakerType: 'therapist',
      text: 'That\'s beautiful, Emma. You\'re describing a really important shift in your narrative. Tell me more about that stronger part of yourself.',
      startTime: 53,
      endTime: 62,
      confidence: 0.95,
    },
    {
      id: '8',
      speakerId: 'spk2',
      speakerName: 'Emma',
      speakerType: 'patient',
      text: 'Well, it\'s the part that got me through last year when everything felt impossible. The part that kept showing up, even when I didn\'t feel like it. I think I\'ve been so focused on what went wrong that I forgot about all the small victories.',
      startTime: 63,
      endTime: 80,
      confidence: 0.90,
    },
  ];

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
