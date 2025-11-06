/**
 * Patient Response Detail Page
 * View individual patient's responses to all story pages
 */

'use client';

import { ArrowLeft, FileText, ListChecks, MessageSquare } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type PageResponse = {
  pageId: string;
  pageTitle: string;
  completedAt: string | null;
  reflectionResponses: Array<{
    questionId: string;
    questionText: string;
    responseText: string;
    createdAt: string;
  }>;
  surveyResponses: Array<{
    questionId: string;
    questionText: string;
    responseValue: string | null;
    responseNumeric: number | null;
    createdAt: string;
  }>;
};

type PatientInfo = {
  id: string;
  name: string;
};

export default function PatientResponseDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [responses, setResponses] = useState<PageResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && resolvedParams.patientId) {
      fetchPatientResponses();
    }
  }, [user, resolvedParams.patientId]);

  const fetchPatientResponses = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `/api/therapist/responses/${resolvedParams.patientId}`,
        user,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch patient responses');
      }

      const data = await response.json();
      setPatient(data.patient);
      setResponses(data.responses || []);
    } catch (error) {
      console.error('Failed to fetch patient responses:', error);
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (window.location.href = '/therapist/responses')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Patients
        </Button>

        <h1 className="text-2xl font-bold text-gray-900">
          {patient?.name}
          's Responses
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          View all responses from
          {' '}
          {patient?.name}
          {' '}
          across their story pages
        </p>
      </div>

      {/* Responses by Page */}
      <div className="space-y-6">
        {responses.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No responses from this patient yet
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Responses will appear here once the patient completes story pages
            </p>
          </div>
        ) : (
          responses.map(pageResponse => (
            <div
              key={pageResponse.pageId}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              {/* Page Header */}
              <div className="border-b border-gray-200 bg-gray-50 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <FileText className="mr-3 h-6 w-6 text-indigo-600" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {pageResponse.pageTitle}
                      </h2>
                      {pageResponse.completedAt && (
                        <p className="text-sm text-gray-600">
                          Completed on
                          {' '}
                          {new Date(pageResponse.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Responses Content */}
              <div className="p-6">
                {/* Reflection Responses */}
                {pageResponse.reflectionResponses.length > 0 && (
                  <div className="mb-6">
                    <div className="mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">
                        Reflection Questions
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {pageResponse.reflectionResponses.map((response, idx) => (
                        <div
                          key={response.questionId}
                          className="rounded-lg border border-indigo-100 bg-indigo-50 p-4"
                        >
                          <p className="mb-2 font-medium text-gray-900">
                            {idx + 1}
                            .
                            {' '}
                            {response.questionText}
                          </p>
                          <p className="whitespace-pre-wrap text-gray-700">
                            {response.responseText}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            Answered on
                            {' '}
                            {new Date(response.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Survey Responses */}
                {pageResponse.surveyResponses.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">
                        Survey Questions
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {pageResponse.surveyResponses.map((response, idx) => (
                        <div
                          key={response.questionId}
                          className="rounded-lg border border-green-100 bg-green-50 p-4"
                        >
                          <p className="mb-2 font-medium text-gray-900">
                            {idx + 1}
                            .
                            {' '}
                            {response.questionText}
                          </p>
                          <p className="text-gray-700">
                            {response.responseNumeric !== null
                              ? `Rating: ${response.responseNumeric}/10`
                              : response.responseValue || 'No response'}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            Answered on
                            {' '}
                            {new Date(response.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No responses yet for this page */}
                {pageResponse.reflectionResponses.length === 0
                  && pageResponse.surveyResponses.length === 0 && (
                  <p className="text-center text-sm text-gray-500">
                    No responses yet for this page
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
