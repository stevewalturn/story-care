'use client';

import { FileAudio, Mic, Plus, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: SessionUploadData) => Promise<void>;
};

export type SessionUploadData = {
  title: string;
  sessionDate: string;
  sessionType: 'individual' | 'group';
  patientIds: string[];
  groupId?: string;
  audioFile: File | null;
  audioUrl?: string; // Presigned URL for preview (expires in 1 hour)
  audioPath?: string; // Permanent GCS path to save in database
};

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<SessionUploadData>({
    title: '',
    sessionDate: new Date().toISOString().split('T')[0] || '',
    sessionType: 'individual',
    patientIds: [],
    audioFile: null,
  });

  const [dragActive, setDragActive] = useState(false);
  const [patients, setPatients] = useState<Array<{ value: string; label: string }>>([]);
  const [groups, setGroups] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch patients when modal opens
  useEffect(() => {
    if (!isOpen || !user?.uid) return;

    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const res = await authenticatedFetch(`/api/patients?therapistId=${user.uid}`, user);
        const data = await res.json();
        const patientOptions = data.patients?.map((p: any) => ({
          value: p.id,
          label: p.name,
        })) || [];
        setPatients(patientOptions);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
        setPatients([]);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [isOpen, user?.uid]);

  // Fetch groups when modal opens
  useEffect(() => {
    if (!isOpen || !user?.uid) return;

    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const res = await authenticatedFetch(`/api/groups?therapistId=${user.uid}`, user);
        const data = await res.json();
        const groupOptions = data.groups?.map((g: any) => ({
          value: g.id,
          label: g.name,
        })) || [];
        setGroups(groupOptions);
      } catch (err) {
        console.error('Failed to fetch groups:', err);
        setGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, [isOpen, user?.uid]);

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
  const uploadDirect = async (file: File) => {
    const idToken = await user!.getIdToken();

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('sessionId', `temp-${Date.now()}`);

    const uploadResponse = await fetch('/api/sessions/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || 'Failed to upload audio file');
    }

    const uploadData = await uploadResponse.json();

    setFormData({
      ...formData,
      audioFile: file,
      audioUrl: uploadData.url,
      audioPath: uploadData.path,
    });
  };

  // Signed URL upload for large files (>32MB)
  const uploadViaSignedUrl = async (file: File) => {
    const idToken = await user!.getIdToken();

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

    if (!urlResponse.ok) {
      const errorData = await urlResponse.json();
      throw new Error(errorData.error || 'Failed to get upload URL');
    }

    const { uploadUrl, fileId, gcsPath } = await urlResponse.json();

    // 2. Upload directly to GCS using signed URL with progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 90; // Reserve 10% for confirmation
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

    setUploadProgress(95);

    // 3. Confirm upload and get presigned URL for preview
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

    if (!confirmResponse.ok) {
      throw new Error('Failed to confirm upload');
    }

    const { url } = await confirmResponse.json();

    setFormData({
      ...formData,
      audioFile: file,
      audioUrl: url, // Presigned URL for preview (expires 1 hour)
      audioPath: gcsPath, // Permanent GCS path for database
    });
  };

  const uploadFile = async (file: File) => {
    if (!user?.uid) {
      console.error('You must be logged in to upload files');
      return;
    }

    setUploadingFile(true);
    setUploadProgress(0);

    try {
      const FILE_SIZE_LIMIT = 32 * 1024 * 1024; // 32MB in bytes

      if (file.size > FILE_SIZE_LIMIT) {
        // Large file - use signed URL upload
        await uploadViaSignedUrl(file);
      } else {
        // Small file - direct upload
        await uploadDirect(file);
      }

      setUploadProgress(100);
    } catch (error) {
      console.error('Error uploading file:', error);
      console.error(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
      setFormData({ ...formData, audioFile: null });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        uploadFile(file);
      } else {
        console.error('Please upload an audio file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('audio/')) {
        uploadFile(file);
      } else {
        console.error('Please upload an audio file');
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.audioFile || !formData.title) {
      return;
    }

    try {
      setIsSubmitting(true);
      // Don't close modal yet - let parent handle it after successful upload
      await onUpload(formData);
    } catch (error) {
      console.error('Error submitting session:', error);
      // Error is already handled in parent, just reset submitting state
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit
    = formData.title
      && formData.audioFile
      && formData.audioUrl
      && !uploadingFile
      && !isSubmitting
      && (
        (formData.sessionType === 'individual' && formData.patientIds.length > 0)
        || (formData.sessionType === 'group' && formData.groupId)
      );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Session"
      size="lg"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="!bg-gray-900 !text-white hover:!bg-gray-800"
          >
            <Mic className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Creating Session...' : 'Continue to Speaker Labeling'}
          </Button>
        </>
      )}
    >
      {/* Subtitle */}
      <div className="mb-6">
        <h3 className="text-base font-medium text-gray-900">New Session Upload</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload an audio file to begin the transcription and analysis process.
        </p>
      </div>
      <div className="space-y-6">
        {/* Session Title */}
        <Input
          label="Session Title"
          placeholder="e.g., Weekly Check-in"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          required
          maxLength={255}
          helperText="3-255 characters required"
        />

        {/* Two-Column Grid: Session Date | Session Type */}
        <div className="grid grid-cols-2 gap-4">
          {/* Session Date */}
          <Input
            label="Session Date"
            type="date"
            value={formData.sessionDate}
            onChange={e =>
              setFormData({ ...formData, sessionDate: e.target.value })}
          />

          {/* Session Type */}
          <Dropdown
            label="Session Type"
            value={formData.sessionType}
            onChange={value =>
              setFormData({
                ...formData,
                sessionType: value as 'individual' | 'group',
                // Clear patient/group selection when type changes
                patientIds: [],
                groupId: undefined,
              })}
            options={[
              { value: 'individual', label: 'Individual' },
              { value: 'group', label: 'Group' },
            ]}
          />
        </div>

        {/* Conditional Patient/Group Selection */}
        {formData.sessionType === 'individual'
          ? (
              <div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <MultiSelect
                      label="Patients"
                      options={patients}
                      selectedValues={formData.patientIds}
                      onChange={patientIds => setFormData({ ...formData, patientIds })}
                      placeholder={loadingPatients ? 'Loading patients...' : 'Select patient(s)...'}
                      disabled={loadingPatients}
                      required
                    />
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      // TODO: Open add patient modal
                      alert('Add patient functionality coming soon');
                    }}
                    className="h-[42px] px-3"
                    title="Add new patient"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          : (
              <Dropdown
                label="Group"
                value={formData.groupId || ''}
                onChange={groupId => setFormData({ ...formData, groupId })}
                options={groups}
                placeholder={loadingGroups ? 'Loading groups...' : 'Select group...'}
                disabled={loadingGroups}
              />
            )}

        {/* File Upload Area */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Audio File
            {' '}
            <span className="text-red-500">*</span>
          </label>
          <p className="mb-2 text-xs text-gray-500">
            MP3, WAV, M4A, or other audio formats - up to 100MB
          </p>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative rounded-xl border-2 border-dashed p-12 text-center transition-colors
              ${dragActive ? 'border-purple-600 bg-purple-50' : 'border-gray-300 bg-gray-50'}
              ${uploadingFile ? 'cursor-wait border-purple-300 bg-purple-50' : ''}
            `}
          >
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              disabled={uploadingFile}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />

            {uploadingFile
              ? (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Uploading file...
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {uploadProgress}
                        % complete
                      </p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-purple-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )
              : formData.audioFile
                ? (
                    <div className="space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <FileAudio className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {formData.audioFile.name}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, audioFile: null, audioUrl: undefined });
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {(formData.audioFile.size / (1024 * 1024)).toFixed(2)}
                        {' '}
                        MB - Uploaded successfully
                      </p>
                    </div>
                  )
                : (
                    <div className="space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Drag & drop an audio file here
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          or click to select a file
                        </p>
                      </div>
                    </div>
                  )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
