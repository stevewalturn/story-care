'use client';

import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: SessionUploadData) => void;
}

export interface SessionUploadData {
  title: string;
  sessionDate: string;
  sessionType: 'individual' | 'group';
  patientId?: string;
  groupId?: string;
  audioFile: File | null;
}

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [formData, setFormData] = useState<SessionUploadData>({
    title: '',
    sessionDate: new Date().toISOString().split('T')[0],
    sessionType: 'individual',
    patientId: '',
    groupId: '',
    audioFile: null,
  });

  const [dragActive, setDragActive] = useState(false);
  const [patients, setPatients] = useState<Array<{ value: string; label: string }>>([]);
  const [groups, setGroups] = useState<Array<{ value: string; label: string }>>([]);

  // Fetch patients and groups when modal opens
  useEffect(() => {
    if (isOpen) {
      // Fetch patients
      fetch('/api/patients')
        .then((res) => res.json())
        .then((data) => {
          const patientOptions = data.patients?.map((p: any) => ({
            value: p.id,
            label: p.name,
          })) || [];
          setPatients([{ value: '', label: 'Select a patient...' }, ...patientOptions]);
        })
        .catch((err) => {
          console.error('Failed to fetch patients:', err);
          // Fallback to mock data
          setPatients([
            { value: '', label: 'Select a patient...' },
            { value: '1', label: 'Emma Wilson' },
            { value: '2', label: 'Michael Chen' },
            { value: '3', label: 'Sarah Martinez' },
          ]);
        });

      // Fetch groups
      fetch('/api/groups')
        .then((res) => res.json())
        .then((data) => {
          const groupOptions = data.groups?.map((g: any) => ({
            value: g.id,
            label: g.name,
          })) || [];
          setGroups([{ value: '', label: 'Select a group...' }, ...groupOptions]);
        })
        .catch((err) => {
          console.error('Failed to fetch groups:', err);
          // Fallback to mock data
          setGroups([
            { value: '', label: 'Select a group...' },
            { value: '1', label: "Men's Support Group" },
            { value: '2', label: 'Anxiety Management' },
          ]);
        });
    }
  }, [isOpen]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        setFormData({ ...formData, audioFile: file });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, audioFile: e.target.files[0] });
    }
  };

  const handleSubmit = () => {
    if (!formData.audioFile || !formData.title) {
      return;
    }
    onUpload(formData);
    onClose();
  };

  const canSubmit =
    formData.title &&
    formData.audioFile &&
    ((formData.sessionType === 'individual' && formData.patientId) ||
      (formData.sessionType === 'group' && formData.groupId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Session"
      description="Upload an audio file to begin the transcription and analysis process."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Continue to Speaker Labeling
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Session Title */}
        <Input
          label="Session Title"
          placeholder="e.g., Weekly Check-in"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        {/* Session Date and Type */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Session Date"
            type="date"
            value={formData.sessionDate}
            onChange={(e) =>
              setFormData({ ...formData, sessionDate: e.target.value })
            }
          />
          <Dropdown
            label="Session Type"
            value={formData.sessionType}
            onChange={(value) =>
              setFormData({
                ...formData,
                sessionType: value as 'individual' | 'group',
              })
            }
            options={[
              { value: 'individual', label: 'Individual' },
              { value: 'group', label: 'Group' },
            ]}
          />
        </div>

        {/* Patient or Group Selection */}
        {formData.sessionType === 'individual' ? (
          <Dropdown
            label="Patient"
            value={formData.patientId || ''}
            onChange={(value) => setFormData({ ...formData, patientId: value })}
            options={patients}
            placeholder="Select a patient..."
          />
        ) : (
          <Dropdown
            label="Group"
            value={formData.groupId || ''}
            onChange={(value) => setFormData({ ...formData, groupId: value })}
            options={groups}
            placeholder="Select a group..."
          />
        )}

        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audio File
          </label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition-colors
              ${dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 bg-gray-50'}
              ${formData.audioFile ? 'bg-green-50 border-green-300' : ''}
            `}
          >
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {formData.audioFile ? (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {formData.audioFile.name}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, audioFile: null });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {(formData.audioFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Drag & drop an audio file here
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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
