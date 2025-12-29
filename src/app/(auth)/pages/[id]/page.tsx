/**
 * Story Page Viewer
 * Patient-facing view of a story page with content and questions
 */

'use client';

import { BookOpen, CheckCircle } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

type StoryPage = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  publishedAt: string | null;
};

type Block = {
  id: string;
  blockType: string;
  sequenceNumber: number;
  textContent: string | null;
  mediaId: string | null;
  sceneId: string | null;
  settings: any;
};

type Question = {
  id: string;
  questionText: string;
  questionType: string;
  options: string[] | null;
};

export default function StoryViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [page, setPage] = useState<StoryPage | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [reflectionQuestions, setReflectionQuestions] = useState<Question[]>([]);
  const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Response states
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>({});
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user && resolvedParams.id) {
      fetchStoryPage();
    }
  }, [user, resolvedParams.id]);

  const fetchStoryPage = async () => {
    try {
      setLoading(true);
      const idToken = await user?.getIdToken();

      // Fetch page details
      const pageResponse = await fetch(`/api/pages/${resolvedParams.id}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!pageResponse.ok) {
        throw new Error('Failed to fetch story page');
      }

      const pageData = await pageResponse.json();
      setPage(pageData.page);
      setBlocks(pageData.blocks || []);

      // Fetch questions for reflection/survey blocks
      const reflectionBlocks = pageData.blocks?.filter((b: Block) => b.blockType === 'reflection') || [];
      const surveyBlocks = pageData.blocks?.filter((b: Block) => b.blockType === 'survey') || [];

      if (reflectionBlocks.length > 0) {
        const refResponse = await fetch(`/api/questions/reflection?blockIds=${reflectionBlocks.map((b: Block) => b.id).join(',')}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (refResponse.ok) {
          const refData = await refResponse.json();
          setReflectionQuestions(refData.questions || []);
        }
      }

      if (surveyBlocks.length > 0) {
        const surveyResponse = await fetch(`/api/questions/survey?blockIds=${surveyBlocks.map((b: Block) => b.id).join(',')}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (surveyResponse.ok) {
          const surveyData = await surveyResponse.json();
          setSurveyQuestions(surveyData.questions || []);
        }
      }
    } catch (err) {
      console.error('Error fetching story page:', err);
      setError(err instanceof Error ? err.message : 'Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReflections = async () => {
    if (!user) {
      return;
    }

    try {
      setSubmitting(true);
      const idToken = await user.getIdToken();

      const responses = reflectionQuestions.map(q => ({
        questionId: q.id,
        pageId: resolvedParams.id,
        responseText: reflectionAnswers[q.id] || '',
      }));

      const response = await fetch('/api/responses/reflection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ responses }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reflections');
      }

      alert('Reflections submitted successfully!');
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting reflections:', err);
      alert('Failed to submit reflections. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSurvey = async () => {
    if (!user) {
      return;
    }

    try {
      setSubmitting(true);
      const idToken = await user.getIdToken();

      const responses = surveyQuestions.map(q => ({
        questionId: q.id,
        pageId: resolvedParams.id,
        responseValue: surveyAnswers[q.id] || '',
        responseNumeric: !isNaN(Number(surveyAnswers[q.id])) ? Number(surveyAnswers[q.id]) : null,
      }));

      const response = await fetch('/api/responses/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ responses }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      alert('Survey submitted successfully!');
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting survey:', err);
      alert('Failed to submit survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error || 'Story not found'}</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-start">
            <BookOpen className="mr-4 h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
              {page.description && (
                <p className="mt-2 text-gray-600">{page.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Story Blocks */}
          {blocks
            .filter(b => b.blockType !== 'reflection' && b.blockType !== 'survey')
            .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
            .map(block => (
              <div key={block.id} className="rounded-lg bg-white p-6 shadow">
                {block.blockType === 'text' && block.textContent && (
                  <div className="prose max-w-none">
                    <p>{block.textContent}</p>
                  </div>
                )}
                {block.blockType === 'image' && block.mediaId && (
                  <img
                    src={`/api/media/${block.mediaId}`}
                    alt="Story content"
                    className="w-full rounded-lg"
                  />
                )}
                {block.blockType === 'video' && block.sceneId && (
                  <video
                    src={`/api/scenes/${block.sceneId}/video`}
                    controls
                    className="w-full rounded-lg"
                  />
                )}
              </div>
            ))}

          {/* Reflection Questions */}
          {reflectionQuestions.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Reflection Questions
              </h2>
              <div className="space-y-4">
                {reflectionQuestions.map(question => (
                  <div key={question.id}>
                    <label className="block text-sm font-medium text-gray-700">
                      {question.questionText}
                    </label>
                    {question.questionType === 'open_text' || question.questionType === 'multiline'
                      ? (
                          <textarea
                            rows={4}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            value={reflectionAnswers[question.id] || ''}
                            onChange={e => setReflectionAnswers({ ...reflectionAnswers, [question.id]: e.target.value })}
                          />
                        )
                      : question.questionType === 'multiple_choice' && question.options
                        ? (
                            <div className="mt-2 space-y-2">
                              {question.options.map((option, idx) => (
                                <label key={idx} className="flex items-center">
                                  <input
                                    type="radio"
                                    name={question.id}
                                    value={option}
                                    checked={reflectionAnswers[question.id] === option}
                                    onChange={e => setReflectionAnswers({ ...reflectionAnswers, [question.id]: e.target.value })}
                                    className="mr-2"
                                  />
                                  <span className="text-sm text-gray-700">{option}</span>
                                </label>
                              ))}
                            </div>
                          )
                        : null}
                  </div>
                ))}
              </div>
              <Button
                variant="primary"
                onClick={handleSubmitReflections}
                disabled={submitting || submitted}
                className="mt-6"
              >
                {submitted
                  ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Submitted
                      </>
                    )
                  : submitting
                    ? (
                        'Submitting...'
                      )
                    : (
                        'Submit Reflections'
                      )}
              </Button>
            </div>
          )}

          {/* Survey Questions */}
          {surveyQuestions.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Survey
              </h2>
              <div className="space-y-4">
                {surveyQuestions.map(question => (
                  <div key={question.id}>
                    <label className="block text-sm font-medium text-gray-700">
                      {question.questionText}
                    </label>
                    {question.questionType === 'scale'
                      ? (
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={surveyAnswers[question.id] || '5'}
                            onChange={e => setSurveyAnswers({ ...surveyAnswers, [question.id]: e.target.value })}
                            className="mt-2 w-full"
                          />
                        )
                      : (
                          <input
                            type="text"
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            value={surveyAnswers[question.id] || ''}
                            onChange={e => setSurveyAnswers({ ...surveyAnswers, [question.id]: e.target.value })}
                          />
                        )}
                  </div>
                ))}
              </div>
              <Button
                variant="primary"
                onClick={handleSubmitSurvey}
                disabled={submitting || submitted}
                className="mt-6"
              >
                {submitted
                  ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Submitted
                      </>
                    )
                  : submitting
                    ? (
                        'Submitting...'
                      )
                    : (
                        'Submit Survey'
                      )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
