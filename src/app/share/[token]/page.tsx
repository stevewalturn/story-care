/**
 * Public Share Page - Time-Limited Story Page Access
 * No authentication required - validates token and expiry
 */

'use client';

import { Clapperboard, FileText, MessageCircle } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
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
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-100/80 px-3 py-1.5 backdrop-blur-sm sm:mb-4 sm:px-4 sm:py-2">
            <span className="text-xs font-medium text-purple-700 sm:text-sm">
              Personalized for
              {' '}
              {pageData.page.patientName}
            </span>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:mb-3 sm:text-3xl md:text-4xl">{pageData.page.title}</h1>
          {pageData.page.description && (
            <p className="text-base text-gray-600 sm:text-lg">{pageData.page.description}</p>
          )}
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
              <div key={block.id || index} className="rounded-xl border border-gray-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-6">
                {block.blockType === 'text' && block.textContent && (
                  <div className="prose prose-lg max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {block.textContent}
                    </ReactMarkdown>
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
                  <div className="overflow-hidden rounded-xl">
                    <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800">
                      <video
                        src={block.settings.mediaUrl}
                        controls
                        controlsList="nodownload"
                        preload="metadata"
                        className="h-full w-full"
                        playsInline
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}

                {block.blockType === 'quote' && block.textContent && (
                  <blockquote className="border-l-4 border-purple-500 pl-4">
                    <div className="prose prose-lg max-w-none text-gray-700 italic">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {block.textContent}
                      </ReactMarkdown>
                    </div>
                  </blockquote>
                )}

                {block.blockType === 'scene' && block.sceneId && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    {/* Header with icon */}
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                        <Clapperboard className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {block.settings?.sceneTitle || 'Your Scene'}
                      </span>
                    </div>
                    {/* Video container */}
                    {block.settings?.mediaUrl && (
                      <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800">
                        <video
                          src={block.settings.mediaUrl}
                          controls
                          controlsList="nodownload"
                          preload="metadata"
                          className="h-full w-full"
                          playsInline
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                  </div>
                )}

                {block.blockType === 'reflection' && blockQuestions.length > 0 && (
                  <div className="rounded-xl border border-purple-200/60 bg-purple-50/50 p-4 sm:p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-purple-600" />
                      <p className="font-medium text-purple-900">Reflection Questions</p>
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
                            className="h-20 w-full resize-none rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            disabled={submitSuccess}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {block.blockType === 'survey' && blockSurveyQuestions.length > 0 && (
                  <div className="rounded-xl border border-green-200/60 bg-green-50/50 p-4 sm:p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <p className="font-medium text-green-900">Survey Questions</p>
                    </div>
                    <div className="space-y-6">
                      {blockSurveyQuestions.map((q: any, i: number) => (
                        <div key={q.id} className="rounded-lg bg-white p-3 sm:p-4">
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

                              {/* Interactive scale buttons - mobile friendly with wrap */}
                              <div className="flex flex-wrap justify-center gap-2 sm:flex-nowrap sm:justify-start">
                                {Array.from({ length: (q.scaleMax || 5) - (q.scaleMin || 1) + 1 }, (_, index) => {
                                  const value = (q.scaleMin || 1) + index;
                                  const isSelected = surveyAnswers[q.id] === value;
                                  return (
                                    <button
                                      key={value}
                                      type="button"
                                      onClick={() => setSurveyAnswers({ ...surveyAnswers, [q.id]: value })}
                                      disabled={submitSuccess}
                                      className={`min-h-[48px] min-w-[48px] flex-1 rounded-lg border-2 py-3 text-center text-lg font-semibold transition-all sm:min-h-0 sm:min-w-0 ${
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

                          {/* Multiple Choice - mobile optimized with larger tap targets */}
                          {q.questionType === 'multiple_choice' && q.options && (
                            <div className="space-y-2">
                              {q.options.map((option: string, optIndex: number) => (
                                <label
                                  key={optIndex}
                                  className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-3 transition-all sm:px-4 ${
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
                                    className="h-5 w-5 text-green-600 focus:ring-green-500"
                                  />
                                  <span className="text-sm text-gray-700 sm:text-base">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {/* Emotion Picker - mobile optimized with larger touch targets */}
                          {q.questionType === 'emotion' && (
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
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
                                  className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 transition-all sm:min-h-0 sm:gap-2 sm:p-3 ${
                                    surveyAnswers[q.id] === emotion.value
                                      ? 'border-green-600 bg-green-50'
                                      : 'border-gray-300 bg-white hover:border-green-400 hover:bg-green-50'
                                  } ${submitSuccess ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                >
                                  <span className="text-2xl sm:text-3xl">{emotion.emoji}</span>
                                  <span className="text-[10px] font-medium leading-tight text-gray-600 sm:text-xs">{emotion.label}</span>
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

        {/* Submit Button - full width on mobile */}
        {(pageData.reflectionQuestions.length > 0 || pageData.surveyQuestions.length > 0) && !submitSuccess && (
          <div className="mt-8 sm:mt-10 sm:flex sm:justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-base font-medium text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10"
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
