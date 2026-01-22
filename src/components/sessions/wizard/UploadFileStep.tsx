'use client';

import type { AudioInputMode } from './AudioInputSelector';
import type { SessionFormData } from './types';
import { Calendar, Check, Clock, Cloud, Loader2, Mic, Music, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AudioInputSelector } from './AudioInputSelector';

type ExistingRecording = {
  id: string;
  title: string | null;
  recordedAt: string | null;
  totalDurationSeconds: number | null;
  totalFileSizeBytes: number | null;
  status: 'recording' | 'uploading' | 'completed' | 'failed' | 'used';
  createdAt: string;
};

type UploadFileStepProps = {
  onNext: (file: File | null, url: string, path: string, recordingId?: string) => void;
  onBack: () => void;
  setStepReady: (ready: boolean) => void;
  stepProceedRef: { current: (() => void) | null };
  formData?: SessionFormData;
};

export function UploadFileStep({ onNext, onBack: _onBack, setStepReady, stepProceedRef, formData: _formData }: UploadFileStepProps) {
  const { user } = useAuth();
  const [inputMode, setInputMode] = useState<AudioInputMode>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>(''); // Presigned URL for preview
  const [uploadedPath, setUploadedPath] = useState<string>(''); // Permanent GCS path to save in DB
  const [uploading, setUploading] = useState(false);

  // Select recording state
  const [existingRecordings, setExistingRecordings] = useState<ExistingRecording[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Direct upload for small files (≤32MB)
  const uploadDirect = async (file: File, idToken: string) => {
    console.log('📤 Uploading directly to /api/sessions/upload');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', `temp-${Date.now()}`);

    const response = await fetch('/api/sessions/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: formData,
    });

    console.log('Direct upload status:', response.status);
    console.log('Direct upload ok?', response.ok);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      console.log('Error response content-type:', contentType);

      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        console.error('Error data:', errorData);
        throw new Error(errorData.error || 'Failed to upload audio file');
      } else {
        // Response is not JSON (likely HTML error page)
        const errorText = await response.text();
        console.error('Error response (non-JSON):', errorText.substring(0, 500));
        throw new Error('Upload failed - server returned HTML instead of JSON. File might be too large.');
      }
    }

    const data = await response.json();
    console.log('✅ Direct upload successful');

    setUploadedFile(file);
    setUploadedUrl(data.url);
    setUploadedPath(data.path);
  };

  // Signed URL upload for large files (>32MB)
  const uploadViaSignedUrl = async (file: File, idToken: string) => {
    console.log('📤 Step 1: Requesting signed URL from /api/sessions/upload-url');

    // 1. Request signed URL from backend
    const urlResponse = await fetch('/api/sessions/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }),
    });

    console.log('Response status:', urlResponse.status);
    console.log('Response ok?', urlResponse.ok);

    if (!urlResponse.ok) {
      const errorData = await urlResponse.json();
      console.error('Failed to get signed URL:', errorData);
      throw new Error(errorData.error || 'Failed to get upload URL');
    }

    const { uploadUrl, fileId, gcsPath } = await urlResponse.json();
    console.log('✅ Got signed URL');
    console.log('File ID:', fileId);
    console.log('GCS Path:', gcsPath);

    // 2. Upload directly to GCS using signed URL
    console.log('📤 Step 2: Uploading to GCS via signed URL');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    console.log('GCS upload status:', uploadResponse.status);
    console.log('GCS upload ok?', uploadResponse.ok);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('GCS upload failed:', errorText);
      throw new Error('Failed to upload file to storage');
    }

    console.log('✅ File uploaded to GCS');

    // 3. Confirm upload and get presigned URL for preview
    console.log('📤 Step 3: Confirming upload at /api/sessions/upload-confirm');
    const confirmResponse = await fetch('/api/sessions/upload-confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        fileId,
        gcsPath,
        fileName: file.name,
        fileSize: file.size,
        sessionId: `temp-${Date.now()}`,
      }),
    });

    console.log('Confirm status:', confirmResponse.status);
    console.log('Confirm ok?', confirmResponse.ok);

    if (!confirmResponse.ok) {
      const errorData = await confirmResponse.json();
      console.error('Confirm failed:', errorData);
      throw new Error('Failed to confirm upload');
    }

    const { url } = await confirmResponse.json();
    console.log('✅ Got presigned URL for preview');
    console.log('Preview URL:', `${url.substring(0, 100)}...`);

    setUploadedFile(file);
    setUploadedUrl(url);
    setUploadedPath(gcsPath);
  };

  const uploadFile = async (file: File) => {
    if (!user) {
      alert('You must be logged in to upload files');
      return;
    }

    setUploading(true);

    try {
      const idToken = await user.getIdToken();
      const FILE_SIZE_LIMIT = 32 * 1024 * 1024; // 32MB in bytes
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);

      console.log('=== FILE UPLOAD DEBUG ===');
      console.log('File name:', file.name);
      console.log('File size:', file.size, 'bytes');
      console.log('File size (MB):', fileSizeMB);
      console.log('File type:', file.type);
      console.log('Size limit (bytes):', FILE_SIZE_LIMIT);
      console.log('Size limit (MB):', (FILE_SIZE_LIMIT / 1024 / 1024).toFixed(2));
      console.log('Is large file?', file.size > FILE_SIZE_LIMIT);

      if (file.size > FILE_SIZE_LIMIT) {
        // Large file - use signed URL upload
        console.log(`✅ USING SIGNED URL UPLOAD (file is ${fileSizeMB}MB > 32MB)`);
        await uploadViaSignedUrl(file, idToken);
      } else {
        // Small file - direct upload
        console.log(`✅ USING DIRECT UPLOAD (file is ${fileSizeMB}MB <= 32MB)`);
        await uploadDirect(file, idToken);
      }
      console.log('=== UPLOAD SUCCESS ===');
    } catch (error) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error uploading file:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.name.endsWith('.m4a')) {
        uploadFile(file);
      } else {
        alert('Please upload an audio file (MP3, WAV, AAC, or M4A)');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('audio/') || file.name.endsWith('.m4a')) {
        uploadFile(file);
      } else {
        alert('Please upload an audio file (MP3, WAV, AAC, or M4A)');
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadedUrl('');
    setUploadedPath('');
  };

  // Fetch existing recordings for select mode
  const fetchExistingRecordings = async () => {
    if (!user) return;

    setLoadingRecordings(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/recordings?status=completed', {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter to only show completed recordings that haven't been used
        const available = data.recordings.filter(
          (r: ExistingRecording) => r.status === 'completed',
        );
        setExistingRecordings(available);
      }
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoadingRecordings(false);
    }
  };

  // Format duration
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleNext = () => {
    if (inputMode === 'upload' && uploadedFile && uploadedUrl && uploadedPath) {
      onNext(uploadedFile, uploadedUrl, uploadedPath);
    } else if (inputMode === 'select' && selectedRecordingId) {
      // For selecting existing recordings, pass the recording ID
      onNext(null, '', '', selectedRecordingId);
    }
  };

  // Update parent's proceed ref and ready state
  useEffect(() => {
    stepProceedRef.current = handleNext;

    let isReady = false;
    if (inputMode === 'upload') {
      isReady = !!uploadedFile && !!uploadedUrl && !!uploadedPath;
    } else if (inputMode === 'select') {
      isReady = !!selectedRecordingId;
    }

    setStepReady(isReady);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFile, uploadedUrl, uploadedPath, selectedRecordingId, inputMode]);

  // Reset state when mode changes
  useEffect(() => {
    if (inputMode !== 'upload') {
      handleRemoveFile();
    }
    if (inputMode !== 'select') {
      setSelectedRecordingId(null);
    }
    // Fetch recordings when select mode is activated
    if (inputMode === 'select') {
      fetchExistingRecordings();
    }
  }, [inputMode]);

  const getFileExtension = (filename: string) => {
    const parts = filename.split('.');
    const lastPart = parts[parts.length - 1];
    return lastPart ? lastPart.toUpperCase() : '';
  };

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Upload Session File</h2>
        <p className="mt-2 text-sm text-gray-500">
          upload an audio or video file to start the transcription
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        {/* Audio Input Mode Selector */}
        <AudioInputSelector
          selectedMode={inputMode}
          onModeChange={setInputMode}
          disabled={uploading}
        />

        {/* Upload Mode */}
        {inputMode === 'upload' && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative rounded-2xl border-2 border-dashed transition-all
              ${dragActive ? 'border-purple-600 bg-purple-100' : 'border-purple-200 bg-purple-50'}
              ${uploading ? 'pointer-events-none opacity-75' : ''}
            `}
            style={{ minHeight: '320px' }}
          >
            <input
              type="file"
              accept="audio/*,.m4a"
              onChange={handleFileChange}
              disabled={uploading || !!uploadedFile}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />

            {uploading
              ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                    <p className="text-base font-medium text-gray-900">Uploading...</p>
                  </div>
                )
              : uploadedFile
                ? (
                    <>
                      {/* Cloud Icon with Illustration - Centered */}
                      <div className="flex h-full flex-col items-center justify-center py-12">
                        <div className="relative">
                          <Cloud className="h-32 w-32 text-purple-300" strokeWidth={1.5} />
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600">
                              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Centered File Info Card */}
                      <div className="flex items-center justify-center px-8 py-6">
                        <div className="flex w-full max-w-md items-center gap-4 rounded-xl border border-purple-200 bg-white px-6 py-4 shadow-sm">
                          {/* Icon - Left */}
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-purple-600">
                            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                            </svg>
                          </div>

                          {/* File Info - Center */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {uploadedFile.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {getFileExtension(uploadedFile.name).toUpperCase()}
                              {' '}
                              •
                              {(uploadedFile.size / (1024 * 1024)).toFixed(1)}
                              {' '}
                              MB
                            </p>
                          </div>

                          {/* Remove Button - Right */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile();
                            }}
                            className="flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600"
                            aria-label="Remove file"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )
                : (
                    <div className="flex flex-col items-center justify-center py-16">
                      {/* Custom Upload Illustration */}
                      <div className="mb-6">
                        <img
                          src="/images/upload-illustration.png"
                          alt="Upload illustration"
                          className="h-32 w-auto"
                        />
                      </div>

                      {/* Text and Button */}
                      <p className="mb-4 text-base font-medium text-purple-600">
                        Drag and drop to upload
                      </p>

                      <button
                        type="button"
                        className="mb-4 rounded-lg border-2 border-purple-600 bg-white px-6 py-2.5 text-sm font-semibold text-purple-600 transition-all hover:bg-purple-50"
                      >
                        Browse File
                      </button>

                      <p className="text-sm text-purple-400">
                        MP3, WAV, AAC, and M4A supported
                      </p>
                    </div>
                  )}
          </div>
        )}

        {/* Select Recording Mode */}
        {inputMode === 'select' && (
          <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-6" style={{ minHeight: '320px' }}>
            {loadingRecordings ? (
              <div className="flex h-full flex-col items-center justify-center py-12">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-purple-600" />
                <p className="text-gray-500">Loading recordings...</p>
              </div>
            ) : existingRecordings.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-12">
                <Mic className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-500">No recordings available</p>
                <p className="mt-1 text-sm text-gray-400">
                  Create a recording first, then come back to select it
                </p>
                <Link
                  href="/sessions/recordings"
                  className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  Go to Recordings
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="mb-4 text-sm text-gray-600">
                  Select a recording to use for this session:
                </p>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {existingRecordings.map(recording => (
                    <button
                      key={recording.id}
                      type="button"
                      onClick={() => setSelectedRecordingId(recording.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        selectedRecordingId === recording.id
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                        selectedRecordingId === recording.id ? 'bg-purple-600' : 'bg-purple-100'
                      }`}
                      >
                        {selectedRecordingId === recording.id ? (
                          <Check className="h-5 w-5 text-white" />
                        ) : (
                          <Music className="h-5 w-5 text-purple-600" />
                        )}
                      </div>

                      {/* Recording info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">
                          {recording.title || 'Untitled Recording'}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(recording.totalDurationSeconds)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(recording.createdAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link
                    href="/sessions/recordings"
                    className="text-sm text-purple-600 hover:underline"
                  >
                    + Create New Recording
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
