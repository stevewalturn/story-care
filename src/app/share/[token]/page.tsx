/**
 * Public Share Page - Time-Limited Story Page Access
 * No authentication required - validates token and expiry
 * Modern, human-crafted design with editorial feel
 */

'use client';

import { Heart, Send, Sparkles } from 'lucide-react';
import { use, useEffect, useRef, useState } from 'react';
import { HTMLContent } from '@/components/ui/HTMLContent';
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
    backgroundMusicUrl?: string | null;
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

  // Background music state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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

  if (error === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-purple-50/30 to-white px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
            <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-800">Invalid Link</h1>
          <p className="leading-relaxed text-gray-600">
            This link is not valid or has been revoked.
          </p>
        </div>
      </div>
    );
  }

  if (error === 'expired') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-purple-50/30 to-white px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-50">
            <svg className="h-12 w-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-800">Link Expired</h1>
          <p className="leading-relaxed text-gray-600">
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-purple-50/30 to-white px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-800">Error Loading Page</h1>
          <p className="leading-relaxed text-gray-600">
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
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/20 to-white">
      {/* Success Banner */}
      {submitSuccess && (
        <div className="border-b border-green-200 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-4">
          <div className="mx-auto max-w-2xl">
            <p className="flex items-center justify-center gap-3 text-green-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Thank you! Your responses have been submitted.</span>
            </p>
          </div>
        </div>
      )}

      {/* Expiry Banner */}
      {!submitSuccess && (
        <div className="border-b border-amber-100 bg-amber-50/80 px-4 py-2">
          <div className="mx-auto max-w-2xl">
            <p className="flex items-center justify-center gap-2 text-sm text-amber-700">
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

      {/* Page Header */}
      <header className="px-4 pt-10 pb-8 sm:pt-16 sm:pb-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100/80 px-4 py-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">
              Personalized for
              {' '}
              {pageData.page.patientName}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl md:text-5xl">
            {pageData.page.title}
          </h1>
          {pageData.page.description && (
            <p className="mt-4 text-lg leading-relaxed text-gray-600 sm:text-xl">
              {pageData.page.description}
            </p>
          )}
        </div>
      </header>

      {/* Content Blocks - No wrapper boxes */}
      <main className="mx-auto max-w-2xl px-4">
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

              {/* Quote Block - Striking & Personal */}
              {block.blockType === 'quote' && block.textContent && (
                <blockquote className="relative my-12 py-8 sm:my-16">
                  <div className="absolute top-0 bottom-0 left-0 w-1 rounded-full bg-gradient-to-b from-purple-400 to-purple-600" />
                  <div className="pl-8 sm:pl-12">
                    <div className="text-2xl leading-relaxed font-light text-gray-800 sm:text-3xl">
                      "
                      <HTMLContent html={renderContent(block.textContent)} className="inline" />
                      "
                    </div>
                    {block.settings?.attribution && (
                      <footer className="mt-6 text-sm font-medium text-gray-500">
                        —
                        {' '}
                        {block.settings.attribution}
                      </footer>
                    )}
                  </div>
                </blockquote>
              )}

              {/* Scene Block - Theatrical */}
              {block.blockType === 'scene' && block.sceneId && block.settings?.mediaUrl && (
                <div className="-mx-4 my-12 sm:mx-0 sm:my-16">
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

              {/* Reflection Block - Intimate & Inviting */}
              {block.blockType === 'reflection' && blockQuestions.length > 0 && (
                <section className="my-12 sm:my-16">
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
                          placeholder="Write your thoughts here..."
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

                        {/* Multiple choice - clean pills */}
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
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          );
        })}

        {/* Submit Button - Feels Complete */}
        {(pageData.reflectionQuestions.length > 0 || pageData.surveyQuestions.length > 0) && !submitSuccess && (
          <div className="mt-16 mb-20 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="group rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-purple-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-purple-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-3">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  Share My Thoughts
                  <Send className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="mt-12 mb-20 rounded-3xl bg-gradient-to-r from-emerald-50 to-green-50 p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-800">Responses Submitted!</h3>
            <p className="text-gray-600">
              Thank you for sharing your thoughts. Your therapist will review your responses.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
