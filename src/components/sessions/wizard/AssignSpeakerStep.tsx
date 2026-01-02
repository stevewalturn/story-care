'use client';

import type { SessionFormData } from './types';
import { Check, ChevronDown, MessageCircle, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type ErrorDetails = {
  message: string;
  timestamp: string;
  sessionId: string;
  speakerCount: number;
  stack?: string;
  rawError?: string;
};

type AssignSpeakerStepProps = {
  formData: SessionFormData;
  onNext: (sessionId: string) => void;
  onBack: () => void;
  setStepReady: (ready: boolean) => void;
  stepProceedRef: { current: (() => void) | null };
};

type Speaker = {
  id: string;
  label: string;
  type: 'therapist' | 'patient' | null;
  name: string;
  userId?: string; // Links to users table (therapist or patient ID)
  avatarUrl?: string; // Profile picture URL
  utteranceCount: number;
  totalDuration: number;
  sampleText: string;
  sampleAudioUrl?: string; // Caches audio URL after first fetch
};

type CachedUtterance = {
  id: string;
  text: string;
  startTimeSeconds: string;
  endTimeSeconds: string;
  sequenceNumber: number;
};

type UtteranceCache = Map<string, {
  utterances: CachedUtterance[];
  total: number;
  loadedAll: boolean;
}>;

export function AssignSpeakerStep({ formData, onNext, onBack, setStepReady, stepProceedRef }: AssignSpeakerStepProps) {
  const { user, dbUser } = useAuth();
  const [isGenerating, setIsGenerating] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [_isSaving, _setIsSaving] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());
  const [isMerging, setIsMerging] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState<string | null>(null);
  const [currentUtteranceIndex, setCurrentUtteranceIndex] = useState<Map<string, number>>(new Map());
  const [utteranceCache, setUtteranceCache] = useState<UtteranceCache>(new Map());
  const [loadingUtterances, setLoadingUtterances] = useState<Set<string>>(new Set());
  const [audioCache, setAudioCache] = useState<Map<string, string>>(new Map()); // Cache audio URLs per utterance
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const hasCreatedSession = useRef(false); // Guard against duplicate session creation

  useEffect(() => {
    // Guard: Prevent duplicate session creation from useEffect re-runs
    // This can happen due to: StrictMode, dependency changes, or parent re-renders
    if (hasCreatedSession.current) {
      console.log('[AssignSpeakerStep] Skipping - session already created');
      return;
    }

    if (!user?.uid || !formData.audioPath) return;

    // Mark as started BEFORE async operation to prevent race conditions
    hasCreatedSession.current = true;

    const createSessionAndTranscribe = async () => {
      try {
        const idToken = await user.getIdToken();

        // Create session
        // IMPORTANT: Use audioPath (permanent GCS path) for database storage, not audioUrl (presigned)
        const sessionData = {
          therapistId: user.uid,
          title: formData.title,
          sessionDate: formData.sessionDate,
          patientIds: formData.patientIds,
          audioUrl: formData.audioPath, // Save permanent path to database
        };

        const sessionResponse = await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify(sessionData),
        });

        if (!sessionResponse.ok) {
          const errorData = await sessionResponse.json();
          throw new Error(errorData.error || 'Failed to create session');
        }

        const { session } = await sessionResponse.json();
        console.log('[AssignSpeakerStep] Created session:', session.id);
        setSessionId(session.id);

        // Start transcription
        const transcribeResponse = await fetch(`/api/sessions/${session.id}/transcribe`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!transcribeResponse.ok) {
          throw new Error('Failed to start transcription');
        }

        const transcribeData = await transcribeResponse.json();

        // Simulate minimum loading time for better UX
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Transform speakers data
        const speakersData: Speaker[] = transcribeData.speakers?.map((speaker: any, index: number) => ({
          id: speaker.id,
          label: speaker.speakerLabel || `Speaker ${index + 1}`,
          type: index === 0 ? 'therapist' : index === 1 ? 'patient' : null,
          name: index === 0 ? (dbUser?.name || user?.email?.split('@')[0] || 'Therapist') : '',
          userId: index === 0 ? dbUser?.id : undefined,
          avatarUrl: index === 0 ? (dbUser?.avatarUrl || undefined) : undefined,
          utteranceCount: speaker.totalUtterances || 0,
          totalDuration: speaker.totalDurationSeconds || 0,
          sampleText: speaker.sampleText || 'Really nice to see you.',
        })) || [];

        console.log('[AssignSpeakerStep] Received speakers from transcription:', speakersData.map(s => ({ id: s.id, label: s.label })));
        setSpeakers(speakersData);

        // Initialize utterance index to 0 for all speakers
        setCurrentUtteranceIndex(new Map(speakersData.map(s => [s.id, 0])));

        // Pre-populate cache with first utterance
        setUtteranceCache(
          new Map(speakersData.map(s => [s.id, {
            utterances: s.sampleText ? [{
              id: '',
              text: s.sampleText,
              startTimeSeconds: '0',
              endTimeSeconds: '0',
              sequenceNumber: 0,
            }] : [],
            total: s.utteranceCount,
            loadedAll: false,
          }])),
        );

        setIsGenerating(false);
      } catch (error) {
        console.error('Error:', error);
        hasCreatedSession.current = false; // Reset on error to allow retry
        toast.error(error instanceof Error ? error.message : 'Failed to process session. Please try again.');
        onBack(); // Go back to upload step on error
      }
    };

    createSessionAndTranscribe();
  // Use stable primitive values to prevent unnecessary re-runs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, formData.audioPath, dbUser?.id]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Show toast when transcription completes
  useEffect(() => {
    if (!isGenerating && speakers.length > 0) {
      toast.success('Transcription complete!', {
        description: 'You can now review and assign speakers.',
      });
    }
  }, [isGenerating, speakers.length]);

  // Click-outside handler for patient dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!patientDropdownOpen) return;

      // Check if click is outside the dropdown container
      const dropdownElement = dropdownRefs.current.get(patientDropdownOpen);
      if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
        setPatientDropdownOpen(null);
      }
    };

    if (patientDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [patientDropdownOpen]);

  const handleSpeakerTypeChange = (speakerId: string, type: string) => {
    setSpeakers(prev =>
      prev.map((s) => {
        if (s.id === speakerId) {
          let autoName = s.name;
          let autoUserId: string | undefined;
          let autoAvatarUrl: string | undefined;

          if (type === 'therapist') {
            // Use therapist's name and ID from auth context
            autoName = dbUser?.name || user?.email?.split('@')[0] || 'Therapist';
            autoUserId = dbUser?.id;
            autoAvatarUrl = dbUser?.avatarUrl || undefined;
          } else if (type === 'patient') {
            // Use selected patient's name and ID if available
            if (formData.selectedPatients && formData.selectedPatients.length > 0) {
              if (formData.selectedPatients.length === 1) {
                // Only one patient - auto-assign
                const patient = formData.selectedPatients[0];
                autoName = patient?.name || '';
                autoUserId = patient?.id;
                autoAvatarUrl = patient?.avatarUrl || patient?.referenceImageUrl;
              } else {
                // Multiple patients - clear name to force dropdown selection
                autoName = '';
                autoUserId = undefined;
                autoAvatarUrl = undefined;
              }
            } else {
              // No patients selected - use default
              autoName = 'Patient';
              autoUserId = undefined;
              autoAvatarUrl = undefined;
            }
          }

          return { ...s, type: type as 'therapist' | 'patient', name: autoName, userId: autoUserId, avatarUrl: autoAvatarUrl };
        }
        return s;
      }),
    );
  };

  const handleSpeakerNameChange = (speakerId: string, name: string, userId?: string, avatarUrl?: string) => {
    setSpeakers(prev =>
      prev.map(s => (s.id === speakerId ? { ...s, name, userId: userId || s.userId, avatarUrl: avatarUrl || s.avatarUrl } : s)),
    );
  };

  const handleNext = async () => {
    // Validate all speakers have types assigned
    const unassignedSpeakers = speakers.filter(s => !s.type);
    if (unassignedSpeakers.length > 0) {
      toast.error(
        `Please assign a type to all speakers. ${unassignedSpeakers.length} speaker(s) are unassigned.`,
      );
      return;
    }

    // Validate therapist speakers have names
    const unnamedTherapists = speakers.filter(s => s.type === 'therapist' && !s.name.trim());
    if (unnamedTherapists.length > 0) {
      toast.error('All therapist speakers must have a name assigned.');
      return;
    }

    // Validate patient speakers have names (especially important for group sessions)
    const unnamedPatients = speakers.filter(s => s.type === 'patient' && !s.name.trim());
    if (unnamedPatients.length > 0) {
      toast.error('All patient speakers must have a name assigned. Please select a patient for each speaker.');
      return;
    }

    try {
      _setIsSaving(true);
      const idToken = await user!.getIdToken();

      // Debug: Log speaker data being sent
      console.log('=== SAVING SPEAKERS ===');
      console.log('Session ID:', sessionId);
      console.log('Speaker IDs being sent:', speakers.map(s => s.id));
      console.log('Full speakers data:', JSON.stringify(speakers, null, 2));

      // Save speaker assignments
      const response = await fetch(`/api/sessions/${sessionId}/speakers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ speakers }),
      });

      // Validate response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Parse response data
      const data = await response.json();
      console.log('Speakers saved successfully:', data);

      // Only proceed if successful
      onNext(sessionId);
    } catch (error) {
      // Enhanced error logging for debugging intermittent issues
      const errorInfo: ErrorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        sessionId,
        speakerCount: speakers.length,
        stack: error instanceof Error ? error.stack : undefined,
        rawError: String(error),
      };
      console.error('Speaker save error:', errorInfo);

      // Show error modal with details
      setErrorDetails(errorInfo);
      setErrorModalOpen(true);

      toast.error('Failed to save speakers. See details in the error popup.');
      // DO NOT call onNext() on error - user stays on current step
    } finally {
      _setIsSaving(false);
    }
  };

  // Update parent's proceed ref and ready state
  useEffect(() => {
    stepProceedRef.current = handleNext;
    const allSpeakersAssigned = speakers.length > 0 && speakers.every(s => s.type && s.name.trim());
    setStepReady(allSpeakersAssigned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakers]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async (speakerId: string) => {
    // If clicking currently playing speaker, pause it
    if (playingId === speakerId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    // Get current utterance index for this speaker
    const currentIndex = currentUtteranceIndex.get(speakerId) ?? 0;

    // Check cache for this specific utterance
    const cacheKey = `${speakerId}-${currentIndex}`;
    let audioUrl = audioCache.get(cacheKey);

    // If audio URL not cached for this utterance, fetch from API
    if (!audioUrl) {
      try {
        setLoadingAudio(speakerId);

        // Pass utterance index to API
        const response = await authenticatedFetch(
          `/api/sessions/${sessionId}/speakers/${speakerId}/audio?index=${currentIndex}`,
          user,
        );

        if (!response.ok) {
          throw new Error('Failed to fetch audio sample');
        }

        const data = await response.json();
        audioUrl = data.audioUrl;

        // Validate audioUrl before proceeding
        if (!audioUrl || typeof audioUrl !== 'string') {
          console.error('Invalid audio URL received from API:', data);
          toast.error('Failed to load audio sample');
          setLoadingAudio(null);
          return;
        }

        // Cache the audio URL for this specific utterance
        setAudioCache(prev => new Map(prev).set(cacheKey, audioUrl as string));
      } catch (error) {
        console.error('Error fetching audio sample:', error);
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
    // API returns presigned GCS URL with proper CORS headers
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      setPlayingId(null);
    });

    audio.addEventListener('error', (e) => {
      console.error('Error playing audio:', e);
      console.error('Audio URL:', audioUrl);
      console.error('Audio error details:', audio.error);
      setPlayingId(null);
      setLoadingAudio(null); // Ensure loading state is cleared
      toast.error('Failed to play audio sample');
    });

    // Add 'playing' event listener to clear loading when audio actually starts
    audio.addEventListener('playing', () => {
      setLoadingAudio(null); // Clear loading only when audio actually starts playing
      setPlayingId(speakerId); // Set playing state
    });

    try {
      setLoadingAudio(speakerId); // Show loading while audio starts
      await audio.play(); // Start playback - loading stays visible until 'playing' event
    } catch (error) {
      console.error('Error playing audio:', error);
      setLoadingAudio(null);
      setPlayingId(null);
      toast.error('Failed to play audio sample');
    }
  };

  const toggleMergeSelection = (speakerId: string) => {
    setSelectedForMerge((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(speakerId)) {
        newSet.delete(speakerId);
      } else {
        newSet.add(speakerId);
      }
      return newSet;
    });
  };

  const handleMergeSpeakers = async () => {
    if (selectedForMerge.size < 2) {
      toast.error('Please select at least 2 speakers to merge');
      return;
    }

    setIsMerging(true);
    try {
      const idToken = await user!.getIdToken();
      const speakerIds = Array.from(selectedForMerge);

      const response = await fetch(`/api/sessions/${sessionId}/speakers/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ speakerIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to merge speakers');
      }

      const { mergedSpeaker } = await response.json();

      // Remove merged speakers and add the new merged speaker
      setSpeakers((prev) => {
        const remaining = prev.filter(s => !selectedForMerge.has(s.id));
        return [...remaining, mergedSpeaker];
      });

      // Reset merge mode and selection
      setSelectedForMerge(new Set());
      setMergeMode(false);
    } catch (error) {
      console.error('Error merging speakers:', error);
      toast.error('Failed to merge speakers. Please try again.');
    } finally {
      setIsMerging(false);
    }
  };

  const handleRetryTranscribe = async () => {
    const confirmed = window.confirm(
      'Retrying transcription will clear all speaker assignments. You will need to re-assign speaker types and names. Continue?',
    );

    if (!confirmed) return;

    setIsRetrying(true);
    setStepReady(false);

    try {
      const idToken = await user!.getIdToken();

      const response = await fetch(`/api/sessions/${sessionId}/transcribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to retry transcription');
      }

      const data = await response.json();

      // Transform speakers to match component state
      const transformedSpeakers: Speaker[] = data.speakers.map((s: any) => ({
        id: s.id,
        speakerLabel: s.speakerLabel,
        type: null, // Reset to null - user must reassign
        name: '', // Reset to empty
        userId: undefined,
        avatarUrl: undefined,
        sampleText: s.sampleText || '',
        utteranceCount: s.totalUtterances || 0,
        duration: s.totalDurationSeconds || 0,
      }));

      setSpeakers(transformedSpeakers);
      setStepReady(true);

      // Show success message
      toast.success('Transcription retried successfully. Please reassign speaker types.');
    } catch (error) {
      console.error('Error retrying transcription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry transcription';
      toast.error(errorMessage);
    } finally {
      setIsRetrying(false);
    }
  };

  const fetchUtterancesForSpeaker = async (speakerId: string, offset: number = 0) => {
    setLoadingUtterances(prev => new Set(prev).add(speakerId));

    try {
      const response = await authenticatedFetch(
        `/api/sessions/${sessionId}/speakers/${speakerId}/utterances?offset=${offset}&limit=10`,
        user,
      );

      if (!response.ok) throw new Error('Failed to fetch utterances');

      const data = await response.json();

      setUtteranceCache((prev) => {
        const newCache = new Map(prev);
        const existing = newCache.get(speakerId) || {
          utterances: [],
          total: 0,
          loadedAll: false,
        };

        const mergedUtterances = [...existing.utterances];
        for (const utterance of data.utterances) {
          if (!mergedUtterances.find(u => u.id === utterance.id)) {
            mergedUtterances.push(utterance);
          }
        }

        mergedUtterances.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

        newCache.set(speakerId, {
          utterances: mergedUtterances,
          total: data.total ?? existing.total,
          loadedAll: !data.hasMore && mergedUtterances.length >= (data.total ?? existing.total),
        });

        return newCache;
      });
    } catch (error) {
      console.error('Error fetching utterances:', error);
      toast.error('Failed to load utterances');
    } finally {
      setLoadingUtterances((prev) => {
        const newSet = new Set(prev);
        newSet.delete(speakerId);
        return newSet;
      });
    }
  };

  const handleSkipForward = async (speakerId: string) => {
    const currentIndex = currentUtteranceIndex.get(speakerId) ?? 0;
    const cache = utteranceCache.get(speakerId);
    const speaker = speakers.find(s => s.id === speakerId);

    if (!cache || !speaker) return;

    const nextIndex = currentIndex + 1;

    if (nextIndex >= speaker.utteranceCount) {
      toast.info('No more utterances');
      return;
    }

    if (nextIndex >= cache.utterances.length && !cache.loadedAll) {
      await fetchUtterancesForSpeaker(speakerId, cache.utterances.length);
    }

    setCurrentUtteranceIndex(prev => new Map(prev).set(speakerId, nextIndex));

    const newCache = utteranceCache.get(speakerId);
    const utterance = newCache?.utterances[nextIndex];
    if (utterance) {
      setSpeakers(prev =>
        prev.map(s => s.id === speakerId ? { ...s, sampleText: utterance.text } : s),
      );
    }
  };

  const handleSkipBack = (speakerId: string) => {
    const currentIndex = currentUtteranceIndex.get(speakerId) ?? 0;
    const cache = utteranceCache.get(speakerId);

    if (currentIndex <= 0) {
      toast.info('Already at first utterance');
      return;
    }

    const prevIndex = currentIndex - 1;
    setCurrentUtteranceIndex(prev => new Map(prev).set(speakerId, prevIndex));

    const utterance = cache?.utterances[prevIndex];
    if (utterance) {
      setSpeakers(prev =>
        prev.map(s => s.id === speakerId ? { ...s, sampleText: utterance.text } : s),
      );
    }
  };

  if (isGenerating) {
    return (
      <div className="py-20">
        <div className="text-center">
          {/* Generating Illustration */}
          <div className="mx-auto mb-8 flex h-40 w-40 items-center justify-center">
            <div className="relative">
              {/* Speech Bubble 1 - Audio Waveform (Left/Background) */}
              <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-4 border-white bg-indigo-100 shadow-md">
                <div className="flex h-full items-center justify-center gap-1.5">
                  {/* 5 Animated Waveform Bars */}
                  <div className="animate-waveform-1 w-1.5 rounded-full bg-indigo-500" />
                  <div className="animate-waveform-2 w-1.5 rounded-full bg-indigo-500" />
                  <div className="animate-waveform-3 w-1.5 rounded-full bg-indigo-500" />
                  <div className="animate-waveform-4 w-1.5 rounded-full bg-indigo-500" />
                  <div className="animate-waveform-5 w-1.5 rounded-full bg-indigo-500" />
                </div>
              </div>

              {/* Speech Bubble 2 - Play Button (Right/Foreground) */}
              <div className="absolute right-0 bottom-0 h-28 w-28 rounded-full border-4 border-white bg-purple-700 shadow-lg">
                <div className="flex h-full items-center justify-center">
                  <MessageCircle className="absolute h-20 w-20 text-white" strokeWidth={1.5} />
                  <Play className="h-10 w-10 fill-white text-white" strokeWidth={0} />
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900">Generating transcript</h3>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-500">
            Detecting speech and assigning speakers.
            <br />
            You can review and edit once it's ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Speaker Labeling</h2>
        <p className="mt-2 text-sm text-gray-500">Complete speaker labeling before saving</p>
      </div>

      {/* Control Area */}
      <div className="mx-auto mb-4 flex max-w-[2000px] items-center justify-between gap-3 px-8">
        {/* Retry Transcribe Button */}
        <button
          type="button"
          onClick={handleRetryTranscribe}
          disabled={isRetrying || isGenerating}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isRetrying || isGenerating
              ? 'cursor-not-allowed bg-gray-300 text-gray-500'
              : 'border border-orange-500 text-orange-600 hover:bg-orange-50'
          }`}
          title="Re-run transcription if Deepgram result is incorrect"
        >
          {isRetrying ? (
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Retrying...</span>
            </div>
          ) : (
            'Retry Transcribe'
          )}
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setMergeMode(!mergeMode);
              setSelectedForMerge(new Set());
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mergeMode
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {mergeMode ? 'Exit Merge Mode' : 'Merge Mode'}
          </button>

          {mergeMode && selectedForMerge.size >= 2 && (
            <button
              type="button"
              onClick={handleMergeSpeakers}
              disabled={isMerging}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                isMerging
                  ? 'cursor-not-allowed bg-purple-400'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isMerging ? (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Merging...</span>
                </div>
              ) : (
                `Merge ${selectedForMerge.size} Speakers`
              )}
            </button>
          )}
        </div>
      </div>

      {/* Speaker Cards */}
      <div className="mx-auto max-w-[2000px] space-y-6 px-8">
        {speakers.map((speaker, index) => (
          <div
            key={speaker.id}
            onClick={() => mergeMode && toggleMergeSelection(speaker.id)}
            className={`relative space-y-4 rounded-xl p-6 transition-all duration-200 ${
              mergeMode
                ? selectedForMerge.has(speaker.id)
                  ? 'cursor-pointer border-2 border-purple-500 bg-purple-50 shadow-md'
                  : 'cursor-pointer border-2 border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                : 'border border-gray-200 bg-white'
            }`}
          >
            {/* Selection indicator for merge mode */}
            {mergeMode && (
              <div className="absolute top-4 right-4 z-10">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${
                    selectedForMerge.has(speaker.id)
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {selectedForMerge.has(speaker.id) && (
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            )}
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  {speaker.avatarUrl && (
                    <img
                      src={speaker.avatarUrl}
                      alt={speaker.name || `Speaker ${index + 1}`}
                      className="h-10 w-10 rounded-full border-2 border-gray-200 object-cover"
                      onError={(e) => {
                        // Hide broken image and show fallback
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  )}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 bg-gradient-to-br from-purple-500 to-indigo-600 text-sm font-semibold text-white ${speaker.avatarUrl ? 'hidden' : ''}`}>
                    {speaker.name ? speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : `S${index + 1}`}
                  </div>
                </div>
                <h3 className="text-base font-medium text-gray-900">
                  Speaker
                  {' '}
                  {index + 1}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MessageCircle className="h-4 w-4" />
                <span>
                  {speaker.utteranceCount}
                  {' '}
                  Segments
                </span>
                <span>•</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={2} />
                  <path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" />
                </svg>
                <span>{formatDuration(speaker.totalDuration)}</span>
              </div>
            </div>

            {/* Type and Name Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Speaker Type
                </label>
                <select
                  value={speaker.type || ''}
                  onChange={e => handleSpeakerTypeChange(speaker.id, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">Select type...</option>
                  <option value="therapist">Therapist</option>
                  <option value="patient">Patient</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name
                </label>
                {speaker.type === 'therapist' ? (
                  <input
                    type="text"
                    value={speaker.name || ''}
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
                  />
                ) : speaker.type === 'patient' ? (
                  <div
                    className="relative"
                    ref={(el) => {
                      if (el) {
                        dropdownRefs.current.set(speaker.id, el);
                      } else {
                        dropdownRefs.current.delete(speaker.id);
                      }
                    }}
                  >
                    {/* Dropdown Button */}
                    <button
                      type="button"
                      onClick={() => setPatientDropdownOpen(
                        patientDropdownOpen === speaker.id ? null : speaker.id,
                      )}
                      className="flex w-full items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-left text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    >
                      {/* Show selected patient or placeholder */}
                      {speaker.userId && formData.selectedPatients?.find(p => p.id === speaker.userId) ? (
                        <>
                          {/* Selected Patient Avatar */}
                          {(() => {
                            const selectedPatient = formData.selectedPatients.find(p => p.id === speaker.userId);
                            const avatarUrl = selectedPatient?.avatarUrl || selectedPatient?.referenceImageUrl;
                            return avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={selectedPatient.name}
                                className="h-6 w-6 flex-shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-600">
                                {selectedPatient?.name.charAt(0).toUpperCase()}
                              </div>
                            );
                          })()}
                          <span className="flex-1 text-gray-900">
                            {formData.selectedPatients.find(p => p.id === speaker.userId)?.name}
                          </span>
                        </>
                      ) : (
                        <span className="flex-1 text-gray-400">Select patient...</span>
                      )}
                      <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {patientDropdownOpen === speaker.id && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                        {formData.selectedPatients && formData.selectedPatients.length > 0 ? (
                          formData.selectedPatients.map((patient) => {
                            const avatarUrl = patient.avatarUrl || patient.referenceImageUrl;
                            return (
                              <button
                                key={patient.id}
                                type="button"
                                onClick={() => {
                                  handleSpeakerNameChange(
                                    speaker.id,
                                    patient.name,
                                    patient.id,
                                    avatarUrl,
                                  );
                                  setPatientDropdownOpen(null);
                                }}
                                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-purple-50"
                              >
                                {/* Patient Avatar */}
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={patient.name}
                                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">
                                    {patient.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                {/* Patient Name */}
                                <span className="flex-1 text-gray-900">{patient.name}</span>
                                {/* Checkmark if selected */}
                                {speaker.userId === patient.id && (
                                  <Check className="h-4 w-4 flex-shrink-0 text-purple-600" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-4 text-center text-sm text-gray-500">
                            No patients available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value=""
                    disabled
                    placeholder="Select speaker type first"
                    className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400"
                  />
                )}
              </div>
            </div>

            {/* Sample Quote with Audio Controls */}
            <div className="rounded-lg bg-gray-50 p-4">
              {/* Quote Text / Waveform */}
              {loadingUtterances.has(speaker.id) ? (
                <div className="mb-4 flex items-center justify-center py-2">
                  <svg className="h-4 w-4 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : playingId === speaker.id ? (
                <div className="mb-4 flex items-center justify-center gap-1.5 py-2">
                  {[...Array.from({ length: 12 })].map((_, i) => (
                    <div
                      key={i}
                      className={`animate-waveform-${(i % 5) + 1} w-1 rounded-full bg-purple-500`}
                      style={{ height: '16px' }}
                    />
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-sm text-gray-600">
                  "
                  {speaker.sampleText}
                  "
                </p>
              )}

              {/* Counter and Controls */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {(currentUtteranceIndex.get(speaker.id) ?? 0) + 1}
                  /
                  {speaker.utteranceCount}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSkipBack(speaker.id)}
                    disabled={
                      (currentUtteranceIndex.get(speaker.id) ?? 0) === 0
                      || loadingUtterances.has(speaker.id)
                    }
                    className="rounded p-2 text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Previous segment"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlayPause(speaker.id)}
                    disabled={loadingAudio === speaker.id}
                    className="rounded p-2 text-gray-900 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                    title={playingId === speaker.id ? 'Pause' : 'Play'}
                  >
                    {loadingAudio === speaker.id ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : playingId === speaker.id ? (
                      <Pause className="h-4 w-4" fill="currentColor" />
                    ) : (
                      <Play className="h-4 w-4" fill="currentColor" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSkipForward(speaker.id)}
                    disabled={
                      (currentUtteranceIndex.get(speaker.id) ?? 0) >= speaker.utteranceCount - 1
                      || loadingUtterances.has(speaker.id)
                    }
                    className="rounded p-2 text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Next segment"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Details Modal */}
      <Modal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Error Details"
        description="Something went wrong while saving speakers. Please share these details if reporting the issue."
        size="lg"
        footer={(
          <Button variant="primary" onClick={() => setErrorModalOpen(false)}>
            Close
          </Button>
        )}
      >
        {errorDetails && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Error Message</label>
              <div className="mt-1 rounded-md bg-red-50 p-3 text-sm text-red-800">
                {errorDetails.message}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                <div className="mt-1 rounded-md bg-gray-100 p-2 text-sm font-mono text-gray-800">
                  {errorDetails.timestamp}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Session ID</label>
                <div className="mt-1 truncate rounded-md bg-gray-100 p-2 text-sm font-mono text-gray-800">
                  {errorDetails.sessionId}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Speaker Count</label>
              <div className="mt-1 rounded-md bg-gray-100 p-2 text-sm text-gray-800">
                {errorDetails.speakerCount}
              </div>
            </div>

            {errorDetails.stack && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Stack Trace</label>
                <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-gray-900 p-3 text-xs text-green-400">
                  {errorDetails.stack}
                </pre>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Raw Error</label>
              <div className="mt-1 rounded-md bg-gray-100 p-2 text-sm font-mono text-gray-800">
                {errorDetails.rawError}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
