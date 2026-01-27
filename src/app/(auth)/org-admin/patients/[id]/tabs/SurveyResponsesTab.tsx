'use client';

import { Book, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type SurveyResponsesTabProps = {
  patientId: string;
};

type SurveyResponse = {
  id: string;
  question: string;
  answer: string;
  source: string;
  timestamp: string;
  questionType?: string;
};

export function SurveyResponsesTab({ patientId }: SurveyResponsesTabProps) {
  const { user } = useAuth();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch survey responses from API
  useEffect(() => {
    if (!user?.uid || !patientId) return;

    const fetchResponses = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/patients/${patientId}/responses?type=surveys`, user);
        if (response.ok) {
          const data = await response.json();
          setResponses(data.surveyResponses || []);
        }
      } catch (error) {
        console.error('Error fetching survey responses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
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
  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <SlidersHorizontal className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="mb-1 text-sm font-medium text-gray-900">No survey responses yet</h3>
        <p className="text-sm text-gray-500">
          Survey responses will appear here when the patient completes surveys
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {responses.map(response => (
        <div key={response.id} className="rounded-xl bg-gray-50 p-6">
          {/* Question */}
          <p className="mb-2 text-sm text-gray-500">{response.question}</p>

          {/* Answer - Bold with quotes */}
          <p className="mb-4 font-semibold text-gray-900">
            "
            {response.answer}
            "
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              <span>{response.source}</span>
            </div>
            <span>{formatRelativeTime(response.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
