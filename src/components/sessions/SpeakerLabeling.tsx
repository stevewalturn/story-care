'use client';

import { Pause, Play, User, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type Speaker = {
  id: string;
  label: string; // e.g., "Speaker 1", "Speaker 2"
  type: 'therapist' | 'patient' | 'group_member' | null;
  name: string;
  userId?: string;
  avatarUrl?: string;
  sampleAudioUrl?: string;
  utteranceCount: number;
  totalDuration: number; // in seconds
};

type SessionContext = {
  sessionType: 'individual' | 'group';
  therapistName: string;
  patientName: string;
};

type GroupMember = {
  userId: string;
  name: string;
  avatarUrl?: string;
};

type SpeakerLabelingProps = {
  sessionId: string;
  speakers: Speaker[];
  sessionContext: SessionContext;
  groupMembers: GroupMember[];
  onSave: (speakers: Speaker[]) => void;
  onCancel: () => void;
};

export function SpeakerLabeling({
  sessionId,
  speakers: initialSpeakers,
  sessionContext,
  groupMembers,
  onSave,
  onCancel,
}: SpeakerLabelingProps) {
  const { user } = useAuth();

  // Smart auto-assignment for individual sessions
  const getAutoAssignedSpeakers = (speakers: Speaker[]): Speaker[] => {
    // Only auto-assign for individual sessions with exactly 2 speakers
    if (sessionContext.sessionType === 'individual' && speakers.length === 2) {
      return speakers.map((speaker, index) => {
        // Check if already assigned
        if (speaker.type && speaker.name) {
          return speaker;
        }

        // Auto-assign: Speaker 1 = Therapist, Speaker 2 = Patient
        if (index === 0) {
          return {
            ...speaker,
            type: 'therapist' as const,
            name: speaker.name || sessionContext.therapistName,
          };
        } else {
          return {
            ...speaker,
            type: 'patient' as const,
            name: speaker.name || sessionContext.patientName,
          };
        }
      });
    }

    // For group sessions, auto-assign Speaker 1 as therapist
    if (sessionContext.sessionType === 'group' && speakers.length > 0) {
      return speakers.map((speaker, index) => {
        // Check if already assigned
        if (speaker.type && speaker.name) {
          return speaker;
        }

        if (index === 0) {
          return {
            ...speaker,
            type: 'therapist' as const,
            name: speaker.name || sessionContext.therapistName,
          };
        } else {
          return {
            ...speaker,
            type: speaker.type || ('group_member' as const),
            name: speaker.name || `Group Member ${index}`,
          };
        }
      });
    }

    return speakers;
  };

  const [speakers, setSpeakers] = useState<Speaker[]>(() =>
    getAutoAssignedSpeakers(initialSpeakers)
  );
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleImageError = (speakerId: string) => {
    setImageErrors(prev => new Set(prev).add(speakerId));
  };

  const speakerTypeOptions = [
    { value: 'therapist', label: 'Therapist' },
    { value: 'patient', label: 'Patient' },
    { value: 'group_member', label: 'Group Member' },
  ];

  // Generate name options based on speaker type
  const getNameOptions = (speakerType: Speaker['type']) => {
    if (speakerType === 'therapist') {
      return [
        { value: sessionContext.therapistName, label: sessionContext.therapistName },
      ];
    }

    if (speakerType === 'patient') {
      return [
        { value: sessionContext.patientName, label: sessionContext.patientName },
      ];
    }

    if (speakerType === 'group_member') {
      // For group members, show actual group member names
      return groupMembers.map(member => ({
        value: member.userId,
        label: member.name,
      }));
    }

    return [];
  };

  const handleTypeChange = (speakerId: string, type: string) => {
    setSpeakers(prev =>
      prev.map(s => {
        if (s.id === speakerId) {
          const newType = type as Speaker['type'];
          // Auto-populate name and userId when type changes
          let newName = s.name;
          let newUserId = s.userId;

          if (newType === 'therapist') {
            newName = sessionContext.therapistName;
            newUserId = undefined; // Will be auto-linked by API
          } else if (newType === 'patient') {
            newName = sessionContext.patientName;
            newUserId = undefined; // Will be auto-linked by API
          } else if (newType === 'group_member') {
            // Keep existing selection or clear
            newName = '';
            newUserId = undefined;
          }

          return { ...s, type: newType, name: newName, userId: newUserId };
        }
        return s;
      }),
    );
  };

  const handleNameChange = (speakerId: string, value: string) => {
    setSpeakers(prev =>
      prev.map(s => {
        if (s.id === speakerId) {
          // For group members, value is userId
          if (s.type === 'group_member') {
            const member = groupMembers.find(m => m.userId === value);
            return {
              ...s,
              name: member?.name || value,
              userId: value,
            };
          }

          // For therapist/patient, value is name (userId handled by API)
          return { ...s, name: value, userId: undefined };
        }
        return s;
      }),
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
              className={`rounded-lg border p-4 transition-all duration-200 ${
                mergeMode
                  ? isSelected
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'cursor-pointer border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => mergeMode && toggleMergeSelection(speaker.id)}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 overflow-hidden">
                  {speaker.avatarUrl && !imageErrors.has(speaker.id)
                    ? (
                        <img
                          src={speaker.avatarUrl}
                          alt={speaker.name || speaker.label}
                          className="h-full w-full object-cover"
                          onError={() => handleImageError(speaker.id)}
                        />
                      )
                    : speaker.type === 'therapist'
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
                      {speaker.type
                        ? (
                            <Dropdown
                              value={speaker.name}
                              onChange={value => handleNameChange(speaker.id, value)}
                              options={getNameOptions(speaker.type)}
                              placeholder="Select name..."
                            />
                          )
                        : (
                            <Input
                              value={speaker.name}
                              onChange={e => handleNameChange(speaker.id, e.target.value)}
                              placeholder="Enter name..."
                              disabled
                            />
                          )}
                    </div>
                  )}
                </div>

                {/* Play Sample Button - Enhanced */}
                {!mergeMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause(speaker.id, speaker.sampleAudioUrl);
                    }}
                    disabled={loadingAudio === speaker.id}
                    className="group relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-all hover:scale-110 hover:bg-indigo-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    title="Play audio sample"
                  >
                    {loadingAudio === speaker.id
                      ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        )
                      : playingId === speaker.id
                        ? (
                            <Pause className="h-5 w-5" />
                          )
                        : (
                            <Play className="h-5 w-5 ml-0.5" />
                          )}
                    {/* Ripple effect on hover */}
                    <span className="absolute inset-0 rounded-full bg-indigo-600 opacity-0 transition-opacity group-hover:opacity-10" />
                  </button>
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
