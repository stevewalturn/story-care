'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientList } from '@/components/patients/PatientList';
import { PatientModal } from '@/components/patients/PatientModal';
import { authenticatedFetch, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/AuthenticatedFetch';

interface Patient {
  id: string;
  name: string;
  email: string;
  referenceImageUrl?: string;
  avatarUrl?: string;
  sessionCount: number;
  lastSession?: string;
  createdAt: string | Date;
}

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();

  // Fetch patients from API when user is available
  useEffect(() => {
    if (user?.uid) {
      fetchPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/patients?therapistId=${user.uid}`, user);
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      } else {
        console.error('Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingPatient(undefined);
    setShowModal(true);
  };

  const handleEditClick = (patient: Patient) => {
    setEditingPatient(patient);
    setShowModal(true);
  };

  const handleSave = async (patientData: Partial<Patient>) => {
    try {
      if (editingPatient) {
        // Update existing patient
        const response = await authenticatedPut(`/api/patients/${editingPatient.id}`, user, patientData);

        if (response.ok) {
          // Refresh the list
          await fetchPatients();
        } else {
          console.error('Failed to update patient');
        }
      } else {
        // Create new patient - assign to current therapist
        const response = await authenticatedPost('/api/patients', user, {
          ...patientData,
          therapistId: user?.uid,
        });

        if (response.ok) {
          // Refresh the list
          await fetchPatients();
        } else {
          console.error('Failed to create patient');
        }
      }

      setShowModal(false);
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  const handleDelete = async (patientId: string) => {
    try {
      const response = await authenticatedDelete(`/api/patients/${patientId}`, user);

      if (response.ok) {
        // Refresh the list
        await fetchPatients();
      } else {
        console.error('Failed to delete patient');
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  return (
    <div className="p-8">
      {loading ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Loading patients...</p>
        </div>
      ) : (
        <PatientList
          patients={patients}
          onAddClick={handleAddClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDelete}
        />
      )}

      <PatientModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        patient={editingPatient}
      />
    </div>
  );
}
