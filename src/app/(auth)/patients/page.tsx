'use client';

import { useState } from 'react';
import { PatientList } from '@/components/patients/PatientList';
import { PatientModal } from '@/components/patients/PatientModal';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  referenceImageUrl?: string;
  sessionCount: number;
  lastSession?: string;
  createdAt: Date;
  notes?: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: '1',
      name: 'Emma Wilson',
      email: 'emma@example.com',
      phone: '(555) 123-4567',
      referenceImageUrl: 'https://i.pravatar.cc/150?img=1',
      sessionCount: 8,
      lastSession: '2 days ago',
      createdAt: new Date(2025, 8, 1),
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael@example.com',
      phone: '(555) 234-5678',
      referenceImageUrl: 'https://i.pravatar.cc/150?img=3',
      sessionCount: 5,
      lastSession: '1 week ago',
      createdAt: new Date(2025, 8, 15),
    },
    {
      id: '3',
      name: 'Sarah Martinez',
      email: 'sarah@example.com',
      phone: '(555) 345-6789',
      sessionCount: 12,
      lastSession: 'Today',
      createdAt: new Date(2025, 7, 10),
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();

  const handleAddClick = () => {
    setEditingPatient(undefined);
    setShowModal(true);
  };

  const handleEditClick = (patient: Patient) => {
    setEditingPatient(patient);
    setShowModal(true);
  };

  const handleSave = async (patientData: Partial<Patient>) => {
    if (editingPatient) {
      // Update existing patient
      setPatients(
        patients.map((p) =>
          p.id === editingPatient.id ? { ...p, ...patientData } : p
        )
      );
    } else {
      // Create new patient
      const newPatient: Patient = {
        id: Date.now().toString(),
        name: patientData.name!,
        email: patientData.email || '',
        phone: patientData.phone || '',
        referenceImageUrl: patientData.referenceImageUrl,
        sessionCount: 0,
        createdAt: new Date(),
        notes: patientData.notes,
      };
      setPatients([...patients, newPatient]);
    }

    // In real implementation, call API:
    // await fetch('/api/patients', { method: 'POST', body: JSON.stringify(patientData) });
  };

  const handleDelete = async (patientId: string) => {
    setPatients(patients.filter((p) => p.id !== patientId));
    // In real implementation: await fetch(`/api/patients/${patientId}`, { method: 'DELETE' });
  };

  return (
    <div className="p-8">
      <PatientList
        patients={patients}
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDelete}
      />

      <PatientModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        patient={editingPatient}
      />
    </div>
  );
}
