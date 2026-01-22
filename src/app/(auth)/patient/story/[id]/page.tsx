/**
 * Patient Story Page Viewer
 * Authenticated patient access to their published story pages
 * Beautiful, immersive design for therapeutic storytelling
 */

'use client';

import {
  ArrowLeft,
  CheckCircle2,
  Clapperboard,
  FileText,
  Heart,
  Loader2,
  MessageCircle,
  Quote,
  Send,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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
};

type Props = {
  params: Promise<{ id: string }>;
};

export default function PatientStoryPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>({});
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchPageData();
  }, [id]);

  const fetchPageData = async () => {
    try {
      const idToken = user ? await user.getIdToken() : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }

      const response = await fetch(`/api/pages/${id}?patientView=true`, {
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('notfound');
        } else if (response.status === 403) {
          setError('forbidden');
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
      const idToken = user ? await user.getIdToken() : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }

      const reflectionResponses = reflectionAnswers
        ? Object.entries(reflectionAnswers).map(([questionId, answer]) => ({
            questionId,
            responseText: answer,
          }))
        : [];

      const surveyResponses = surveyAnswers
        ? Object.entries(surveyAnswers).map(([questionId, answer]) => ({
            questionId,
            response: typeof answer === 'number' ? answer : answer,
          }))
        : [];

      const response = await fetch(`/api/pages/${id}/responses`, {
        method: 'POST',
        headers,
        credentials: 'include',
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error submitting responses:', err);
      alert('Failed to submit responses. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-purple-200 opacity-75" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
              <Heart className="h-8 w-8 animate-pulse text-purple-600" />
            </div>
          </div>
          <p className="mt-4 text-gray-600">Loading your story...</p>
        </div>
      </div>
    );
  }

  if (error === 'notfound') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Story Not Found</h1>
          <p className="mb-6 text-gray-600">
            This story page doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/patient/story')}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-medium text-white transition-all hover:bg-purple-700 hover:shadow-lg"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  if (error === 'forbidden') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
            <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mb-6 text-gray-600">
            You don't have permission to view this story page.
          </p>
          <button
            onClick={() => router.push('/patient/story')}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-medium text-white transition-all hover:bg-purple-700 hover:shadow-lg"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Error Loading Page</h1>
          <p className="mb-6 text-gray-600">
            Something went wrong. Please try again later.
          </p>
          <button
            onClick={() => router.push('/patient/story')}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-medium text-white transition-all hover:bg-purple-700 hover:shadow-lg"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Success Banner */}
      {submitSuccess && (
        <div className="sticky top-0 z-50 border-b border-green-200 bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-center gap-3 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="font-medium">
                Thank you! Your responses have been submitted successfully.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header - mobile optimized */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 px-4 py-10 sm:px-8 sm:py-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -left-4 h-24 w-24 rounded-full bg-white" />
          <div className="absolute top-10 right-20 h-16 w-16 rounded-full bg-white" />
          <div className="absolute bottom-8 left-1/3 h-20 w-20 rounded-full bg-white" />
          <div className="absolute -right-4 -bottom-4 h-32 w-32 rounded-full bg-white" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => router.push('/patient/story')}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30 sm:mb-8 sm:px-4 sm:py-2"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Stories
          </button>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs text-white backdrop-blur-sm sm:mb-4 sm:px-4 sm:py-2 sm:text-sm">
            <Sparkles className="h-4 w-4" />
            Your personal story
          </div>

          <h1 className="mb-3 text-2xl font-bold text-white sm:mb-4 sm:text-3xl md:text-4xl">
            {pageData.page.title}
          </h1>
          {pageData.page.description && (
            <p className="max-w-2xl text-base text-purple-100 sm:text-lg">
              {pageData.page.description}
            </p>
          )}
        </div>
      </div>

      {/* Content - mobile optimized */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="space-y-6 sm:space-y-8">
          {pageData.blocks.map((block, index) => {
            const blockQuestions = pageData.reflectionQuestions.filter(
              (q: any) => q.blockId === block.id,
            );
            const blockSurveyQuestions = pageData.surveyQuestions.filter(
              (q: any) => q.blockId === block.id,
            );

            return (
              <div
                key={block.id || index}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg"
              >
                {/* Text Block */}
                {block.blockType === 'text' && block.textContent && (
                  <div className="p-5 sm:p-8">
                    <div className="prose prose-base max-w-none sm:prose-lg">
                      <p className="leading-relaxed text-gray-700">{block.textContent}</p>
                    </div>
                  </div>
                )}

                {/* Image Block */}
                {block.blockType === 'image' && block.settings?.mediaUrl && (
                  <div className="overflow-hidden">
                    <img
                      src={block.settings.mediaUrl}
                      alt="Story content"
                      className="w-full"
                    />
                  </div>
                )}

                {/* Video Block */}
                {block.blockType === 'video' && block.settings?.mediaUrl && (
                  <div className="aspect-video overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
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

                {/* Quote Block */}
                {block.blockType === 'quote' && block.textContent && (
                  <div className="border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-white p-5 sm:p-8">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <Quote className="h-6 w-6 flex-shrink-0 text-purple-400 sm:h-8 sm:w-8" />
                      <blockquote className="text-lg text-gray-700 italic sm:text-xl">
                        "
                        {block.textContent}
                        "
                      </blockquote>
                    </div>
                  </div>
                )}

                {/* Scene Block */}
                {block.blockType === 'scene' && block.sceneId && (
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 sm:px-6 sm:py-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 sm:h-10 sm:w-10">
                        <Clapperboard className="h-4 w-4 text-purple-600 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-900 sm:text-base">
                          {block.settings?.sceneTitle || 'Your Scene'}
                        </p>
                        <p className="text-xs text-purple-600 sm:text-sm">Created just for you</p>
                      </div>
                    </div>
                    {(block.settings?.videoUrl || block.settings?.mediaUrl) && (
                      <div className="aspect-video overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
                        <video
                          src={block.settings.videoUrl || block.settings.mediaUrl}
                          controls
                          controlsList="nodownload"
                          preload="metadata"
                          className="h-full w-full"
                          playsInline
                          poster={block.settings?.thumbnailUrl}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                  </div>
                )}

                {/* Reflection Block */}
                {block.blockType === 'reflection' && blockQuestions.length > 0 && (
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 sm:px-6 sm:py-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 sm:h-10 sm:w-10">
                        <MessageCircle className="h-4 w-4 text-purple-600 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-900 sm:text-base">Reflection Time</p>
                        <p className="text-xs text-purple-600 sm:text-sm">Take a moment to share your thoughts</p>
                      </div>
                    </div>
                    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
                      {blockQuestions.map((q: any, i: number) => (
                        <div key={q.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
                          <p className="mb-3 font-medium text-gray-900">
                            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-sm text-purple-600">
                              {i + 1}
                            </span>
                            {q.questionText}
                            {q.required && <span className="ml-1 text-red-500">*</span>}
                          </p>
                          <textarea
                            value={reflectionAnswers[q.id] || ''}
                            onChange={e => setReflectionAnswers({ ...reflectionAnswers, [q.id]: e.target.value })}
                            placeholder="Share your thoughts here..."
                            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            rows={4}
                            disabled={submitSuccess}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Survey Block */}
                {block.blockType === 'survey' && blockSurveyQuestions.length > 0 && (
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 sm:px-6 sm:py-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 sm:h-10 sm:w-10">
                        <FileText className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-900 sm:text-base">Quick Survey</p>
                        <p className="text-xs text-green-600 sm:text-sm">Help us understand how you're feeling</p>
                      </div>
                    </div>
                    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
                      {blockSurveyQuestions.map((q: any, i: number) => (
                        <div key={q.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
                          <p className="mb-4 font-medium text-gray-900">
                            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-sm text-green-600">
                              {i + 1}
                            </span>
                            {q.questionText}
                            {q.required && <span className="ml-1 text-red-500">*</span>}
                          </p>

                          {/* Open Text */}
                          {q.questionType === 'open_text' && (
                            <textarea
                              value={surveyAnswers[q.id] as string || ''}
                              onChange={e => setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })}
                              placeholder="Type your answer here..."
                              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                              rows={3}
                              disabled={submitSuccess}
                            />
                          )}

                          {/* Scale/Rating - mobile optimized */}
                          {q.questionType === 'scale' && (
                            <div className="space-y-3 sm:space-y-4">
                              <div className="flex items-center justify-between text-xs text-gray-600 sm:text-sm">
                                <span className="rounded-full bg-gray-100 px-2 py-1 sm:px-3">{q.scaleMinLabel || `${q.scaleMin || 1}`}</span>
                                <span className="rounded-full bg-gray-100 px-2 py-1 sm:px-3">{q.scaleMaxLabel || `${q.scaleMax || 5}`}</span>
                              </div>

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
                                      className={`min-h-[48px] min-w-[48px] flex-1 rounded-xl border-2 py-3 text-center text-base font-semibold transition-all sm:min-h-0 sm:min-w-0 sm:py-4 sm:text-lg ${
                                        isSelected
                                          ? 'border-green-500 bg-green-500 text-white shadow-lg'
                                          : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                                      } ${submitSuccess ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                    >
                                      {value}
                                    </button>
                                  );
                                })}
                              </div>

                              {surveyAnswers[q.id] !== undefined && (
                                <div className="text-center">
                                  <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Selected:
                                    {' '}
                                    {surveyAnswers[q.id]}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Multiple Choice - mobile optimized */}
                          {q.questionType === 'multiple_choice' && q.options && (
                            <div className="space-y-2 sm:space-y-3">
                              {q.options.map((option: string, optIndex: number) => (
                                <label
                                  key={optIndex}
                                  className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all sm:gap-4 sm:p-4 ${
                                    surveyAnswers[q.id] === option
                                      ? 'border-green-500 bg-green-50'
                                      : 'border-gray-200 bg-white hover:border-green-300'
                                  } ${submitSuccess ? 'cursor-not-allowed opacity-50' : ''}`}
                                >
                                  <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 sm:h-6 sm:w-6 ${
                                    surveyAnswers[q.id] === option
                                      ? 'border-green-500 bg-green-500'
                                      : 'border-gray-300'
                                  }`}
                                  >
                                    {surveyAnswers[q.id] === option && (
                                      <CheckCircle2 className="h-3 w-3 text-white sm:h-4 sm:w-4" />
                                    )}
                                  </div>
                                  <input
                                    type="radio"
                                    name={`question-${q.id}`}
                                    value={option}
                                    checked={surveyAnswers[q.id] === option}
                                    onChange={e => setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })}
                                    disabled={submitSuccess}
                                    className="sr-only"
                                  />
                                  <span className="text-sm font-medium text-gray-700 sm:text-base">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {/* Emotion Picker - mobile optimized */}
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
                                  className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 transition-all sm:min-h-0 sm:gap-2 sm:p-4 ${
                                    surveyAnswers[q.id] === emotion.value
                                      ? 'border-green-500 bg-green-50 shadow-lg'
                                      : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                                  } ${submitSuccess ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                >
                                  <span className="text-2xl sm:text-4xl">{emotion.emoji}</span>
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
          <div className="mt-8 sm:mt-12 sm:flex sm:justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-base font-medium text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:gap-3 sm:px-10 sm:text-lg"
              type="button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit My Responses
                </>
              )}
            </button>
          </div>
        )}

        {/* Success Message - mobile optimized */}
        {submitSuccess && (
          <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center text-white shadow-xl sm:mt-12 sm:p-8">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 sm:mb-4 sm:h-16 sm:w-16">
              <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <h3 className="mb-2 text-xl font-bold sm:text-2xl">Responses Submitted!</h3>
            <p className="text-sm text-green-100 sm:text-base">
              Thank you for sharing your thoughts. Your therapist will review your responses.
            </p>
            <button
              onClick={() => router.push('/patient/story')}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-green-600 transition-all hover:bg-green-50 sm:mt-6 sm:w-auto"
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Stories
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
