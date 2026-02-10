/**
 * Patient Story Page Viewer
 * Authenticated patient access to their published story pages
 * Modern, human-crafted design with editorial feel
 */

'use client';

import {
  ArrowLeft,
  CheckCircle2,
  Clapperboard,
  FileText,
  Heart,
  Loader2,
  Music,
  Send,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { HTMLContent } from '@/components/ui/HTMLContent';
import { useAuth } from '@/contexts/AuthContext';
import { markdownToHTML } from '@/utils/MarkdownToHTML';

/**
 * Helper function to detect if content is likely HTML
 */
function isLikelyHTML(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

/**
 * Render content - if it's HTML, use as-is; if it's markdown, convert to HTML
 */
function renderContent(content: string): string {
  if (!content) return '';
  return isLikelyHTML(content) ? content : markdownToHTML(content);
}

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-purple-50/30 to-white">
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-purple-200 opacity-75" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
              <Heart className="h-8 w-8 animate-pulse text-purple-500" />
            </div>
          </div>
          <p className="mt-4 text-gray-600">Loading your story...</p>
        </div>
      </div>
    );
  }

  if (error === 'notfound') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-purple-50/30 to-white px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-800">Story Not Found</h1>
          <p className="mb-6 leading-relaxed text-gray-600">
            This story page doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/patient/story')}
            className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-medium text-white transition-all hover:bg-purple-700 hover:shadow-lg active:scale-95"
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-purple-50/30 to-white px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
            <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-800">Access Denied</h1>
          <p className="mb-6 leading-relaxed text-gray-600">
            You don't have permission to view this story page.
          </p>
          <button
            onClick={() => router.push('/patient/story')}
            className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-medium text-white transition-all hover:bg-purple-700 hover:shadow-lg active:scale-95"
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-purple-50/30 to-white px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-800">Error Loading Page</h1>
          <p className="mb-6 leading-relaxed text-gray-600">
            Something went wrong. Please try again later.
          </p>
          <button
            onClick={() => router.push('/patient/story')}
            className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-medium text-white transition-all hover:bg-purple-700 hover:shadow-lg active:scale-95"
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
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/20 to-white">
      {/* Success Banner */}
      {submitSuccess && (
        <div className="sticky top-0 z-50 border-b border-green-200 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-4">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-center gap-3 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">
                Thank you! Your responses have been submitted.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 px-4 py-10 sm:px-8 sm:py-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -left-4 h-24 w-24 rounded-full bg-white" />
          <div className="absolute top-10 right-20 h-16 w-16 rounded-full bg-white" />
          <div className="absolute bottom-8 left-1/3 h-20 w-20 rounded-full bg-white" />
          <div className="absolute -right-4 -bottom-4 h-32 w-32 rounded-full bg-white" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          {/* Back Button */}
          <button
            onClick={() => router.push('/patient/story')}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95 sm:mb-8"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Stories
          </button>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Your personal story
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {pageData.page.title}
          </h1>
          {pageData.page.description && (
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-purple-100 sm:text-xl">
              {pageData.page.description}
            </p>
          )}
        </div>
      </header>

      {/* Content Blocks - No wrapper boxes */}
      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {pageData.blocks.map((block, index) => {
          const blockQuestions = pageData.reflectionQuestions.filter(
            (q: any) => q.blockId === block.id,
          );
          const blockSurveyQuestions = pageData.surveyQuestions.filter(
            (q: any) => q.blockId === block.id,
          );

          return (
            <div key={block.id || index}>
              {/* Text Block - Editorial Feel */}
              {block.blockType === 'text' && block.textContent && (
                <article className="py-8 sm:py-12">
                  <HTMLContent
                    html={renderContent(block.textContent)}
                    className="prose prose-lg max-w-none leading-relaxed text-gray-700 sm:prose-xl"
                  />
                </article>
              )}

              {/* Image Block - Gallery Quality */}
              {block.blockType === 'image' && block.settings?.mediaUrl && (
                <figure className="-mx-4 my-10 sm:mx-0 sm:my-14">
                  <div className="overflow-hidden sm:rounded-2xl">
                    <img
                      src={block.settings.mediaUrl}
                      alt="Story moment"
                      className="w-full transition-transform duration-700 hover:scale-[1.02]"
                    />
                  </div>
                  {block.settings?.caption && (
                    <figcaption className="mt-4 px-4 text-center text-sm text-gray-500 italic sm:px-0">
                      {block.settings.caption}
                    </figcaption>
                  )}
                </figure>
              )}

              {/* Video Block - Cinematic */}
              {block.blockType === 'video' && block.settings?.mediaUrl && (
                <div className="-mx-4 my-10 sm:mx-0 sm:my-14">
                  <div className="aspect-video overflow-hidden bg-gray-950 shadow-2xl sm:rounded-2xl">
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

              {/* Audio Block - Clean & Accessible */}
              {block.blockType === 'audio' && block.settings?.mediaUrl && (
                <div className="my-6 sm:my-8">
                  <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                    <div className="mb-4 flex items-center gap-2 text-green-700">
                      <Music className="h-5 w-5" />
                      <span className="text-sm font-medium">{block.settings?.title || 'Audio'}</span>
                    </div>
                    <audio
                      src={block.settings.mediaUrl}
                      controls
                      controlsList="nodownload"
                      preload="metadata"
                      className="w-full"
                    >
                      Your browser does not support the audio tag.
                    </audio>
                    {block.textContent && (
                      <div className="mt-4 text-sm leading-relaxed text-gray-600">
                        <HTMLContent html={renderContent(block.textContent)} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quote Block - Striking & Personal */}
              {block.blockType === 'quote' && block.textContent && (
                <blockquote className="relative my-12 py-8 sm:my-16">
                  <div className="absolute top-0 bottom-0 left-0 w-1 rounded-full bg-gradient-to-b from-purple-400 to-purple-600" />
                  <div className="pl-8 sm:pl-12">
                    <div className="text-2xl leading-relaxed font-light text-gray-800 sm:text-3xl [&_p:first-of-type]:before:content-['\201C'] [&_p:last-of-type]:after:content-['\201D']">
                      <HTMLContent html={renderContent(block.textContent)} />
                    </div>
                    {block.settings?.speakerName && (
                      <footer className="mt-6 text-sm font-medium text-gray-500">
                        —
                        {' '}
                        {block.settings.speakerName}
                      </footer>
                    )}
                  </div>
                </blockquote>
              )}

              {/* Note Block - Warm amber styling */}
              {block.blockType === 'note' && block.textContent && (
                <div className="my-10 sm:my-14">
                  <div className="flex items-start gap-4 rounded-2xl bg-amber-50 p-6">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                      <StickyNote className="h-5 w-5 text-amber-600" />
                    </div>
                    <HTMLContent
                      html={renderContent(block.textContent)}
                      className="prose prose-base max-w-none leading-relaxed text-gray-700 sm:prose-lg"
                    />
                  </div>
                </div>
              )}

              {/* Scene Block - Theatrical */}
              {block.blockType === 'scene' && block.sceneId && (
                <div className="-mx-4 my-12 sm:mx-0 sm:my-16">
                  {/* Title card */}
                  <div className="mb-4 flex items-center gap-4 px-4 sm:px-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
                      <Clapperboard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {block.settings?.sceneTitle || 'Your Scene'}
                      </h3>
                      <p className="text-sm text-purple-600">Created just for you</p>
                    </div>
                  </div>
                  {/* Video */}
                  {(block.settings?.videoUrl || block.settings?.mediaUrl) && (
                    <div className="aspect-video overflow-hidden bg-gray-950 shadow-2xl sm:rounded-2xl">
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

              {/* Reflection Block - Intimate & Inviting */}
              {block.blockType === 'reflection' && blockQuestions.length > 0 && (
                <section className="my-12 sm:my-16">
                  {/* Warm intro */}
                  <div className="mb-8 flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-100">
                      <Heart className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">A moment to reflect</h3>
                      <p className="mt-1 text-gray-600">Take your time. There's no right or wrong answer.</p>
                    </div>
                  </div>
                  {/* Questions - journal-like */}
                  <div className="space-y-8">
                    {blockQuestions.map((q: any) => (
                      <div key={q.id} className="group">
                        <label className="mb-3 block text-lg font-medium text-gray-800">
                          {q.questionText}
                          {q.required && <span className="ml-1 text-red-500">*</span>}
                        </label>
                        <textarea
                          value={reflectionAnswers[q.id] || ''}
                          onChange={e => setReflectionAnswers({ ...reflectionAnswers, [q.id]: e.target.value })}
                          placeholder="Share your thoughts here..."
                          className="min-h-[140px] w-full rounded-2xl border-2 border-gray-100 bg-white px-5 py-4 text-lg leading-relaxed text-gray-700 transition-all duration-200 placeholder:text-gray-400 focus:border-purple-300 focus:ring-4 focus:ring-purple-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          rows={5}
                          disabled={submitSuccess}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Survey Block - Friendly Check-In */}
              {block.blockType === 'survey' && blockSurveyQuestions.length > 0 && (
                <section className="my-12 sm:my-16">
                  {/* Friendly header */}
                  <div className="mb-8 flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
                      <Sparkles className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Quick check-in</h3>
                      <p className="mt-1 text-gray-600">How are you feeling about what you've seen?</p>
                    </div>
                  </div>
                  <div className="space-y-10">
                    {blockSurveyQuestions.map((q: any) => (
                      <div key={q.id}>
                        <p className="mb-5 text-lg font-medium text-gray-800">
                          {q.questionText}
                          {q.required && <span className="ml-1 text-red-500">*</span>}
                        </p>

                        {/* Open Text */}
                        {q.questionType === 'open_text' && (
                          <textarea
                            value={surveyAnswers[q.id] as string || ''}
                            onChange={e => setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })}
                            placeholder="Type your answer here..."
                            className="min-h-[120px] w-full rounded-2xl border-2 border-gray-100 bg-white px-5 py-4 text-lg leading-relaxed text-gray-700 transition-all duration-200 placeholder:text-gray-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            rows={4}
                            disabled={submitSuccess}
                          />
                        )}

                        {/* Scale - pill buttons */}
                        {q.questionType === 'scale' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{q.scaleMinLabel || `${q.scaleMin || 1}`}</span>
                              <span>{q.scaleMaxLabel || `${q.scaleMax || 5}`}</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {Array.from({ length: (q.scaleMax || 5) - (q.scaleMin || 1) + 1 }, (_, index) => {
                                const value = (q.scaleMin || 1) + index;
                                const isSelected = surveyAnswers[q.id] === value;
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => setSurveyAnswers({ ...surveyAnswers, [q.id]: value })}
                                    disabled={submitSuccess}
                                    className={`h-14 w-14 rounded-2xl text-lg font-semibold transition-all duration-200 ${
                                      isSelected
                                        ? 'scale-110 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                        : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                    } ${submitSuccess ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                  >
                                    {value}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Multiple Choice - clean pills */}
                        {q.questionType === 'multiple_choice' && q.options && (
                          <div className="space-y-3">
                            {q.options.map((option: string, optIndex: number) => (
                              <button
                                key={optIndex}
                                type="button"
                                onClick={() => setSurveyAnswers({ ...surveyAnswers, [q.id]: option })}
                                disabled={submitSuccess}
                                className={`w-full rounded-2xl px-5 py-4 text-left font-medium transition-all duration-200 ${
                                  surveyAnswers[q.id] === option
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-50 text-gray-700 hover:bg-emerald-50'
                                } ${submitSuccess ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Emotion - large friendly emojis */}
                        {q.questionType === 'emotion' && (
                          <div className="flex gap-2 sm:gap-4">
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
                                className={`flex flex-1 flex-col items-center rounded-2xl py-4 transition-all duration-200 ${
                                  surveyAnswers[q.id] === emotion.value
                                    ? 'scale-105 bg-emerald-50 ring-2 ring-emerald-400'
                                    : 'bg-gray-50 hover:bg-gray-100'
                                } ${submitSuccess ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              >
                                <span className="text-3xl sm:text-4xl">{emotion.emoji}</span>
                                <span className="mt-1 text-xs text-gray-500">{emotion.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          );
        })}

        {/* Submit Button - Sticky on mobile for keyboard visibility */}
        {(pageData.reflectionQuestions.length > 0 || pageData.surveyQuestions.length > 0) && !submitSuccess && (
          <div className="mt-16 pb-6 md:mb-20 md:pb-0">
            <div className="pb-safe sticky bottom-0 -mx-4 bg-gradient-to-t from-white via-white to-transparent px-4 pt-4 md:static md:mx-0 md:bg-transparent md:p-0">
              <div className="flex justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full max-w-md rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-purple-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-purple-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                  type="button"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      Submit My Responses
                      <Send className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="mt-12 mb-20 rounded-3xl bg-gradient-to-r from-emerald-50 to-green-50 p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-800">Responses Submitted!</h3>
            <p className="mb-6 text-gray-600">
              Thank you for sharing your thoughts. Your therapist will review your responses.
            </p>
            <button
              onClick={() => router.push('/patient/story')}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-medium text-white transition-all hover:bg-emerald-700 active:scale-95"
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Stories
            </button>
          </div>
        )}
      </main>

    </div>
  );
}
