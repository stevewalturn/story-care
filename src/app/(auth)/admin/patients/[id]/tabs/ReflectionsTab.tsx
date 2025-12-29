'use client';

import { Book, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type ReflectionsTabProps = {
  patientId: string;
};

type ReflectionResponse = {
  id: string;
  question: string;
  answer: string;
  source: string;
  timestamp: string;
  questionNumber?: number;
};

export function ReflectionsTab({ patientId }: ReflectionsTabProps) {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<ReflectionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch reflections from API
  useEffect(() => {
    if (!user?.uid || !patientId) return;

    const fetchReflections = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/patients/${patientId}/responses?type=reflections`, user);
        if (response.ok) {
          const data = await response.json();
          setReflections(data.reflectionResponses || []);
        }
      } catch (error) {
        console.error('Error fetching reflections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReflections();
  }, [user, patientId]);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInMinutes > 0) return `${diffInMinutes} min ago`;
    return 'Just now';
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  // Empty state
  if (reflections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <MessageCircle className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="mb-1 text-sm font-medium text-gray-900">No reflections yet</h3>
        <p className="text-sm text-gray-500">
          Reflection responses will appear here when the patient completes reflections
        </p>
      </div>
    );
  }

  // Group reflections by source (page)
  const groupedReflections = reflections.reduce(
    (acc, reflection) => {
      const source = reflection.source || 'Story Page';
      if (!acc[source]) {
        acc[source] = [];
      }
      acc[source].push(reflection);
      return acc;
    },
    {} as Record<string, ReflectionResponse[]>,
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedReflections).map(([source, sourceReflections]) => (
        <div key={source} className="rounded-xl bg-gray-50 p-6">
          {/* Module Header */}
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">{source}</h2>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500">{sourceReflections.length} Questions</span>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {sourceReflections.map((reflection, index) => (
              <div key={reflection.id} className="rounded-xl border border-gray-100 bg-white p-5">
                {/* Question Header with Number */}
                <div className="mb-3 flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                    {reflection.questionNumber || index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{reflection.question}</h3>
                  </div>
                </div>

                {/* Answer */}
                <p className="font-semibold text-gray-900">"{reflection.answer}"</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              <span>{source}</span>
            </div>
            <span>{formatRelativeTime(sourceReflections[0]?.timestamp || new Date().toISOString())}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
