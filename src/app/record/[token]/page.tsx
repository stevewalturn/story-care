'use client';

import { AlertCircle, CheckCircle2, Clock, Cloud, Loader2, Mic, Pause, Play, Square } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioVisualizer } from '@/components/ui/AudioVisualizer';

type LinkData = {
  valid: boolean;
  linkId: string;
  sessionTitle: string | null;
  sessionDate: string | null;
  notes: string | null;
  therapistName: string;
  expiresAt: string;
  timeRemainingMinutes: number;
};

type RecordingState = 'loading' | 'ready' | 'recording' | 'paused' | 'uploading' | 'completed' | 'error' | 'expired';

// Get supported MIME type for the browser
function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  return types.find(t => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) || 'audio/webm';
}

// Get file extension for MIME type
function getExtensionForMimeType(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

export default function PublicRecordingPage() {
  const params = useParams();
  const token = params.token as string;

  // Page state
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);

  // Recording state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savedSeconds, setSavedSeconds] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  // Preview state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      try {
        const response = await fetch(`/api/record/${token}`);
        const data = await response.json();

        if (!response.ok) {
          if (data.code === 'EXPIRED') {
            setRecordingState('expired');
          } else {
            setErrorMessage(data.error || 'Invalid recording link');
            setRecordingState('error');
          }
          return;
        }

        setLinkData(data);
        setRecordingState('ready');
      } catch (error) {
        console.error('Failed to validate token:', error);
        setErrorMessage('Failed to validate recording link');
        setRecordingState('error');
      }
    }

    validateToken();
  }, [token]);

  // Upload a chunk
  const uploadChunk = async (blob: Blob, chunkIndex: number, isFinal: boolean = false): Promise<void> => {
    if (!recordingId) {
      throw new Error('No recording ID');
    }

    // Get upload URL
    const extension = getExtensionForMimeType(mimeTypeRef.current);
    const metaResponse = await fetch(`/api/record/${token}/chunk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordingId,
        chunkIndex,
        mimeType: mimeTypeRef.current,
        extension,
        sizeBytes: blob.size,
      }),
    });

    if (!metaResponse.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { uploadUrl, gcsPath } = await metaResponse.json();

    // Upload to GCS
    let uploadResponse: Response;
    try {
      uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeTypeRef.current },
        body: blob,
      });
    } catch (error) {
      // CORS errors manifest as TypeError: Failed to fetch
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Upload blocked - CORS may not be configured on the storage bucket. Please contact support.');
      }
      throw error;
    }

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => 'Unknown error');
      throw new Error(`Failed to upload chunk: ${uploadResponse.status} - ${errorText}`);
    }

    // Confirm upload
    const confirmResponse = await fetch(`/api/record/${token}/chunk?confirm=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      throw new Error('Failed to confirm chunk upload');
    }

    setSavedSeconds(elapsedSeconds);
  };

  // Upload current chunk
  const uploadCurrentChunk = async (isFinal: boolean) => {
    if (chunksRef.current.length === 0) return;

    try {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      await uploadChunk(blob, currentChunkIndex, isFinal);
      chunksRef.current = [];
      setCurrentChunkIndex(prev => prev + 1);
    } catch (error) {
      console.error('Failed to upload chunk:', error);
    }
  };

  // Start visualization
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

  // Start recording
  const startRecording = async () => {
    try {
      setErrorMessage(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Start recording on server
      const startResponse = await fetch(`/api/record/${token}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        }),
      });

      if (!startResponse.ok) {
        const error = await startResponse.json();
        throw new Error(error.error || 'Failed to start recording');
      }

      const startData = await startResponse.json();
      const { recordingId: newRecordingId, resumed, savedDurationSeconds, nextChunkIndex } = startData;
      setRecordingId(newRecordingId);

      // If resuming, restore progress from server
      if (resumed && savedDurationSeconds > 0) {
        setElapsedSeconds(savedDurationSeconds);
        setSavedSeconds(savedDurationSeconds);
        setCurrentChunkIndex(nextChunkIndex || 0);
      }

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
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        setAudioBlob(blob);
      };

      // Start recording
      mediaRecorder.start(1000);

      // Start timer (only reset if not resuming)
      if (!resumed) {
        setElapsedSeconds(0);
        setSavedSeconds(0);
        setCurrentChunkIndex(0);
      }
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      // Set up chunk upload timer (every 3 minutes)
      const chunkIntervalMs = 3 * 60 * 1000;
      chunkTimerRef.current = setInterval(async () => {
        await uploadCurrentChunk(false);
      }, chunkIntervalMs);

      // Start visualization
      startVisualization(stream);

      setRecordingState('recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start recording');
      setRecordingState('error');
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
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      if (streamRef.current) {
        startVisualization(streamRef.current);
      }
      setRecordingState('recording');
    }
  };

  // Stop recording
  const stopRecording = useCallback(async () => {
    // Stop timers first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    stopVisualization();

    // FIX: Wait for MediaRecorder to stop and collect final data
    // This fixes the race condition where stop() is called but ondataavailable
    // hasn't fired yet, causing the final chunk to be empty or incomplete
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

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    setRecordingState('uploading');

    try {
      // Now chunksRef.current has the final data from ondataavailable
      await uploadCurrentChunk(true);

      // Complete recording
      const response = await fetch(`/api/record/${token}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordingId,
          totalDurationSeconds: elapsedSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete recording');
      }

      setRecordingState('completed');
    } catch (error) {
      console.error('Failed to complete recording:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save recording');
      setRecordingState('error');
    }
  }, [recordingId, elapsedSeconds, token]);

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

  // Loading state
  if (recordingState === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-600 to-purple-800 px-4">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-white" />
        <p className="text-lg text-white">Loading...</p>
      </div>
    );
  }

  // Error state
  if (recordingState === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-red-600 to-red-800 px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <AlertCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">Recording Error</h1>
          <p className="text-white/80">{errorMessage || 'Something went wrong'}</p>
        </div>
      </div>
    );
  }

  // Expired state
  if (recordingState === 'expired') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-600 to-gray-800 px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <Clock className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">Link Expired</h1>
          <p className="text-white/80">This recording link has expired. Please contact your therapist for a new link.</p>
        </div>
      </div>
    );
  }

  // Completed state
  if (recordingState === 'completed') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-600 to-green-800 px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">Recording Complete!</h1>
          <p className="mb-4 text-white/80">
            Your recording has been saved successfully.
            {' '}
            {linkData?.therapistName}
            {' '}
            will be notified.
          </p>
          <p className="text-lg text-white">
            Duration:
            {' '}
            {formatTime(elapsedSeconds)}
          </p>

          {audioBlob && (
            <button
              onClick={togglePlayback}
              className="mt-6 flex items-center justify-center gap-2 rounded-full bg-white/20 px-6 py-3 text-white transition-colors hover:bg-white/30"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {isPlaying ? 'Pause Preview' : 'Play Preview'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Uploading state
  if (recordingState === 'uploading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-600 to-purple-800 px-4">
        <div className="mx-auto mb-6 flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-white/20">
          <Cloud className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">Saving Recording...</h1>
        <p className="text-white/80">Please wait while we upload your recording.</p>
      </div>
    );
  }

  // Recording/Paused state
  if (recordingState === 'recording' || recordingState === 'paused') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-600 to-purple-800 px-4 py-8">
        {/* Recording indicator */}
        <div className="relative mb-8">
          <div
            className={`flex h-40 w-40 items-center justify-center rounded-full transition-all ${
              recordingState === 'recording' ? 'bg-red-500/30' : 'bg-white/20'
            }`}
            style={{
              transform: `scale(${1 + audioLevel * 0.3})`,
            }}
          >
            <div
              className={`flex h-32 w-32 items-center justify-center rounded-full ${
                recordingState === 'recording' ? 'bg-red-500' : 'bg-white/40'
              }`}
            >
              <Mic className="h-16 w-16 text-white" />
            </div>
          </div>
          {recordingState === 'recording' && (
            <div className="absolute -top-1 -right-1">
              <div className="h-6 w-6 animate-pulse rounded-full bg-red-500" />
            </div>
          )}
        </div>

        {/* Audio visualization */}
        <div className="mb-6 h-20 w-72">
          <AudioVisualizer
            analyser={analyserNode}
            isActive={recordingState === 'recording'}
            variant="dark"
          />
        </div>

        {/* Timer */}
        <div className="mb-4 text-6xl font-bold text-white">
          {formatTime(elapsedSeconds)}
        </div>

        {/* Saved indicator */}
        {savedSeconds > 0 && (
          <div className="mb-8 flex items-center gap-2 text-white/80">
            <Cloud className="h-5 w-5" />
            {formatTime(savedSeconds)}
            {' '}
            saved to cloud
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-6">
          {recordingState === 'recording'
            ? (
                <button
                  onClick={pauseRecording}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
                  aria-label="Pause"
                >
                  <Pause className="h-8 w-8 text-white" />
                </button>
              )
            : (
                <button
                  onClick={resumeRecording}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
                  aria-label="Resume"
                >
                  <Play className="h-8 w-8 text-white" />
                </button>
              )}

          <button
            onClick={stopRecording}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500 transition-colors hover:bg-red-600"
            aria-label="Stop"
          >
            <Square className="h-8 w-8 text-white" fill="white" />
          </button>
        </div>

        {/* Session info */}
        {linkData?.sessionTitle && (
          <div className="mt-8 text-center text-white/60">
            <p className="text-sm">Recording for</p>
            <p className="text-lg font-medium text-white">{linkData.sessionTitle}</p>
          </div>
        )}
      </div>
    );
  }

  // Ready state - show start button
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-600 to-purple-800 px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-white">Voice Recording</h1>
        {linkData && (
          <p className="text-white/80">
            Requested by
            {' '}
            {linkData.therapistName}
          </p>
        )}
      </div>

      {/* Session info */}
      {linkData?.sessionTitle && (
        <div className="mb-8 rounded-lg bg-white/10 px-6 py-4 text-center">
          <p className="text-sm text-white/60">Session</p>
          <p className="text-lg font-medium text-white">{linkData.sessionTitle}</p>
        </div>
      )}

      {/* Instructions */}
      {linkData?.notes && (
        <div className="mb-8 max-w-sm rounded-lg bg-white/10 p-4 text-center">
          <p className="text-sm text-white/80">{linkData.notes}</p>
        </div>
      )}

      {/* Record button */}
      <button
        onClick={startRecording}
        className="group mb-8 flex h-40 w-40 items-center justify-center rounded-full bg-white/20 transition-all hover:scale-105 hover:bg-white/30"
        aria-label="Start recording"
      >
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-purple-500 group-hover:bg-purple-400">
          <Mic className="h-16 w-16 text-white" />
        </div>
      </button>

      <p className="mb-2 text-xl font-medium text-white">Tap to Start Recording</p>
      <p className="text-white/60">Maximum duration: 3 hours</p>

      {/* Expiration warning */}
      {linkData && linkData.timeRemainingMinutes < 60 && (
        <div className="mt-8 flex items-center gap-2 text-amber-300">
          <Clock className="h-4 w-4" />
          <span>
            Link expires in
            {' '}
            {linkData.timeRemainingMinutes}
            {' '}
            minutes
          </span>
        </div>
      )}
    </div>
  );
}
