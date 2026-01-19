'use client';

import { ArrowLeft, CheckCircle2, Link2, Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { VoiceRecorder } from '@/components/sessions/VoiceRecorder';
import { RecordingLinkGenerator } from '@/components/sessions/wizard/RecordingLinkGenerator';
import { Button } from '@/components/ui/Button';

type InputMode = 'record' | 'link';

export default function NewRecordingPage() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<InputMode>('record');
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [linkCreated, setLinkCreated] = useState(false);

  const handleRecordingComplete = (id: string) => {
    setRecordingId(id);
    setRecordingComplete(true);
  };

  const handleLinkCreated = (_linkId: string, _token: string) => {
    setLinkCreated(true);
  };

  const handleGoToRecordings = () => {
    router.push('/sessions/recordings');
  };

  const handleCreateSession = () => {
    if (recordingId) {
      router.push(`/sessions/new?recordingId=${recordingId}`);
    }
  };

  // Show success state after recording is complete
  if (recordingComplete && recordingId) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <h1 className="mb-2 text-2xl font-bold text-gray-900">Recording Saved</h1>
            <p className="mb-8 text-gray-500">
              Your recording has been saved successfully. You can create a session from it now or find it later in your recordings.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="primary" onClick={handleCreateSession}>
                Create Session Now
              </Button>
              <Button variant="secondary" onClick={handleGoToRecordings}>
                Go to Recordings
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Recording</h1>
        <p className="mt-1 text-sm text-gray-500">
          Record audio directly or generate a shareable link for mobile recording
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        {/* Mode Selector */}
        <div className="mb-6">
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setInputMode('record')}
              className={`
                flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all
                ${
    inputMode === 'record'
      ? 'bg-white text-purple-700 shadow-sm'
      : 'text-gray-600 hover:text-gray-900'
    }
              `}
            >
              <Mic className="h-4 w-4" />
              <span>Record Now</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('link')}
              className={`
                flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all
                ${
    inputMode === 'link'
      ? 'bg-white text-purple-700 shadow-sm'
      : 'text-gray-600 hover:text-gray-900'
    }
              `}
            >
              <Link2 className="h-4 w-4" />
              <span>Share Link</span>
            </button>
          </div>
        </div>

        {/* Record Mode */}
        {inputMode === 'record' && (
          <div className="rounded-2xl border-2 border-purple-200 bg-purple-50" style={{ minHeight: '400px' }}>
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              onError={error => alert(error.message)}
            />
          </div>
        )}

        {/* Link Mode */}
        {inputMode === 'link' && (
          <div className="rounded-2xl border-2 border-purple-200 bg-purple-50" style={{ minHeight: '400px' }}>
            <RecordingLinkGenerator
              formData={{ title: '', sessionDate: '', description: '', patientIds: [], audioFile: null }}
              onLinkCreated={handleLinkCreated}
              onError={error => alert(error.message)}
            />
          </div>
        )}

        {/* Info text for link mode */}
        {inputMode === 'link' && linkCreated && (
          <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <p>
              <strong>Note:</strong>
              {' '}
              After the recording is submitted via the link, you can find it in
              {' '}
              <a href="/sessions/recordings" className="font-medium underline">
                Recordings
              </a>
              {' '}
              and create a session from there.
            </p>
          </div>
        )}

        {/* Help text */}
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-gray-900">Tips</h3>
          <ul className="space-y-1 text-sm text-gray-500">
            <li>
              <strong>Record Now:</strong>
              {' '}
              Use your device's microphone to record directly in the browser.
            </li>
            <li>
              <strong>Share Link:</strong>
              {' '}
              Generate a link to send to someone else (e.g., for mobile recording).
            </li>
            <li>Recordings are automatically saved to the cloud and can be used to create sessions later.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
