/**
 * Story Page Response Detail Page
 * View all responses for a specific story page
 */

'use client';

import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  Star,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type PageInfo = {
  id: string;
  title: string;
  patientName: string;
  patientAvatarUrl?: string;
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
  const router = useRouter();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-gray-500">Loading responses...</p>
        </div>
      </div>
    );
  }

  if (!pageInfo) {
    return (
      <div className="p-8">
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-gray-900">Page not found</h3>
          <p className="mb-4 text-sm text-gray-500">The requested page could not be found.</p>
          <button
            type="button"
            onClick={() => router.push('/therapist/responses')}
            className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Responses
          </button>
        </div>
      </div>
    );
  }

  const totalResponses = reflectionResponses.length + surveyResponses.length;

  return (
    <div className="p-8">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.push('/therapist/responses')}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Responses
      </button>

      {/* Header Card */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Patient Avatar */}
              {pageInfo.patientAvatarUrl
                ? (
                    <img
                      src={pageInfo.patientAvatarUrl}
                      alt={pageInfo.patientName}
                      className="h-14 w-14 rounded-full border-2 border-white/30 object-cover"
                    />
                  )
                : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-white/20 text-lg font-semibold text-white">
                      {getInitials(pageInfo.patientName)}
                    </div>
                  )}
              <div>
                <h1 className="text-xl font-semibold text-white">{pageInfo.title}</h1>
                <div className="mt-1 flex items-center gap-3 text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {pageInfo.patientName}
                  </span>
                  {pageInfo.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Published
                      {' '}
                      {formatDate(pageInfo.publishedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Response Count Badge */}
            <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white">
              <CheckCircle className="h-4 w-4" />
              {totalResponses}
              {' '}
              total response
              {totalResponses !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{reflectionResponses.length}</p>
              <p className="text-xs text-gray-500">Reflection Responses</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{surveyResponses.length}</p>
              <p className="text-xs text-gray-500">Survey Responses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reflection Responses */}
      {reflectionResponses.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Reflection Responses</h2>
                <p className="text-xs text-gray-500">
                  {reflectionResponses.length}
                  {' '}
                  written reflection
                  {reflectionResponses.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {reflectionResponses.map((response, index) => (
              <div key={response.id} className="p-6">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{response.questionText}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(response.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-9 rounded-lg border border-purple-100 bg-purple-50/50 p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                    {response.responseText}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Survey Responses */}
      {surveyResponses.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Survey Responses</h2>
                <p className="text-xs text-gray-500">
                  {surveyResponses.length}
                  {' '}
                  survey answer
                  {surveyResponses.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {surveyResponses.map((response, index) => (
              <div key={response.id} className="p-6">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{response.questionText}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {response.questionType}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(response.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-9 rounded-lg border border-green-100 bg-green-50/50 p-4">
                  {response.questionType === 'scale' && response.responseNumeric !== null
                    ? (
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`h-5 w-5 ${
                                    star <= response.responseNumeric!
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {response.responseNumeric}
                              /5
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                              style={{ width: `${(response.responseNumeric / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
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
        <div className="rounded-xl border border-gray-100 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-gray-900">No responses yet</h3>
          <p className="mx-auto max-w-sm text-sm text-gray-500">
            Responses will appear here once the patient completes them.
          </p>
        </div>
      )}
    </div>
  );
}
