/**
 * Public Share Page - Time-Limited Story Page Access
 * No authentication required - validates token and expiry
 */

'use client';

import { Clapperboard, FileText, MessageCircle, Video } from 'lucide-react';
import { use, useEffect, useState } from 'react';

type PageData = {
  page: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    patientName: string;
  };
  blocks: any[];
  reflectionQuestions: any[];
  surveyQuestions: any[];
  shareLink: {
    expiresAt: string;
    expiryDurationMinutes: number;
  };
};

type Props = {
  params: Promise<{ token: string }>;
};

export default function PublicSharePage({ params }: Props) {
  const { token } = use(params);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>({});
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchPageData();
  }, [token]);

  const fetchPageData = async () => {
    try {
      const response = await fetch(`/api/share/${token}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('invalid');
        } else if (response.status === 410) {
          setError('expired');
        } else {
          setError('error');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setPageData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching page:', err);
      setError('error');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!pageData) return;

    setIsSubmitting(true);

    try {
      // Prepare reflection responses with null check
      const reflectionResponses = reflectionAnswers
        ? Object.entries(reflectionAnswers).map(([questionId, answer]) => ({
            questionId,
            responseText: answer,
          }))
        : [];

      // Prepare survey responses with null check
      const surveyResponses = surveyAnswers
        ? Object.entries(surveyAnswers).map(([questionId, answer]) => ({
            questionId,
            response: typeof answer === 'number' ? answer : answer,
          }))
        : [];

      const response = await fetch(`/api/share/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reflectionResponses,
          surveyResponses,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit responses');
      }

      setSubmitSuccess(true);
      setIsSubmitting(false);

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error submitting responses:', err);
      alert('Failed to submit responses. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
            <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Invalid Link</h1>
          <p className="text-gray-600">
            This link is not valid or has been revoked.
          </p>
        </div>
      </div>
    );
  }

  if (error === 'expired') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-50">
            <svg className="h-12 w-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Link Expired</h1>
          <p className="text-gray-600">
            This link has expired and is no longer available.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Please contact your therapist for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-50">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Error Loading Page</h1>
          <p className="text-gray-600">
            Something went wrong. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return null;
  }

  // Calculate time remaining
  const now = new Date();
  const expiresAt = new Date(pageData.shareLink.expiresAt);
  const timeRemaining = expiresAt.getTime() - now.getTime();
  const minutesRemaining = Math.floor(timeRemaining / 60000);
  const hoursRemaining = Math.floor(minutesRemaining / 60);

  let expiryText = '';
  if (hoursRemaining > 0) {
    expiryText = `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}`;
  } else {
    expiryText = `${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Banner */}
      {submitSuccess && (
        <div className="border-b border-green-200 bg-green-50 px-4 py-3">
          <div className="mx-auto max-w-4xl">
            <p className="flex items-center justify-center gap-2 text-sm text-green-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Thank you! Your responses have been submitted successfully.
            </p>
          </div>
        </div>
      )}

      {/* Expiry Banner */}
      {!submitSuccess && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2">
          <div className="mx-auto max-w-4xl">
            <p className="flex items-center justify-center gap-2 text-sm text-amber-800">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              This link will expire in
              {' '}
              {expiryText}
            </p>
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">{pageData.page.title}</h1>
          {pageData.page.description && (
            <p className="text-gray-600">{pageData.page.description}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            For:
            {pageData.page.patientName}
          </p>
        </div>

        {/* Blocks */}
        <div className="space-y-6">
          {pageData.blocks.map((block, index) => {
            const blockQuestions = pageData.reflectionQuestions.filter(
              (q: any) => q.blockId === block.id,
            );
            const blockSurveyQuestions = pageData.surveyQuestions.filter(
              (q: any) => q.blockId === block.id,
            );

            return (
              <div key={block.id || index} className="rounded-lg bg-white p-6 shadow-sm">
                {block.blockType === 'text' && block.textContent && (
                  <div className="prose max-w-none">
                    <p className="leading-relaxed text-gray-700">{block.textContent}</p>
                  </div>
                )}

                {block.blockType === 'image' && block.settings?.mediaUrl && (
                  <img
                    src={block.settings.mediaUrl}
                    alt="Content"
                    className="w-full rounded-lg"
                  />
                )}

                {block.blockType === 'video' && block.settings?.mediaUrl && (
                  <div className="aspect-video overflow-hidden rounded-lg bg-gray-900">
                    <video src={block.settings.mediaUrl} controls className="h-full w-full">
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {block.blockType === 'quote' && block.textContent && (
                  <blockquote className="border-l-4 border-indigo-500 pl-4 text-gray-700 italic">
                    "
                    {block.textContent}
                    "
                  </blockquote>
                )}

                {block.blockType === 'scene' && block.sceneId && (
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Clapperboard className="h-5 w-5 text-purple-600" />
                      <p className="font-medium text-purple-900">{block.settings?.sceneTitle || 'Scene'}</p>
                    </div>
                    {block.settings?.mediaUrl && (
                      <div className="aspect-video overflow-hidden rounded-lg bg-gray-900">
                        <Video className="h-full w-full text-white opacity-50" />
                      </div>
                    )}
                  </div>
                )}

                {block.blockType === 'reflection' && blockQuestions.length > 0 && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-indigo-600" />
                      <p className="font-medium text-indigo-900">Reflection Questions</p>
                    </div>
                    <div className="space-y-4">
                      {blockQuestions.map((q: any, i: number) => (
                        <div key={q.id}>
                          <p className="mb-2 text-sm font-medium text-gray-700">
                            {i + 1}
                            .
                            {' '}
                            {q.questionText}
                            {q.required && <span className="ml-1 text-red-500">*</span>}
                          </p>
                          <textarea
                            value={reflectionAnswers[q.id] || ''}
                            onChange={e => setReflectionAnswers({ ...reflectionAnswers, [q.id]: e.target.value })}
                            placeholder="Your response..."
                            className="h-20 w-full resize-none rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            disabled={submitSuccess}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {block.blockType === 'survey' && blockSurveyQuestions.length > 0 && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <p className="font-medium text-green-900">Survey Questions</p>
                    </div>
                    <div className="space-y-6">
                      {blockSurveyQuestions.map((q: any, i: number) => (
                        <div key={q.id} className="rounded-lg bg-white p-4">
                          <p className="mb-3 text-sm font-medium text-gray-900">
                            {i + 1}
                            .
                            {' '}
                            {q.questionText}
                            {q.required && <span className="ml-1 text-red-500">*</span>}
                          </p>

                          {/* Open Text */}
                          {q.questionType === 'open_text' && (
                            <textarea
                              value={surveyAnswers[q.id] as string || ''}
                              onChange={e => setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })}
                              placeholder="Type your answer here..."
                              className="h-20 w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
                              disabled={submitSuccess}
                            />
                          )}

                          {/* Scale/Rating */}
                          {q.questionType === 'scale' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                                <span>{q.scaleMinLabel || `${q.scaleMin || 1} (Low)`}</span>
                                <span>{q.scaleMaxLabel || `${q.scaleMax || 5} (High)`}</span>
                              </div>

                              {/* Interactive scale buttons */}
                              <div className="flex gap-2">
                                {Array.from({ length: (q.scaleMax || 5) - (q.scaleMin || 1) + 1 }, (_, index) => {
                                  const value = (q.scaleMin || 1) + index;
                                  const isSelected = surveyAnswers[q.id] === value;
                                  return (
                                    <button
                                      key={value}
                                      type="button"
                                      onClick={() => setSurveyAnswers({ ...surveyAnswers, [q.id]: value })}
                                      disabled={submitSuccess}
                                      className={`flex-1 rounded-lg border-2 py-3 text-center text-lg font-semibold transition-all ${
                                        isSelected
                                          ? 'border-green-600 bg-green-600 text-white shadow-lg'
                                          : 'border-gray-300 bg-white text-gray-700 hover:border-green-400 hover:bg-green-50'
                                      } ${submitSuccess ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                    >
                                      {value}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Show selected value with label */}
                              {surveyAnswers[q.id] && (
                                <div className="mt-2 text-center">
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-800">
                                    Selected:
                                    {' '}
                                    {surveyAnswers[q.id]}
                                    {' '}
                                    {surveyAnswers[q.id] === (q.scaleMin || 1) && q.scaleMinLabel ? `- ${q.scaleMinLabel}` : ''}
                                    {surveyAnswers[q.id] === (q.scaleMax || 5) && q.scaleMaxLabel ? `- ${q.scaleMaxLabel}` : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Multiple Choice */}
                          {q.questionType === 'multiple_choice' && q.options && (
                            <div className="space-y-2">
                              {q.options.map((option: string, optIndex: number) => (
                                <label
                                  key={optIndex}
                                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                                    surveyAnswers[q.id] === option
                                      ? 'border-green-600 bg-green-50'
                                      : 'border-gray-300 bg-white hover:border-green-400'
                                  } ${submitSuccess ? 'cursor-not-allowed opacity-50' : ''}`}
                                >
                                  <input
                                    type="radio"
                                    name={`question-${q.id}`}
                                    value={option}
                                    checked={surveyAnswers[q.id] === option}
                                    onChange={e => setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })}
                                    disabled={submitSuccess}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                                  />
                                  <span className="text-sm text-gray-700">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {/* Emotion Picker */}
                          {q.questionType === 'emotion' && (
                            <div className="grid grid-cols-5 gap-3">
                              {[
                                { emoji: '😢', label: 'Very Sad', value: 1 },
                                { emoji: '😕', label: 'Sad', value: 2 },
                                { emoji: '😐', label: 'Neutral', value: 3 },
                                { emoji: '🙂', label: 'Happy', value: 4 },
                                { emoji: '😄', label: 'Very Happy', value: 5 },
                              ].map(emotion => (
                                <button
                                  key={emotion.value}
                                  type="button"
                                  onClick={() => setSurveyAnswers({ ...surveyAnswers, [q.id]: emotion.value })}
                                  disabled={submitSuccess}
                                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                                    surveyAnswers[q.id] === emotion.value
                                      ? 'border-green-600 bg-green-50'
                                      : 'border-gray-300 bg-white hover:border-green-400 hover:bg-green-50'
                                  } ${submitSuccess ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                >
                                  <span className="text-3xl">{emotion.emoji}</span>
                                  <span className="text-xs font-medium text-gray-600">{emotion.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        {(pageData.reflectionQuestions.length > 0 || pageData.surveyQuestions.length > 0) && !submitSuccess && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-8 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Responses'
              )}
            </button>
          </div>
        )}

        {submitSuccess && (
          <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
            <svg className="mx-auto mb-3 h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mb-2 text-lg font-semibold text-green-900">Responses Submitted!</h3>
            <p className="text-sm text-green-700">
              Thank you for sharing your thoughts. Your therapist will review your responses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
