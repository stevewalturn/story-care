/**
 * Story Page Viewer Component
 * Displays published story pages with all blocks (text, media, reflection, survey)
 * Used for both authenticated patient view and public share links
 */

'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type PageBlock = {
  id: string;
  blockType: string;
  sequenceNumber: number;
  textContent?: string;
  mediaUrl?: string;
  mediaType?: string;
  settings?: any;
};

type ReflectionQuestion = {
  id: string;
  questionText: string;
  questionType: 'open_text' | 'multiple_choice' | 'scale' | 'emotion';
  options?: string[];
  settings?: any;
};

type Props = {
  pageId: string;
  isPublicShare?: boolean;
};

export function StoryPageViewer({ pageId, isPublicShare: _isPublicShare = false }: Props) {
  const [page, setPage] = useState<any>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [reflectionQuestions, setReflectionQuestions] = useState<ReflectionQuestion[]>([]);
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>({});
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadPageData();
  }, [pageId]);

  async function loadPageData() {
    try {
      setLoading(true);

      // Fetch page data
      const response = await fetch(`/api/pages/${pageId}?includeBlocks=true`);
      if (!response.ok) {
        throw new Error('Failed to load page');
      }

      const data = await response.json();
      setPage(data.page);
      setBlocks(data.blocks || []);
      setReflectionQuestions(data.reflectionQuestions || []);
      setSurveyQuestions(data.surveyQuestions || []);
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReflection() {
    if (submitting) return;

    try {
      setSubmitting(true);

      // Submit reflection answers
      for (const [questionId, answer] of Object.entries(reflectionAnswers)) {
        await fetch('/api/responses/reflection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId,
            pageId,
            answerText: answer,
          }),
        });
      }

      // Submit survey answers
      for (const [questionId, answer] of Object.entries(surveyAnswers)) {
        await fetch('/api/responses/survey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId,
            pageId,
            answer,
          }),
        });
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting responses:', error);
      alert('Failed to submit responses. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-64 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-gray-600">Page not found.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-green-900">Thank You!</h2>
          <p className="text-green-700">
            Your responses have been submitted successfully.
            Your therapist will review them during your next session.
          </p>
        </div>
      </div>
    );
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">{page.title}</h1>
        {page.description && (
          <p className="text-lg text-gray-600">{page.description}</p>
        )}
      </div>

      {/* Content Blocks */}
      <div className="space-y-12">
        {sortedBlocks.map((block) => (
          <div key={block.id} className="rounded-lg">
            {/* Text Block */}
            {block.blockType === 'text' && (
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {block.textContent || ''}
                </ReactMarkdown>
              </div>
            )}

            {/* Image Block */}
            {block.blockType === 'image' && block.mediaUrl && (
              <div className="overflow-hidden rounded-lg shadow-lg">
                <img
                  src={block.mediaUrl}
                  alt="Story image"
                  className="h-auto w-full object-cover"
                />
              </div>
            )}

            {/* Video Block */}
            {block.blockType === 'video' && block.mediaUrl && (
              <div className="overflow-hidden rounded-lg shadow-lg">
                <video
                  src={block.mediaUrl}
                  controls
                  className="h-auto w-full"
                />
              </div>
            )}

            {/* Quote Block */}
            {block.blockType === 'quote' && (
              <blockquote className="border-l-4 border-indigo-500 bg-indigo-50 px-6 py-4 italic text-gray-800">
                {block.textContent}
              </blockquote>
            )}

            {/* Reflection Block */}
            {block.blockType === 'reflection' && reflectionQuestions.length > 0 && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
                <h3 className="mb-4 text-xl font-semibold text-purple-900">
                  Reflection Questions
                </h3>
                <div className="space-y-4">
                  {reflectionQuestions.map((q) => (
                    <div key={q.id}>
                      <label className="mb-2 block text-sm font-medium text-purple-900">
                        {q.questionText}
                      </label>
                      <textarea
                        value={reflectionAnswers[q.id] || ''}
                        onChange={(e) =>
                          setReflectionAnswers({ ...reflectionAnswers, [q.id]: e.target.value })
                        }
                        className="w-full rounded-lg border border-purple-200 p-3 focus:border-purple-500 focus:outline-none"
                        rows={4}
                        placeholder="Share your thoughts..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Survey Block */}
            {block.blockType === 'survey' && surveyQuestions.length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h3 className="mb-4 text-xl font-semibold text-blue-900">
                  Survey Questions
                </h3>
                <div className="space-y-4">
                  {surveyQuestions.map((q) => (
                    <div key={q.id}>
                      <label className="mb-2 block text-sm font-medium text-blue-900">
                        {q.questionText}
                      </label>
                      {q.questionType === 'scale' && (
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={surveyAnswers[q.id] || 5}
                          onChange={(e) =>
                            setSurveyAnswers({ ...surveyAnswers, [q.id]: Number.parseInt(e.target.value) })
                          }
                          className="w-full"
                        />
                      )}
                      {q.questionType === 'multiple_choice' && q.options && (
                        <div className="space-y-2">
                          {q.options.map((option: string) => (
                            <label key={option} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={q.id}
                                value={option}
                                checked={surveyAnswers[q.id] === option}
                                onChange={(e) =>
                                  setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })
                                }
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      {(reflectionQuestions.length > 0 || surveyQuestions.length > 0) && (
        <div className="mt-12 text-center">
          <button
            onClick={handleSubmitReflection}
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {submitting ? 'Submitting...' : 'Submit Responses'}
          </button>
        </div>
      )}
    </div>
  );
}
