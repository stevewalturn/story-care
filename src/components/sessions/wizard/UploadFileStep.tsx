'use client';

import { Cloud, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
// Button import removed - not currently used
import { useAuth } from '@/contexts/AuthContext';

type UploadFileStepProps = {
  onNext: (file: File, url: string, path: string) => void;
  onBack: () => void;
  setStepReady: (ready: boolean) => void;
  stepProceedRef: { current: (() => void) | null };
};

export function UploadFileStep({ onNext, onBack: _onBack, setStepReady, stepProceedRef }: UploadFileStepProps) {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>(''); // Presigned URL for preview
  const [uploadedPath, setUploadedPath] = useState<string>(''); // Permanent GCS path to save in DB
  const [uploading, setUploading] = useState(false);

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

  const handleNext = () => {
    if (uploadedFile && uploadedUrl && uploadedPath) {
      onNext(uploadedFile, uploadedUrl, uploadedPath);
    }
  };

  // Update parent's proceed ref and ready state
  useEffect(() => {
    stepProceedRef.current = handleNext;
    setStepReady(!!uploadedFile && !!uploadedUrl && !!uploadedPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFile, uploadedUrl, uploadedPath]);

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
        {/* Upload Area */}
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
                    {/* Cloud Upload Illustration */}
                    <div className="relative mb-6">
                      <Cloud className="h-32 w-32 text-purple-300" strokeWidth={1.5} />
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                          <Upload className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
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
      </div>
    </div>
  );
}
