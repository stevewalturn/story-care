/**
 * Therapist Responses Dashboard
 * View story page responses to reflection questions and surveys
 */

'use client';

import {
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  MessageSquare,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type PageResponse = {
  pageId: string;
  pageTitle: string;
  patientId: string;
  patientName: string;
  patientAvatarUrl?: string;
  reflectionResponseCount: number;
  surveyResponseCount: number;
  totalResponses: number;
  hasResponses: boolean;
  lastResponseAt: string | null;
  publishedAt: string | null;
};

export default function TherapistResponsesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pages, setPages] = useState<PageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter pages by search query
  const filteredPagesWithResponses = pagesWithResponses.filter(
    p =>
      p.pageTitle.toLowerCase().includes(searchQuery.toLowerCase())
      || p.patientName.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredPagesWithoutResponses = pagesWithoutResponses.filter(
    p =>
      p.pageTitle.toLowerCase().includes(searchQuery.toLowerCase())
      || p.patientName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalResponses = pages.reduce((sum, p) => sum + p.totalResponses, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Patient Responses</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and analyze patient responses to reflection questions and surveys
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          icon={<FileText className="h-4 w-4" />}
          label="Published Pages"
          value={pages.length}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <MetricCard
          icon={<CheckCircle className="h-4 w-4" />}
          label="With Responses"
          value={pagesWithResponses.length}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <MetricCard
          icon={<MessageSquare className="h-4 w-4" />}
          label="Total Responses"
          value={totalResponses}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by page title or patient name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2.5 pr-4 pl-10 text-sm transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Pages with Responses */}
      {filteredPagesWithResponses.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Pages with Responses</h2>
                <p className="text-xs text-gray-500">
                  {filteredPagesWithResponses.length}
                  {' '}
                  page
                  {filteredPagesWithResponses.length !== 1 ? 's' : ''}
                  {' '}
                  have received patient feedback
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {filteredPagesWithResponses.map(page => (
              <button
                key={page.pageId}
                type="button"
                onClick={() => router.push(`/therapist/responses/${page.pageId}`)}
                className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  {/* Patient Avatar */}
                  {page.patientAvatarUrl
                    ? (
                        <img
                          src={page.patientAvatarUrl}
                          alt={page.patientName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      )
                    : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-sm font-medium text-white">
                          {getInitials(page.patientName)}
                        </div>
                      )}

                  <div>
                    <h3 className="font-medium text-gray-900">{page.pageTitle}</h3>
                    <p className="text-sm text-gray-500">{page.patientName}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
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
                          {formatDate(page.lastResponseAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <CheckCircle className="h-3 w-3" />
                    {page.totalResponses}
                    {' '}
                    response
                    {page.totalResponses !== 1 ? 's' : ''}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pages without Responses */}
      {filteredPagesWithoutResponses.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Awaiting Responses</h2>
                <p className="text-xs text-gray-500">
                  {filteredPagesWithoutResponses.length}
                  {' '}
                  published page
                  {filteredPagesWithoutResponses.length !== 1 ? 's' : ''}
                  {' '}
                  with no responses yet
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {filteredPagesWithoutResponses.map(page => (
              <div
                key={page.pageId}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  {/* Patient Avatar */}
                  {page.patientAvatarUrl
                    ? (
                        <img
                          src={page.patientAvatarUrl}
                          alt={page.patientName}
                          className="h-10 w-10 rounded-full object-cover opacity-60"
                        />
                      )
                    : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-500">
                          {getInitials(page.patientName)}
                        </div>
                      )}

                  <div>
                    <h3 className="font-medium text-gray-600">{page.pageTitle}</h3>
                    <p className="text-sm text-gray-400">{page.patientName}</p>
                    {page.publishedAt && (
                      <p className="mt-1 text-xs text-gray-400">
                        Published
                        {' '}
                        {formatDate(page.publishedAt)}
                      </p>
                    )}
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                  <Clock className="h-3 w-3" />
                  Awaiting
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {pages.length === 0 && (
        <div className="rounded-xl border border-gray-100 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-gray-900">No published pages yet</h3>
          <p className="mx-auto max-w-sm text-sm text-gray-500">
            Create and publish story pages to start collecting patient responses to reflection questions and surveys.
          </p>
        </div>
      )}

      {/* No results from search */}
      {pages.length > 0 && filteredPagesWithResponses.length === 0 && filteredPagesWithoutResponses.length === 0 && (
        <div className="rounded-xl border border-gray-100 bg-white py-12 text-center shadow-sm">
          <Search className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <h3 className="mb-1 font-medium text-gray-900">No results found</h3>
          <p className="text-sm text-gray-500">
            Try adjusting your search query
          </p>
        </div>
      )}
    </div>
  );
}
