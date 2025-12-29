/**
 * Story Page Response Detail Page
 * View all responses for a specific story page
 */

'use client';

import { ArrowLeft, Clock, FileText, MessageSquare } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type PageInfo = {
  id: string;
  title: string;
  patientName: string;
  publishedAt: string | null;
};

type ReflectionResponse = {
  id: string;
  questionText: string;
  responseText: string;
  createdAt: string;
  updatedAt: string;
};

type SurveyResponse = {
  id: string;
  questionText: string;
  questionType: string;
  responseValue: string | null;
  responseNumeric: number | null;
  createdAt: string;
};

export default function PageResponseDetailPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [reflectionResponses, setReflectionResponses] = useState<ReflectionResponse[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && resolvedParams.pageId) {
      fetchResponses();
    }
  }, [user, resolvedParams.pageId]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `/api/therapist/responses/${resolvedParams.pageId}`,
        user,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch responses');
      }

      const data = await response.json();
      setPageInfo(data.page);
      setReflectionResponses(data.reflectionResponses || []);
      setSurveyResponses(data.surveyResponses || []);
    } catch (error) {
      console.error('Failed to fetch responses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (!pageInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Page not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            window.location.href = '/therapist/responses';
          }}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Responses
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageInfo.title}</h1>
            <p className="mt-1 text-sm text-gray-600">
              Patient:
              {pageInfo.patientName}
            </p>
            {pageInfo.publishedAt && (
              <p className="mt-1 text-xs text-gray-500">
                Published:
                {' '}
                {new Date(pageInfo.publishedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-white px-4 py-2 shadow-sm">
              <p className="text-xs text-gray-600">Reflection Responses</p>
              <p className="text-2xl font-bold text-purple-600">{reflectionResponses.length}</p>
            </div>
            <div className="rounded-lg bg-white px-4 py-2 shadow-sm">
              <p className="text-xs text-gray-600">Survey Responses</p>
              <p className="text-2xl font-bold text-green-600">{surveyResponses.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reflection Responses */}
      {reflectionResponses.length > 0 && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Reflection Responses</h2>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {reflectionResponses.map((response, index) => (
              <div key={response.id} className="p-6">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {index + 1}
                      .
                      {response.questionText}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(response.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-lg bg-purple-50 p-4">
                  <p className="text-sm whitespace-pre-wrap text-gray-700">{response.responseText}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Survey Responses */}
      {surveyResponses.length > 0 && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Survey Responses</h2>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {surveyResponses.map((response, index) => (
              <div key={response.id} className="p-6">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {index + 1}
                      .
                      {response.questionText}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {response.questionType}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {new Date(response.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-lg bg-green-50 p-4">
                  {response.questionType === 'scale' && response.responseNumeric !== null ? (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Rating:
                        {' '}
                        {response.responseNumeric}
                      </p>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-green-600"
                          style={{ width: `${(response.responseNumeric / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap text-gray-700">
                      {response.responseValue || 'No response'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {reflectionResponses.length === 0 && surveyResponses.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No responses yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Responses will appear here once the patient completes them
          </p>
        </div>
      )}
    </div>
  );
}
