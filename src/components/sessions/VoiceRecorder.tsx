'use client';

import { AlertCircle, CheckCircle2, Cloud, Mic, Pause, Play, Square, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioVisualizer } from '@/components/ui/AudioVisualizer';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

type VoiceRecorderProps = {
  onRecordingComplete: (recordingId: string) => void;
  onChunkUploaded?: (chunkIndex: number, totalDuration: number) => void;
  chunkIntervalMinutes?: number; // Default: 10
  maxDurationSeconds?: number; // Default: 10800 (3 hours)
  onError?: (error: Error) => void;
  disabled?: boolean;
  // For shareable link mode
  recordingLinkToken?: string;
};

type RecordingState = 'idle' | 'recording' | 'paused' | 'uploading' | 'completed' | 'error';

// Type for persisted recording state (for resume functionality)
type PersistedRecordingState = {
  recordingId: string;
  userId: string;
  startedAt: string;
  savedSeconds: number;
  currentChunkIndex: number;
};

const RECORDING_STATE_KEY = 'storycare_recording_state';

// Get supported MIME type for the browser
function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || 'audio/webm';
}

// Get file extension for MIME type
function getExtensionForMimeType(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

export function VoiceRecorder({
  onRecordingComplete,
  onChunkUploaded,
  chunkIntervalMinutes = 5,
  maxDurationSeconds = 10800, // 3 hours
  onError,
  disabled = false,
  recordingLinkToken,
}: VoiceRecorderProps) {
  const { user } = useAuth();

  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savedSeconds, setSavedSeconds] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resume state (for authenticated recordings)
  const [pendingResume, setPendingResume] = useState<PersistedRecordingState | null>(null);
  const [isCheckingResume, setIsCheckingResume] = useState(false);

  // Audio visualization
  const [audioLevel, setAudioLevel] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');

  // Playback state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Create recording entry in database
  const createRecordingEntry = async (): Promise<string> => {
    if (!user && !recordingLinkToken) {
      throw new Error('Authentication required');
    }

    const endpoint = recordingLinkToken
      ? `/api/record/${recordingLinkToken}/start`
      : '/api/recordings';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (user) {
      const idToken = await user.getIdToken();
      headers.Authorization = `Bearer ${idToken}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: recordingLinkToken ? 'share_link' : 'direct',
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          browser: getBrowserInfo(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create recording');
    }

    const data = await response.json();
    return data.recordingId;
  };

  // Upload a chunk
  const uploadChunk = async (blob: Blob, chunkIndex: number, isFinal: boolean = false): Promise<void> => {
    if (!recordingId) {
      throw new Error('No recording ID');
    }

    const endpoint = recordingLinkToken
      ? `/api/record/${recordingLinkToken}/chunk`
      : `/api/recordings/${recordingId}/chunks`;

    const headers: Record<string, string> = {};

    if (user) {
      const idToken = await user.getIdToken();
      headers.Authorization = `Bearer ${idToken}`;
    }

    // First, get a signed URL
    const extension = getExtensionForMimeType(mimeTypeRef.current);
    const metaResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recordingId,
        chunkIndex,
        mimeType: mimeTypeRef.current,
        extension,
        sizeBytes: blob.size,
        isFinal,
      }),
    });

    if (!metaResponse.ok) {
      const error = await metaResponse.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }

    const { uploadUrl, gcsPath } = await metaResponse.json();

    // Upload to GCS
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeTypeRef.current,
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload chunk to storage');
    }

    // Confirm upload
    const confirmEndpoint = recordingLinkToken
      ? `/api/record/${recordingLinkToken}/chunk`
      : `/api/recordings/${recordingId}/chunks`;

    const confirmResponse = await fetch(`${confirmEndpoint}?confirm=true`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recordingId,
        chunkIndex,
        gcsPath,
        durationSeconds: Math.floor((elapsedSeconds - savedSeconds) || 1),
        sizeBytes: blob.size,
        isFinal,
      }),
    });

    if (!confirmResponse.ok) {
      const error = await confirmResponse.json();
      throw new Error(error.error || 'Failed to confirm chunk upload');
    }

    // Update saved seconds
    setSavedSeconds(elapsedSeconds);
    onChunkUploaded?.(chunkIndex, elapsedSeconds);
  };

  // Finalize recording
  const finalizeRecording = async (): Promise<void> => {
    if (!recordingId) {
      throw new Error('No recording ID');
    }

    const endpoint = recordingLinkToken
      ? `/api/record/${recordingLinkToken}/complete`
      : `/api/recordings/${recordingId}/finalize`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (user) {
      const idToken = await user.getIdToken();
      headers.Authorization = `Bearer ${idToken}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        recordingId,
        totalDurationSeconds: elapsedSeconds,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to finalize recording');
    }
  };

  // Get browser info
  const getBrowserInfo = (): string => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  // Save recording state to localStorage (for resume functionality)
  const saveRecordingState = useCallback((id: string, saved: number, chunkIdx: number) => {
    if (user && !recordingLinkToken) {
      try {
        localStorage.setItem(RECORDING_STATE_KEY, JSON.stringify({
          recordingId: id,
          userId: user.uid,
          startedAt: new Date().toISOString(),
          savedSeconds: saved,
          currentChunkIndex: chunkIdx,
        }));
      } catch (e) {
        console.error('Failed to save recording state:', e);
      }
    }
  }, [user, recordingLinkToken]);

  // Clear recording state from localStorage
  const clearRecordingState = useCallback(() => {
    try {
      localStorage.removeItem(RECORDING_STATE_KEY);
    } catch (e) {
      console.error('Failed to clear recording state:', e);
    }
  }, []);

  // Verify if a recording exists and is resumable
  const verifyRecording = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/recordings/${id}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data.recording?.status === 'recording';
    } catch {
      return false;
    }
  }, [user]);

  // Start audio visualization
  const startVisualization = (stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    analyserRef.current.fftSize = 256;

    // Set state for the AudioVisualizer component
    setAnalyserNode(analyserRef.current);

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateLevel = () => {
      if (analyserRef.current && recordingState === 'recording') {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(average / 255);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };

    updateLevel();
  };

  // Stop visualization
  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setAnalyserNode(null);
  };

  // Start recording (or resume if resumeState is provided)
  const startRecording = async (resumeState?: PersistedRecordingState) => {
    try {
      setErrorMessage(null);
      setRecordingState('idle');

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      let id: string;
      let initialSavedSeconds = 0;
      let initialChunkIndex = 0;

      if (resumeState) {
        // Resume mode: use existing recording
        id = resumeState.recordingId;
        initialSavedSeconds = resumeState.savedSeconds;
        initialChunkIndex = resumeState.currentChunkIndex;
      } else {
        // New recording: create entry in database
        id = await createRecordingEntry();
        // Save initial state to localStorage
        saveRecordingState(id, 0, 0);
      }
      setRecordingId(id);

      // Determine supported MIME type
      mimeTypeRef.current = getSupportedMimeType();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeTypeRef.current,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create blob from chunks for preview
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        setAudioBlob(blob);
      };

      // Start recording with timeslice for chunking
      mediaRecorder.start(1000); // Collect data every second

      // Start timer (from saved position if resuming)
      setElapsedSeconds(initialSavedSeconds);
      setSavedSeconds(initialSavedSeconds);
      setCurrentChunkIndex(initialChunkIndex);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev >= maxDurationSeconds) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Set up chunk upload timer
      const chunkIntervalMs = chunkIntervalMinutes * 60 * 1000;
      chunkTimerRef.current = setInterval(async () => {
        await uploadCurrentChunk(false);
      }, chunkIntervalMs);

      // Start visualization
      startVisualization(stream);

      setRecordingState('recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      const err = error instanceof Error ? error : new Error('Failed to start recording');
      setErrorMessage(err.message);
      setRecordingState('error');
      onError?.(err);
    }
  };

  // Upload current chunk
  const uploadCurrentChunk = async (isFinal: boolean) => {
    if (chunksRef.current.length === 0) return;

    try {
      // Create blob from current chunks
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });

      // Upload chunk
      await uploadChunk(blob, currentChunkIndex, isFinal);

      // Clear chunks and increment index
      chunksRef.current = [];
      const newChunkIndex = currentChunkIndex + 1;
      setCurrentChunkIndex(newChunkIndex);

      // Save state to localStorage after successful upload (for resume functionality)
      if (recordingId && !isFinal) {
        saveRecordingState(recordingId, elapsedSeconds, newChunkIndex);
      }
    } catch (error) {
      console.error('Failed to upload chunk:', error);
      // Don't stop recording on chunk upload failure - will retry
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      stopVisualization();
      setRecordingState('paused');
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev >= maxDurationSeconds) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      if (streamRef.current) {
        startVisualization(streamRef.current);
      }
      setRecordingState('recording');
    }
  };

  // Stop recording
  const stopRecording = useCallback(async () => {
    // Stop timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    // Stop visualization
    stopVisualization();

    // Wait for MediaRecorder to stop and collect final data
    // This fixes a race condition where stop() triggers ondataavailable asynchronously,
    // but uploadCurrentChunk was being called before the data was available
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Request any buffered data before stopping
      mediaRecorderRef.current.requestData();

      // Wait for the onstop event to fire (which means ondataavailable has completed)
      await new Promise<void>((resolve) => {
        const recorder = mediaRecorderRef.current!;
        const originalOnStop = recorder.onstop;
        recorder.onstop = (event) => {
          if (originalOnStop) {
            originalOnStop.call(recorder, event);
          }
          resolve();
        };
        recorder.stop();
      });
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    setRecordingState('uploading');

    try {
      // Upload final chunk (now chunksRef.current has data from ondataavailable)
      await uploadCurrentChunk(true);

      // Finalize recording
      await finalizeRecording();

      // Clear localStorage state on successful completion
      clearRecordingState();

      setRecordingState('completed');

      if (recordingId) {
        onRecordingComplete(recordingId);
      }
    } catch (error) {
      console.error('Failed to finalize recording:', error);
      const err = error instanceof Error ? error : new Error('Failed to save recording');
      setErrorMessage(err.message);
      setRecordingState('error');
      onError?.(err);
    }
  }, [recordingId, elapsedSeconds, clearRecordingState]);

  // Toggle playback
  const togglePlayback = () => {
    if (!audioBlob) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(URL.createObjectURL(audioBlob));
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Reset recorder
  const resetRecorder = () => {
    setRecordingState('idle');
    setRecordingId(null);
    setElapsedSeconds(0);
    setSavedSeconds(0);
    setCurrentChunkIndex(0);
    setAudioBlob(null);
    setErrorMessage(null);
    chunksRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  // Handle resume incomplete recording
  const handleResume = async () => {
    if (!pendingResume) return;
    setPendingResume(null);
    await startRecording(pendingResume);
  };

  // Handle discard incomplete recording
  const handleDiscard = () => {
    if (!pendingResume) return;
    clearRecordingState();
    setPendingResume(null);
  };

  // Check for incomplete recording on mount (for resume functionality)
  useEffect(() => {
    if (user && !recordingLinkToken && recordingState === 'idle') {
      setIsCheckingResume(true);
      try {
        const saved = localStorage.getItem(RECORDING_STATE_KEY);
        if (saved) {
          const state = JSON.parse(saved) as PersistedRecordingState;
          // Only show resume if it's the same user
          if (state.userId === user.uid) {
            // Verify recording still exists and is resumable
            verifyRecording(state.recordingId).then((isValid) => {
              if (isValid) {
                setPendingResume(state);
              } else {
                clearRecordingState();
              }
              setIsCheckingResume(false);
            });
            return;
          }
        }
      } catch (e) {
        console.error('Failed to check for incomplete recording:', e);
      }
      setIsCheckingResume(false);
    }
  }, [user, recordingLinkToken, recordingState, verifyRecording, clearRecordingState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Render different states
  if (recordingState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <p className="mb-2 text-lg font-medium text-gray-900">Recording Failed</p>
        <p className="mb-6 text-center text-sm text-gray-500">{errorMessage}</p>
        <Button variant="primary" onClick={resetRecorder}>
          Try Again
        </Button>
      </div>
    );
  }

  if (recordingState === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <p className="mb-2 text-lg font-medium text-gray-900">Recording Complete</p>
        <p className="mb-6 text-sm text-gray-500">
          {formatTime(elapsedSeconds)}
          {' '}
          recorded
        </p>

        {audioBlob && (
          <div className="mb-6 flex gap-3">
            <Button variant="secondary" onClick={togglePlayback}>
              {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Preview'}
            </Button>
            <Button variant="secondary" onClick={resetRecorder}>
              Record Again
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (recordingState === 'uploading') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
          <Upload className="h-8 w-8 animate-pulse text-purple-600" />
        </div>
        <p className="mb-2 text-lg font-medium text-gray-900">Saving Recording...</p>
        <p className="text-sm text-gray-500">Please wait while we save your recording</p>
      </div>
    );
  }

  if (recordingState === 'recording' || recordingState === 'paused') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        {/* Recording indicator */}
        <div className="relative mb-6">
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-full transition-all ${
              recordingState === 'recording' ? 'bg-red-100' : 'bg-gray-100'
            }`}
            style={{
              transform: `scale(${1 + audioLevel * 0.3})`,
            }}
          >
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full ${
                recordingState === 'recording' ? 'bg-red-500' : 'bg-gray-400'
              }`}
            >
              <Mic className="h-10 w-10 text-white" />
            </div>
          </div>
          {recordingState === 'recording' && (
            <div className="absolute -top-1 -right-1">
              <div className="h-4 w-4 animate-pulse rounded-full bg-red-500" />
            </div>
          )}
        </div>

        {/* Audio visualization */}
        <div className="mb-4 h-16 w-64">
          <AudioVisualizer
            analyser={analyserNode}
            isActive={recordingState === 'recording'}
            variant="light"
          />
        </div>

        {/* Timer */}
        <div className="mb-2 text-4xl font-bold text-gray-900">
          {formatTime(elapsedSeconds)}
        </div>

        {/* Saved indicator */}
        {savedSeconds > 0 && (
          <div className="mb-4 flex items-center gap-1 text-sm text-green-600">
            <Cloud className="h-4 w-4" />
            {formatTime(savedSeconds)}
            {' '}
            saved to cloud
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          {recordingState === 'recording'
            ? (
                <button
                  onClick={pauseRecording}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300"
                  aria-label="Pause"
                >
                  <Pause className="h-6 w-6 text-gray-700" />
                </button>
              )
            : (
                <button
                  onClick={resumeRecording}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300"
                  aria-label="Resume"
                >
                  <Play className="h-6 w-6 text-gray-700" />
                </button>
              )}

          <button
            onClick={stopRecording}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 transition-colors hover:bg-red-600"
            aria-label="Stop"
          >
            <Square className="h-6 w-6 text-white" fill="white" />
          </button>
        </div>

        {/* Max duration warning */}
        {elapsedSeconds > maxDurationSeconds - 300 && (
          <p className="mt-4 text-sm text-amber-600">
            Max recording time:
            {' '}
            {formatTime(maxDurationSeconds)}
          </p>
        )}
      </div>
    );
  }

  // Idle state - ready to record
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Resume prompt for incomplete recording */}
      {pendingResume && (
        <div className="mb-6 w-full max-w-sm rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <p className="mb-1 text-sm font-medium text-yellow-800">
            You have an incomplete recording
          </p>
          <p className="mb-3 text-xs text-yellow-700">
            {formatTime(pendingResume.savedSeconds)}
            {' '}
            saved to cloud
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={handleResume}>
              Resume
            </Button>
            <Button size="sm" variant="secondary" onClick={handleDiscard}>
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Loading state while checking for resume */}
      {isCheckingResume && (
        <div className="mb-6 text-sm text-gray-500">
          Checking for incomplete recordings...
        </div>
      )}

      <button
        onClick={() => startRecording()}
        disabled={disabled || isCheckingResume || !!pendingResume}
        className={`mb-6 flex h-32 w-32 items-center justify-center rounded-full transition-all ${
          disabled || isCheckingResume || pendingResume
            ? 'cursor-not-allowed bg-gray-200'
            : 'bg-purple-100 hover:scale-105 hover:bg-purple-200'
        }`}
        aria-label="Start recording"
      >
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full ${
            disabled || isCheckingResume || pendingResume ? 'bg-gray-400' : 'bg-purple-600'
          }`}
        >
          <Mic className="h-10 w-10 text-white" />
        </div>
      </button>

      <p className="mb-2 text-lg font-medium text-gray-900">
        {disabled ? 'Recording Disabled' : pendingResume ? 'Resume or start new' : 'Tap to Start Recording'}
      </p>
      <p className="text-sm text-gray-500">
        Maximum duration:
        {' '}
        {Math.floor(maxDurationSeconds / 3600)}
        {' '}
        hours
      </p>
    </div>
  );
}
