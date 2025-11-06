'use client';

import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
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
  patientId?: string;
  groupId?: string;
  audioFile: File | null;
  audioUrl?: string;
};

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<SessionUploadData>({
    title: '',
    sessionDate: new Date().toISOString().split('T')[0] || '',
    sessionType: 'individual',
    patientId: '',
    groupId: '',
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

  // Fetch patients and groups when modal opens
  useEffect(() => {
    if (isOpen && user?.uid) {
      // Fetch patients (only for current therapist)
      setLoadingPatients(true);
      authenticatedFetch(`/api/patients?therapistId=${user.uid}`, user)
        .then(res => res.json())
        .then((data) => {
          const patientOptions = data.patients?.map((p: any) => ({
            value: p.id,
            label: p.name,
          })) || [];
          setPatients([{ value: '', label: 'Select a patient...' }, ...patientOptions]);
        })
        .catch((err) => {
          console.error('Failed to fetch patients:', err);
          setPatients([{ value: '', label: 'Select a patient...' }]);
        })
        .finally(() => {
          setLoadingPatients(false);
        });

      // Fetch groups (only for current therapist)
      setLoadingGroups(true);
      authenticatedFetch(`/api/groups?therapistId=${user.uid}`, user)
        .then(res => res.json())
        .then((data) => {
          const groupOptions = data.groups?.map((g: any) => ({
            value: g.id,
            label: g.name,
          })) || [];
          setGroups([{ value: '', label: 'Select a group...' }, ...groupOptions]);
        })
        .catch((err) => {
          console.error('Failed to fetch groups:', err);
          setGroups([{ value: '', label: 'Select a group...' }]);
        })
        .finally(() => {
          setLoadingGroups(false);
        });
    }
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

  const uploadFile = async (file: File) => {
    if (!user?.uid) {
      alert('You must be logged in to upload files');
      return;
    }

    setUploadingFile(true);
    setUploadProgress(0);

    try {
      // Get Firebase ID token for authentication
      const idToken = await user.getIdToken();

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('sessionId', `temp-${Date.now()}`);

      const uploadResponse = await fetch('/api/sessions/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload audio file');
      }

      const uploadData = await uploadResponse.json();
      setUploadProgress(100);

      // Update form data with uploaded file URL
      setFormData({ ...formData, audioFile: file, audioUrl: uploadData.url });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
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
        alert('Please upload an audio file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('audio/')) {
        uploadFile(file);
      } else {
        alert('Please upload an audio file');
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
      && ((formData.sessionType === 'individual' && formData.patientId)
        || (formData.sessionType === 'group' && formData.groupId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Session"
      description="Upload an audio file to begin the transcription and analysis process."
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
          >
            {isSubmitting ? 'Creating Session...' : 'Continue to Speaker Labeling'}
          </Button>
        </>
      )}
    >
      <div className="space-y-6">
        {/* Session Title */}
        <Input
          label="Session Title"
          placeholder="e.g., Weekly Check-in"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
        />

        {/* Session Date and Type */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Session Date"
            type="date"
            value={formData.sessionDate}
            onChange={e =>
              setFormData({ ...formData, sessionDate: e.target.value })}
          />
          <Dropdown
            label="Session Type"
            value={formData.sessionType}
            onChange={value =>
              setFormData({
                ...formData,
                sessionType: value as 'individual' | 'group',
              })}
            options={[
              { value: 'individual', label: 'Individual' },
              { value: 'group', label: 'Group' },
            ]}
          />
        </div>

        {/* Patient or Group Selection */}
        {formData.sessionType === 'individual'
          ? (
              <Dropdown
                label="Patient"
                value={formData.patientId || ''}
                onChange={value => setFormData({ ...formData, patientId: value })}
                options={loadingPatients ? [{ value: '', label: 'Loading patients...' }] : patients}
                placeholder="Select a patient..."
                disabled={loadingPatients}
              />
            )
          : (
              <Dropdown
                label="Group"
                value={formData.groupId || ''}
                onChange={value => setFormData({ ...formData, groupId: value })}
                options={loadingGroups ? [{ value: '', label: 'Loading groups...' }] : groups}
                placeholder="Select a group..."
                disabled={loadingGroups}
              />
            )}

        {/* File Upload Area */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Audio File
          </label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative rounded-xl border-2 border-dashed p-12 text-center transition-colors
              ${dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 bg-gray-50'}
              ${formData.audioFile ? 'border-green-300 bg-green-50' : ''}
              ${uploadingFile ? 'cursor-wait border-indigo-300 bg-indigo-50' : ''}
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
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
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
                        className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )
              : formData.audioFile
                ? (
                    <div className="space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <Upload className="h-6 w-6 text-green-600" />
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
