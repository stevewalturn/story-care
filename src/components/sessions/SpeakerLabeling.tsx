'use client';

import { Pause, Play, RefreshCw, User, Users } from 'lucide-react';
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
    getAutoAssignedSpeakers(initialSpeakers),
  );
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isRetrying, setIsRetrying] = useState(false);
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
      prev.map((s) => {
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
      prev.map((s) => {
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

  // Get display avatar based on speaker type (for immediate visual feedback)
  const getDisplayAvatar = (speaker: Speaker): string | undefined => {
    // Priority 1: Type-based override for immediate feedback
    if (speaker.type === 'therapist') {
      return sessionContext.therapistAvatarUrl || undefined;
    }

    if (speaker.type === 'patient') {
      return sessionContext.patientAvatarUrl || undefined;
    }

    if (speaker.type === 'group_member' && speaker.userId) {
      const member = groupMembers.find(m => m.userId === speaker.userId);
      return member?.avatarUrl;
    }

    // Priority 2: Original speaker avatar (if userId already assigned)
    return speaker.avatarUrl;
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

  const handleRetrySpeakerLabeling = async () => {
    if (isRetrying) return;

    try {
      setIsRetrying(true);

      // Add 2-minute timeout for long-running transcription
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

      try {
        const response = await authenticatedFetch(
          `/api/sessions/${sessionId}/transcribe`,
          user,
          {
            method: 'POST',
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Extract actual error message from API response
          let errorMessage = `HTTP ${response.status}: Failed to retry speaker labeling`;
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // If response is not JSON, use status text
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Validate response structure
        if (!data.speakers || !Array.isArray(data.speakers)) {
          throw new Error('Invalid response format: Missing speakers array');
        }

        // Transform new speakers data to match component interface
        const newSpeakers: Speaker[] = data.speakers.map((speaker: any) => ({
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

        // Apply auto-assignment to new speakers
        setSpeakers(getAutoAssignedSpeakers(newSpeakers));

        console.log('Speaker labeling retried successfully', {
          speakerCount: newSpeakers.length,
          utteranceCount: data.utteranceCount,
        });

        alert(`Speaker labeling completed successfully! Found ${newSpeakers.length} speaker(s).`);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error('Error retrying speaker labeling:', error);

      // Show specific error message
      let errorMessage = 'Failed to retry speaker labeling. Please try again.';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Transcription is taking longer than expected. Please try again or check the audio file.';
        } else {
          errorMessage = `Failed to retry speaker labeling: ${error.message}`;
        }
      }

      alert(errorMessage);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-50">Label Speakers</h2>
            <p className="mt-1 text-sm text-gray-300">
              Identify each speaker from the session transcript
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleRetrySpeakerLabeling}
              disabled={isRetrying}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry Speaker Labeling'}
            </Button>
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

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-lg border border-purple-900/30 bg-purple-900/20 p-4">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-purple-300">
              <strong className="font-semibold">Tip:</strong>
              {' '}
              Listen to each speaker's audio sample, then assign their role and name. Use the Previous/Next buttons to navigate between segments.
            </p>
          </div>
        </div>

        {/* Speaker Cards */}
        <div className="space-y-6">
          {speakers.map((speaker) => {
            const isSelected = selectedForMerge.includes(speaker.id);
            return (
              <div
                key={speaker.id}
                className={`rounded-lg border transition-all duration-200 ${
                  mergeMode
                    ? isSelected
                      ? 'border-purple-500 bg-purple-900/20 shadow-md'
                      : 'cursor-pointer border-gray-700 bg-gray-800 hover:border-purple-500 hover:shadow-sm'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:shadow-sm'
                }`}
                onClick={() => mergeMode && toggleMergeSelection(speaker.id)}
              >
                {/* Card Header with Avatar and Segment Navigation */}
                <div className="border-b border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    {/* Left: Avatar + Info */}
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-700">
                        {getDisplayAvatar(speaker) && !imageErrors.has(speaker.id)
                          ? (
                              <img
                                src={getDisplayAvatar(speaker)}
                                alt={speaker.name || speaker.label}
                                className="h-full w-full object-cover"
                                onError={() => handleImageError(speaker.id)}
                              />
                            )
                          : speaker.type === 'therapist'
                            ? (
                                <User className="h-7 w-7 text-gray-400" />
                              )
                            : speaker.type === 'group_member'
                              ? (
                                  <Users className="h-7 w-7 text-gray-400" />
                                )
                              : (
                                  <span className="text-lg font-semibold text-gray-400">
                                    {speaker.label.replace('Speaker ', 'S')}
                                  </span>
                                )}
                      </div>

                      {/* Speaker Label + Stats */}
                      <div>
                        <h3 className="text-base font-semibold text-gray-50">
                          {speaker.label}
                        </h3>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {speaker.utteranceCount}
                          {' '}
                          utterances •
                          {' '}
                          {formatDuration(speaker.totalDuration)}
                        </p>
                      </div>
                    </div>

                    {/* Right: Segment Navigation Controls */}
                    {!mergeMode && (
                      <div className="flex items-center gap-2">
                        {/* Previous Button */}
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-600 bg-gray-700 text-gray-300 transition-colors hover:bg-gray-600 hover:text-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Previous segment"
                          disabled
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        {/* Play/Pause Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayPause(speaker.id, speaker.sampleAudioUrl);
                          }}
                          disabled={loadingAudio === speaker.id}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white transition-all hover:scale-105 hover:bg-purple-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                          title={playingId === speaker.id ? 'Pause' : 'Play audio sample'}
                        >
                          {loadingAudio === speaker.id
                            ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              )
                            : playingId === speaker.id
                              ? (
                                  <Pause className="h-5 w-5" />
                                )
                              : (
                                  <Play className="ml-0.5 h-5 w-5" />
                                )}
                        </button>

                        {/* Next Button */}
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-600 bg-gray-700 text-gray-300 transition-colors hover:bg-gray-600 hover:text-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Next segment"
                          disabled
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                {!mergeMode && (
                  <div className="space-y-4 p-4">
                    {/* Sample Text Preview */}
                    <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                      <p className="mb-2 text-xs font-medium text-gray-400">Sample Text:</p>
                      <p className="text-sm leading-relaxed text-gray-300">
                        "This is a sample utterance from the speaker. In the actual implementation, this would show a real excerpt from the transcript..."
                      </p>
                    </div>

                    {/* Two-Column Grid for Type and Name */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Type Dropdown */}
                      <div>
                        <label className="mb-2 block text-xs font-medium text-gray-400">
                          Type
                        </label>
                        <Dropdown
                          value={speaker.type || ''}
                          onChange={value => handleTypeChange(speaker.id, value)}
                          options={speakerTypeOptions}
                          placeholder="Select type..."
                        />
                      </div>

                      {/* Name Dropdown/Input */}
                      <div>
                        <label className="mb-2 block text-xs font-medium text-gray-400">
                          Name
                        </label>
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
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-gray-700 pt-6">
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
          <p className="text-center text-sm text-gray-400">
            Please label all speakers before continuing
          </p>
        )}
      </div>
    </div>
  );
}
