/**
 * Therapist Responses Dashboard
 * View patient responses to reflection questions and surveys
 */

'use client';

import { CheckCircle, Clock, MessageSquare, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type PatientResponse = {
  patientId: string;
  patientName: string;
  totalPages: number;
  completedPages: number;
  pendingPages: number;
  lastResponseAt: string | null;
};

export default function TherapistResponsesPage() {
  const { user } = useAuth();
  const [responses, setResponses] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchResponses();
    }
  }, [user]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/therapist/responses', user);
      if (!response.ok) {
        throw new Error('Failed to fetch responses');
      }

      const data = await response.json();
      setResponses(data.responses || []);
    } catch (error) {
      console.error('Failed to fetch responses:', error);
      setResponses([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patient Responses</h1>
        <p className="mt-2 text-sm text-gray-600">
          View and track patient responses to reflection questions and surveys
        </p>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-indigo-100 p-3">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{responses.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {responses.reduce((sum, r) => sum + r.completedPages, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-yellow-100 p-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {responses.reduce((sum, r) => sum + r.pendingPages, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
        </div>

        {responses.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No patient responses yet</p>
            <p className="mt-1 text-xs text-gray-400">
              Assign story pages to patients to start collecting responses
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {responses.map(response => (
              <div
                key={response.patientId}
                className="flex items-center justify-between p-6 transition-colors hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">{response.patientName}</h3>
                      <p className="text-sm text-gray-500">
                        {response.completedPages}
                        {' '}
                        of
                        {' '}
                        {response.totalPages}
                        {' '}
                        pages completed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Progress */}
                  <div className="text-right">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-indigo-600 transition-all"
                          style={{
                            width: `${response.totalPages > 0 ? (response.completedPages / response.totalPages) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {response.totalPages > 0
                          ? Math.round((response.completedPages / response.totalPages) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    {response.lastResponseAt && (
                      <p className="text-xs text-gray-500">
                        Last response:
                        {' '}
                        {new Date(response.lastResponseAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* View Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      window.location.href = `/therapist/responses/${response.patientId}`;
                    }}
                  >
                    View Responses
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
