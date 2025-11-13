'use client';

import { Pause, Play, User, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';

type Speaker = {
  id: string;
  label: string; // e.g., "Speaker 1", "Speaker 2"
  type: 'therapist' | 'patient' | 'group_member' | null;
  name: string;
  sampleAudioUrl?: string;
  utteranceCount: number;
  totalDuration: number; // in seconds
};

type SpeakerLabelingProps = {
  sessionId: string;
  speakers: Speaker[];
  onSave: (speakers: Speaker[]) => void;
  onCancel: () => void;
};

export function SpeakerLabeling({
  sessionId,
  speakers: initialSpeakers,
  onSave,
  onCancel,
}: SpeakerLabelingProps) {
  const { user } = useAuth();
  const [speakers, setSpeakers] = useState<Speaker[]>(initialSpeakers);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakerTypeOptions = [
    { value: 'therapist', label: 'Therapist' },
    { value: 'patient', label: 'Patient' },
    { value: 'group_member', label: 'Group Member' },
  ];

  const handleTypeChange = (speakerId: string, type: string) => {
    setSpeakers(prev =>
      prev.map(s =>
        s.id === speakerId
          ? { ...s, type: type as Speaker['type'] }
          : s,
      ),
    );
  };

  const handleNameChange = (speakerId: string, name: string) => {
    setSpeakers(prev =>
      prev.map(s => (s.id === speakerId ? { ...s, name } : s)),
    );
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = async (speakerId: string, audioUrl?: string) => {
    if (playingId === speakerId) {
      // Pause current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    if (!audioUrl) {
      // Generate sample audio URL from API if not provided
      try {
        setLoadingAudio(speakerId);
        const response = await authenticatedFetch(`/api/sessions/${sessionId}/speakers/${speakerId}/audio`, user);

        if (!response.ok) {
          throw new Error('Failed to fetch audio sample');
        }

        const data = await response.json();
        audioUrl = data.audioUrl;

        // Update speaker with audio URL for future plays
        setSpeakers(prev =>
          prev.map(s => s.id === speakerId ? { ...s, sampleAudioUrl: audioUrl } : s),
        );
      } catch (error) {
        console.error('Error fetching audio sample:', error);
        console.error('Failed to load audio sample. Please try again.');
        setLoadingAudio(null);
        return;
      } finally {
        setLoadingAudio(null);
      }
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Create and play new audio
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      setPlayingId(null);
    });

    audio.addEventListener('error', () => {
      console.error('Error playing audio');
      console.error('Failed to play audio sample. The file may be corrupted or unavailable.');
      setPlayingId(null);
    });

    try {
      await audio.play();
      setPlayingId(speakerId);
    } catch (error) {
      console.error('Error playing audio:', error);
      console.error('Failed to play audio. Please try again.');
      setPlayingId(null);
    }
  };

  const toggleMergeSelection = (speakerId: string) => {
    setSelectedForMerge(prev =>
      prev.includes(speakerId)
        ? prev.filter(id => id !== speakerId)
        : [...prev, speakerId],
    );
  };

  const handleMerge = () => {
    if (selectedForMerge.length < 2) {
      return;
    }

    // Merge selected speakers into the first one
    const [primaryId, ...mergeIds] = selectedForMerge;
    const primary = speakers.find(s => s.id === primaryId);
    const toMerge = speakers.filter(s => mergeIds.includes(s.id));

    if (!primary) {
      return;
    }

    const mergedSpeaker = {
      ...primary,
      utteranceCount: toMerge.reduce(
        (sum, s) => sum + s.utteranceCount,
        primary.utteranceCount,
      ),
      totalDuration: toMerge.reduce(
        (sum, s) => sum + s.totalDuration,
        primary.totalDuration,
      ),
    };

    setSpeakers(prev =>
      prev
        .filter(s => !mergeIds.includes(s.id))
        .map(s => (s.id === primaryId ? mergedSpeaker : s)),
    );
    setSelectedForMerge([]);
    setMergeMode(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isComplete = speakers.every(s => s.type && s.name.trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Label Speakers</h2>
          <p className="mt-1 text-sm text-gray-600">
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
              Merge
              {' '}
              {selectedForMerge.length}
              {' '}
              Speakers
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
              className={`rounded-lg border p-4 transition-all ${
                mergeMode
                  ? isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'cursor-pointer border-gray-200 hover:border-gray-300'
                  : 'border-gray-200'
              }`}
              onClick={() => mergeMode && toggleMergeSelection(speaker.id)}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                  {speaker.type === 'therapist'
                    ? (
                        <User className="h-6 w-6 text-gray-600" />
                      )
                    : speaker.type === 'group_member'
                      ? (
                          <Users className="h-6 w-6 text-gray-600" />
                        )
                      : (
                          <span className="text-lg font-semibold text-gray-600">
                            {speaker.label.replace('Speaker ', 'S')}
                          </span>
                        )}
                </div>

                {/* Speaker Info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {speaker.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {speaker.utteranceCount}
                      {' '}
                      utterances •
                      {formatDuration(speaker.totalDuration)}
                    </span>
                  </div>

                  {/* Controls */}
                  {!mergeMode && (
                    <div className="grid grid-cols-2 gap-3">
                      <Dropdown
                        value={speaker.type || ''}
                        onChange={value => handleTypeChange(speaker.id, value)}
                        options={speakerTypeOptions}
                        placeholder="Select type..."
                      />
                      <Input
                        value={speaker.name}
                        onChange={e => handleNameChange(speaker.id, e.target.value)}
                        placeholder="Enter name..."
                      />
                    </div>
                  )}
                </div>

                {/* Play Sample Button */}
                {!mergeMode && (
                  <Button
                    variant="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause(speaker.id, speaker.sampleAudioUrl);
                    }}
                    disabled={loadingAudio === speaker.id}
                  >
                    {loadingAudio === speaker.id
                      ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                        )
                      : playingId === speaker.id
                        ? (
                            <Pause className="h-4 w-4" />
                          )
                        : (
                            <Play className="h-4 w-4" />
                          )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4">
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
        <p className="text-center text-sm text-gray-500">
          Please label all speakers before continuing
        </p>
      )}
    </div>
  );
}
