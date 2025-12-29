'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageEditor } from '@/components/pages/PageEditor';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';

type Patient = {
  id: string;
  name: string;
};

export default function NewPagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    if (!user) return;

    try {
      const response = await authenticatedFetch('/api/patients', user);
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();
      setPatients(data.patients);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user, fetchPatients]);

  const handleSavePage = async (title: string, blocks: any[], patientId: string | null) => {
    try {
      const response = await authenticatedPost('/api/pages', user, {
        title,
        blocks,
        patientId,
      });

      if (!response.ok) {
        throw new Error('Failed to create page');
      }

      router.push('/pages');
    } catch (error) {
      console.error('Failed to create page:', error);
      alert('Failed to create page. Please try again.');
    }
  };

  const handleClose = () => {
    router.push('/pages');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <PageEditor
        patients={patients}
        onSave={handleSavePage}
        onClose={handleClose}
      />
    </div>
  );
}
