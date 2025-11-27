/**
 * Therapist Responses Dashboard
 * View story page responses to reflection questions and surveys
 */

'use client';

import { CheckCircle, Clock, FileText, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type PageResponse = {
  pageId: string;
  pageTitle: string;
  patientId: string;
  patientName: string;
  reflectionResponseCount: number;
  surveyResponseCount: number;
  totalResponses: number;
  hasResponses: boolean;
  lastResponseAt: string | null;
  publishedAt: string | null;
};

export default function TherapistResponsesPage() {
  const { user } = useAuth();
  const [pages, setPages] = useState<PageResponse[]>([]);
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
      setPages(data.pages || []);
    } catch (error) {
      console.error('Failed to fetch responses:', error);
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const pagesWithResponses = pages.filter(p => p.hasResponses);
  const pagesWithoutResponses = pages.filter(p => !p.hasResponses);

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
        <h1 className="text-2xl font-bold text-gray-900">Story Page Responses</h1>
        <p className="mt-2 text-sm text-gray-600">
          View patient responses to reflection questions and surveys from published story pages
        </p>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-indigo-100 p-3">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published Pages</p>
              <p className="text-2xl font-bold text-gray-900">{pages.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">With Responses</p>
              <p className="text-2xl font-bold text-gray-900">{pagesWithResponses.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-yellow-100 p-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Responses</p>
              <p className="text-2xl font-bold text-gray-900">
                {pages.reduce((sum, p) => sum + p.totalResponses, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pages with Responses */}
      {pagesWithResponses.length > 0 && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Pages with Responses</h2>
            <p className="text-sm text-gray-600">Story pages that have received patient responses</p>
          </div>

          <div className="divide-y divide-gray-200">
            {pagesWithResponses.map(page => (
              <div
                key={page.pageId}
                className="flex items-center justify-between p-6 transition-colors hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-start">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium text-gray-900">{page.pageTitle}</h3>
                      <p className="text-sm text-gray-600">
                        Patient:
                        {page.patientName}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {page.reflectionResponseCount}
                          {' '}
                          reflection
                          {page.reflectionResponseCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {page.surveyResponseCount}
                          {' '}
                          survey
                          {page.surveyResponseCount !== 1 ? 's' : ''}
                        </span>
                        {page.lastResponseAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last:
                            {' '}
                            {new Date(page.lastResponseAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    {page.totalResponses}
                    {' '}
                    responses
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      window.location.href = `/therapist/responses/${page.pageId}`;
                    }}
                  >
                    View Responses
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pages without Responses */}
      {pagesWithoutResponses.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Awaiting Responses</h2>
            <p className="text-sm text-gray-600">Published pages with no responses yet</p>
          </div>

          <div className="divide-y divide-gray-200">
            {pagesWithoutResponses.map(page => (
              <div
                key={page.pageId}
                className="flex items-center justify-between p-6 opacity-60"
              >
                <div className="flex-1">
                  <div className="flex items-start">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-700">{page.pageTitle}</h3>
                      <p className="text-sm text-gray-500">
                        Patient:
                        {page.patientName}
                      </p>
                      {page.publishedAt && (
                        <p className="mt-1 text-xs text-gray-400">
                          Published:
                          {' '}
                          {new Date(page.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  No responses
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {pages.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No published story pages yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Create and publish story pages to start collecting patient responses
          </p>
        </div>
      )}
    </div>
  );
}
