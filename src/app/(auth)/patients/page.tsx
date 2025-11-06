'use client';

import { useEffect, useState } from 'react';
import { PatientList } from '@/components/patients/PatientList';
import { PatientModal } from '@/components/patients/PatientModal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedDelete, authenticatedFetch, authenticatedPost, authenticatedPut } from '@/utils/AuthenticatedFetch';

type Patient = {
  id: string;
  name: string;
  email: string;
  referenceImageUrl?: string;
  avatarUrl?: string;
  sessionCount: number;
  lastSession?: string;
  createdAt: string | Date;
  therapistId?: string;
};

type Therapist = {
  firebaseUid: string;
  name: string;
  patientCount: number;
};

export default function PatientsPage() {
  const { user, dbUser } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();

  const isOrgAdmin = dbUser?.role === 'org_admin';

  // Fetch patients from API when user is available
  useEffect(() => {
    if (user?.uid) {
      fetchPatients();
      if (isOrgAdmin) {
        fetchTherapists();
      }
    }
  }, [user, isOrgAdmin]);

  const fetchPatients = async () => {
    if (!user?.uid) {
      return;
    }

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

  const fetchTherapists = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      const response = await authenticatedFetch('/api/therapists', user);
      if (response.ok) {
        const data = await response.json();
        setTherapists(data.therapists || []);
      } else {
        console.error('Failed to fetch therapists');
      }
    } catch (error) {
      console.error('Error fetching therapists:', error);
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
        // Create new patient
        // For org admins: use selected therapistId from form
        // For therapists: assign to themselves
        const therapistId = isOrgAdmin ? patientData.therapistId : user?.uid;

        const response = await authenticatedPost('/api/patients', user, {
          ...patientData,
          therapistId,
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
      {loading
        ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              <p className="text-gray-500">Loading patients...</p>
            </div>
          )
        : (
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
        isOrgAdmin={isOrgAdmin}
        therapists={therapists}
      />
    </div>
  );
}
