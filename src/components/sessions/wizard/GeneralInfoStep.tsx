'use client';

import type { SessionFormData } from './types';
import { Calendar, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PatientModal } from '@/components/patients/PatientModal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';
import { DatePickerModal } from './DatePickerModal';
import { GroupSessionConfirmation } from './GroupSessionConfirmation';
import { PatientSelectorDropdown } from './PatientSelectorDropdown';
import { RecentSessionsModal } from './RecentSessionsModal';

type GeneralInfoStepProps = {
  formData: SessionFormData;
  onNext: (data: Partial<SessionFormData>) => void;
  onCancel: () => void;
  onChange?: (data: Partial<SessionFormData>) => void;
  initialPatientId?: string;
};

type Patient = {
  id: string;
  name: string;
  avatarUrl?: string;
  referenceImageUrl?: string;
};

type RecentSession = {
  id: string;
  title: string;
  patients: Patient[];
  createdAt: Date;
};

export function GeneralInfoStep({ formData, onNext, onCancel: _onCancel, onChange, initialPatientId }: GeneralInfoStepProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(formData.title);
  const [sessionDate, setSessionDate] = useState(formData.sessionDate);
  const [description, setDescription] = useState(formData.description);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>(formData.patientIds);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showRecentSessions, setShowRecentSessions] = useState(false);
  const [showGroupConfirmation, setShowGroupConfirmation] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Fetch patients when component mounts
  useEffect(() => {
    if (!user?.uid) return;

    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const res = await authenticatedFetch(`/api/patients?therapistId=${user.uid}`, user);
        const data = await res.json();
        setPatients(data.patients || []);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
        setPatients([]);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [user?.uid]);

  // Auto-select patient if initialPatientId is provided
  useEffect(() => {
    if (initialPatientId && patients.length > 0 && selectedPatientIds.length === 0) {
      // Check if the patient exists in our patients list
      const patientExists = patients.some(p => p.id === initialPatientId);
      if (patientExists) {
        setSelectedPatientIds([initialPatientId]);
      }
    }
  }, [initialPatientId, patients, selectedPatientIds.length]);

  // Fetch recent sessions for quick selection
  useEffect(() => {
    if (!user?.uid) return;

    const fetchRecentSessions = async () => {
      try {
        const res = await authenticatedFetch(`/api/sessions/recent?therapistId=${user.uid}&limit=5`, user);
        const data = await res.json();
        setRecentSessions(data.sessions || []);
      } catch (err) {
        console.error('Failed to fetch recent sessions:', err);
        setRecentSessions([]);
      }
    };

    fetchRecentSessions();
  }, [user?.uid]);

  const selectedPatients = patients.filter(p => selectedPatientIds.includes(p.id));

  // Notify parent of form changes
  useEffect(() => {
    onChange?.({
      title,
      sessionDate,
      description,
      patientIds: selectedPatientIds,
      selectedPatients,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, sessionDate, description, selectedPatientIds]);

  const handleDateSelect = (date: Date) => {
    // Store full ISO datetime string
    setSessionDate(date.toISOString());
    setShowDatePicker(false);
  };

  const handlePatientToggle = (patientId: string) => {
    setSelectedPatientIds(prev =>
      prev.includes(patientId)
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId],
    );
  };

  const handleRemovePatient = (patientId: string) => {
    setSelectedPatientIds(prev => prev.filter(id => id !== patientId));
  };

  const handleRecentSessionSelect = (session: RecentSession) => {
    const patientIds = session.patients.map(p => p.id);
    setSelectedPatientIds(patientIds);
    setShowRecentSessions(false);

    // If multiple patients selected, show group confirmation
    if (patientIds.length > 1) {
      setShowGroupConfirmation(true);
    }
  };

  const handleAddPatient = () => {
    setShowAddPatientModal(true);
  };

  const handleSaveNewPatient = async (patientData: Partial<Patient>) => {
    if (!user?.uid) return;

    try {
      // Determine therapistId (same logic as patients page)
      const therapistId = user.uid;

      // Create patient via API
      const response = await authenticatedPost('/api/patients', user, {
        ...patientData,
        therapistId,
      });

      if (response.ok) {
        const data = await response.json();
        const newPatient = data.patient;

        // Add new patient to local patients list
        setPatients(prev => [...prev, newPatient]);

        // Auto-select the newly created patient
        setSelectedPatientIds(prev => [...prev, newPatient.id]);

        // Close modal
        setShowAddPatientModal(false);
      } else {
        const error = await response.json();
        console.error('Failed to create patient:', error);
        alert(`Failed to create patient: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Error creating patient. Please try again.');
    }
  };

  const handleGroupConfirmationContinue = () => {
    setShowGroupConfirmation(false);
    onNext({
      title,
      sessionDate,
      description,
      patientIds: selectedPatientIds,
      selectedPatients,
    });
  };

  // Format date and time for display
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const timeFormatted = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dateFormatted} at ${timeFormatted}`;
  };

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="font-jakarta text-[16px] leading-[1.5] font-bold text-[#1d2025]">Add General Information</h2>
        <p className="font-jakarta mt-2 text-[14px] leading-[1.5] font-medium text-[#7d7f83]">
          Fill out the general information for this session
        </p>
      </div>

      <div className="mx-auto w-[410px] space-y-[20px]">
        {/* Session Title */}
        <div>
          <label className="font-sf-pro mb-2 block text-[14px] font-medium tracking-[-0.28px] text-[#090909]">
            Session Title
          </label>
          <Input
            placeholder="Weekly check-in"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Session Date & Time */}
        <div>
          <label className="font-sf-pro mb-2 block text-[14px] font-medium tracking-[-0.28px] text-[#090909]">
            Session Date & Time
          </label>
          <button
            onClick={() => setShowDatePicker(true)}
            className="font-sf-pro focus:ring-opacity-20 flex w-full items-center justify-between rounded-[8px] border border-[#e4e4e4] bg-white px-[14px] py-[12px] text-left text-[14px] tracking-[-0.14px] text-gray-900 hover:border-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-600 focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{sessionDate ? formatDateTime(sessionDate) : 'Select date & time'}</span>
            </div>
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Session Description */}
        <div>
          <label className="font-sf-pro mb-2 block text-[14px] font-medium tracking-[-0.28px] text-[#090909]">
            Session Description
          </label>
          <Textarea
            placeholder="Enter session description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full resize-none"
          />
        </div>

        {/* Patient Selection */}
        <div>
          <label className="font-sf-pro mb-2 block text-[14px] font-medium tracking-[-0.28px] text-[#090909]">
            Patient
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <button
                onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                className="font-sf-pro focus:ring-opacity-20 flex w-full items-center justify-between rounded-[8px] border border-[#e4e4e4] bg-white px-[14px] py-[12px] text-left text-[14px] tracking-[-0.14px] hover:border-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              >
                <span className={selectedPatientIds.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                  {selectedPatientIds.length === 0 ? 'Select a patient' : `${selectedPatientIds.length} selected`}
                </span>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPatientDropdown && (
                <PatientSelectorDropdown
                  patients={patients}
                  selectedPatientIds={selectedPatientIds}
                  onTogglePatient={handlePatientToggle}
                  onClose={() => setShowPatientDropdown(false)}
                  loading={loadingPatients}
                />
              )}
            </div>

            <button
              onClick={handleAddPatient}
              className="flex h-[44px] w-[44px] items-center justify-center rounded-[8px] border-2 border-[#e4e4e4] bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 text-[#898989]" />
            </button>
          </div>
        </div>

        {/* Selected Patients */}
        {selectedPatients.length > 0 && (
          <div>
            <label className="font-sf-pro mb-2 block text-[14px] font-medium tracking-[-0.28px] text-[#090909]">
              Selected Patient
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedPatients.map((patient, index) => {
                // Cycle through pastel colors for each patient
                const colors = [
                  'bg-[#e9d5ff] text-[#581c87]', // Light purple
                  'bg-[#fce7f3] text-[#831843]', // Light pink
                  'bg-[#fef3c7] text-[#78350f]', // Light yellow
                  'bg-[#dbeafe] text-[#1e3a8a]', // Light blue
                  'bg-[#ccfbf1] text-[#134e4a]', // Light teal
                  'bg-[#fed7d7] text-[#7f1d1d]', // Light coral
                ];
                const colorClass = colors[index % colors.length];

                return (
                  <div
                    key={patient.id}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${colorClass}`}
                  >
                    {patient.avatarUrl || patient.referenceImageUrl
                      ? (
                          <img
                            src={patient.avatarUrl || patient.referenceImageUrl}
                            alt={patient.name}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        )
                      : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold opacity-80">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                    <span>{patient.name}</span>
                    <button
                      onClick={() => handleRemovePatient(patient.id)}
                      className="ml-1 opacity-60 hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DatePickerModal
        isOpen={showDatePicker}
        selectedDate={sessionDate ? new Date(sessionDate) : undefined}
        onSelect={handleDateSelect}
        onClose={() => setShowDatePicker(false)}
      />

      <RecentSessionsModal
        isOpen={showRecentSessions}
        sessions={recentSessions}
        onSelect={handleRecentSessionSelect}
        onClose={() => setShowRecentSessions(false)}
      />

      <GroupSessionConfirmation
        isOpen={showGroupConfirmation}
        patientCount={selectedPatientIds.length}
        onContinue={handleGroupConfirmationContinue}
        onCancel={() => setShowGroupConfirmation(false)}
      />

      <PatientModal
        isOpen={showAddPatientModal}
        patient={undefined}
        onClose={() => setShowAddPatientModal(false)}
        onSave={handleSaveNewPatient}
      />
    </div>
  );
}
