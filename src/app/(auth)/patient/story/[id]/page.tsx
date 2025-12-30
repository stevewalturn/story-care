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

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 px-8 py-16">
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
            className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Stories
          </button>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Your personal story
          </div>

          <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            {pageData.page.title}
          </h1>
          {pageData.page.description && (
            <p className="max-w-2xl text-lg text-purple-100">
              {pageData.page.description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
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
                  <div className="p-8">
                    <div className="prose prose-lg max-w-none">
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
                  <div className="border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-white p-8">
                    <div className="flex items-start gap-4">
                      <Quote className="h-8 w-8 flex-shrink-0 text-purple-400" />
                      <blockquote className="text-xl text-gray-700 italic">
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
                    <div className="flex items-center gap-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                        <Clapperboard className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900">
                          {block.settings?.sceneTitle || 'Your Scene'}
                        </p>
                        <p className="text-sm text-purple-600">Created just for you</p>
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
                    <div className="flex items-center gap-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                        <MessageCircle className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900">Reflection Time</p>
                        <p className="text-sm text-purple-600">Take a moment to share your thoughts</p>
                      </div>
                    </div>
                    <div className="space-y-6 p-6">
                      {blockQuestions.map((q: any, i: number) => (
                        <div key={q.id} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
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
                    <div className="flex items-center gap-3 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-900">Quick Survey</p>
                        <p className="text-sm text-green-600">Help us understand how you're feeling</p>
                      </div>
                    </div>
                    <div className="space-y-6 p-6">
                      {blockSurveyQuestions.map((q: any, i: number) => (
                        <div key={q.id} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
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

                          {/* Scale/Rating */}
                          {q.questionType === 'scale' && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span className="rounded-full bg-gray-100 px-3 py-1">{q.scaleMinLabel || `${q.scaleMin || 1}`}</span>
                                <span className="rounded-full bg-gray-100 px-3 py-1">{q.scaleMaxLabel || `${q.scaleMax || 5}`}</span>
                              </div>

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
                                      className={`flex-1 rounded-xl border-2 py-4 text-center text-lg font-semibold transition-all ${
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

                          {/* Multiple Choice */}
                          {q.questionType === 'multiple_choice' && q.options && (
                            <div className="space-y-3">
                              {q.options.map((option: string, optIndex: number) => (
                                <label
                                  key={optIndex}
                                  className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                                    surveyAnswers[q.id] === option
                                      ? 'border-green-500 bg-green-50'
                                      : 'border-gray-200 bg-white hover:border-green-300'
                                  } ${submitSuccess ? 'cursor-not-allowed opacity-50' : ''}`}
                                >
                                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                                    surveyAnswers[q.id] === option
                                      ? 'border-green-500 bg-green-500'
                                      : 'border-gray-300'
                                  }`}
                                  >
                                    {surveyAnswers[q.id] === option && (
                                      <CheckCircle2 className="h-4 w-4 text-white" />
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
                                  <span className="font-medium text-gray-700">{option}</span>
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
                                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                                    surveyAnswers[q.id] === emotion.value
                                      ? 'border-green-500 bg-green-50 shadow-lg'
                                      : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                                  } ${submitSuccess ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                >
                                  <span className="text-4xl">{emotion.emoji}</span>
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
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-4 text-lg font-medium text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* Success Message */}
        {submitSuccess && (
          <div className="mt-12 overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center text-white shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-2xl font-bold">Responses Submitted!</h3>
            <p className="text-green-100">
              Thank you for sharing your thoughts. Your therapist will review your responses.
            </p>
            <button
              onClick={() => router.push('/patient/story')}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-green-600 transition-all hover:bg-green-50"
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
