'use client';

import { useState } from 'react';
import { Play, Pause, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';

interface Speaker {
  id: string;
  label: string; // e.g., "Speaker 1", "Speaker 2"
  type: 'therapist' | 'patient' | 'group_member' | null;
  name: string;
  sampleAudioUrl?: string;
  utteranceCount: number;
  totalDuration: number; // in seconds
}

interface SpeakerLabelingProps {
  sessionId: string;
  speakers: Speaker[];
  onSave: (speakers: Speaker[]) => void;
  onCancel: () => void;
}

export function SpeakerLabeling({
  sessionId,
  speakers: initialSpeakers,
  onSave,
  onCancel,
}: SpeakerLabelingProps) {
  const [speakers, setSpeakers] = useState<Speaker[]>(initialSpeakers);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);

  const speakerTypeOptions = [
    { value: 'therapist', label: 'Therapist' },
    { value: 'patient', label: 'Patient' },
    { value: 'group_member', label: 'Group Member' },
  ];

  const handleTypeChange = (speakerId: string, type: string) => {
    setSpeakers((prev) =>
      prev.map((s) =>
        s.id === speakerId
          ? { ...s, type: type as Speaker['type'] }
          : s
      )
    );
  };

  const handleNameChange = (speakerId: string, name: string) => {
    setSpeakers((prev) =>
      prev.map((s) => (s.id === speakerId ? { ...s, name } : s))
    );
  };

  const handlePlayPause = (speakerId: string) => {
    if (playingId === speakerId) {
      // Pause - In real implementation, pause audio
      setPlayingId(null);
    } else {
      // Play - In real implementation, play audio
      setPlayingId(speakerId);
      // Simulate audio ending after 3 seconds
      setTimeout(() => setPlayingId(null), 3000);
    }
  };

  const toggleMergeSelection = (speakerId: string) => {
    setSelectedForMerge((prev) =>
      prev.includes(speakerId)
        ? prev.filter((id) => id !== speakerId)
        : [...prev, speakerId]
    );
  };

  const handleMerge = () => {
    if (selectedForMerge.length < 2) return;

    // Merge selected speakers into the first one
    const [primaryId, ...mergeIds] = selectedForMerge;
    const primary = speakers.find((s) => s.id === primaryId);
    const toMerge = speakers.filter((s) => mergeIds.includes(s.id));

    if (!primary) return;

    const mergedSpeaker = {
      ...primary,
      utteranceCount: toMerge.reduce(
        (sum, s) => sum + s.utteranceCount,
        primary.utteranceCount
      ),
      totalDuration: toMerge.reduce(
        (sum, s) => sum + s.totalDuration,
        primary.totalDuration
      ),
    };

    setSpeakers((prev) =>
      prev
        .filter((s) => !mergeIds.includes(s.id))
        .map((s) => (s.id === primaryId ? mergedSpeaker : s))
    );
    setSelectedForMerge([]);
    setMergeMode(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isComplete = speakers.every((s) => s.type && s.name.trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Label Speakers</h2>
          <p className="text-sm text-gray-600 mt-1">
            Identify each speaker from the session transcript
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setMergeMode(!mergeMode)}
          >
            {mergeMode ? 'Cancel Merge' : 'Merge Mode'}
          </Button>
          {mergeMode && selectedForMerge.length >= 2 && (
            <Button variant="secondary" onClick={handleMerge}>
              Merge {selectedForMerge.length} Speakers
            </Button>
          )}
        </div>
      </div>

      {/* Speaker Cards */}
      <div className="space-y-4">
        {speakers.map((speaker) => {
          const isSelected = selectedForMerge.includes(speaker.id);
          return (
            <div
              key={speaker.id}
              className={`border rounded-lg p-4 transition-all ${
                mergeMode
                  ? isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  : 'border-gray-200'
              }`}
              onClick={() => mergeMode && toggleMergeSelection(speaker.id)}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {speaker.type === 'therapist' ? (
                    <User className="w-6 h-6 text-gray-600" />
                  ) : speaker.type === 'group_member' ? (
                    <Users className="w-6 h-6 text-gray-600" />
                  ) : (
                    <span className="text-lg font-semibold text-gray-600">
                      {speaker.label.replace('Speaker ', 'S')}
                    </span>
                  )}
                </div>

                {/* Speaker Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      {speaker.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {speaker.utteranceCount} utterances • {formatDuration(speaker.totalDuration)}
                    </span>
                  </div>

                  {/* Controls */}
                  {!mergeMode && (
                    <div className="grid grid-cols-2 gap-3">
                      <Dropdown
                        value={speaker.type || ''}
                        onChange={(value) => handleTypeChange(speaker.id, value)}
                        options={speakerTypeOptions}
                        placeholder="Select type..."
                      />
                      <Input
                        value={speaker.name}
                        onChange={(e) => handleNameChange(speaker.id, e.target.value)}
                        placeholder="Enter name..."
                      />
                    </div>
                  )}
                </div>

                {/* Play Sample Button */}
                {speaker.sampleAudioUrl && !mergeMode && (
                  <Button
                    variant="icon"
                    onClick={() => handlePlayPause(speaker.id)}
                  >
                    {playingId === speaker.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => onSave(speakers)}
          disabled={!isComplete}
        >
          Save & Continue
        </Button>
      </div>

      {/* Progress */}
      {!isComplete && (
        <p className="text-sm text-gray-500 text-center">
          Please label all speakers before continuing
        </p>
      )}
    </div>
  );
}
