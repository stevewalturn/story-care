/**
 * Patient My Story Page
 * View personalized story pages created by therapist
 * Beautiful, immersive design for therapeutic storytelling
 */

'use client';

import {
  BookOpen,
  ChevronRight,
  Clock,
  Heart,
  Image as ImageIcon,
  MessageSquare,
  PlayCircle,
  Sparkles,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type StoryPage = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  blockCount: number;
  hasReflections?: boolean;
  hasSurveys?: boolean;
  hasMedia?: boolean;
};

export default function PatientStoryPage() {
  const { user, dbUser } = useAuth();
  const [storyPages, setStoryPages] = useState<StoryPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStoryPages();
    }
  }, [user]);

  const fetchStoryPages = async () => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/pages?patientView=true', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStoryPages(data.pages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const userName = dbUser?.name || user?.displayName || 'there';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-purple-200 opacity-75" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
              <BookOpen className="h-8 w-8 animate-pulse text-purple-600" />
            </div>
          </div>
          <p className="mt-4 text-gray-600">Loading your stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero Header - mobile optimized */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 px-4 py-10 sm:px-8 sm:py-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -left-4 h-24 w-24 rounded-full bg-white" />
          <div className="absolute top-10 right-20 h-16 w-16 rounded-full bg-white" />
          <div className="absolute bottom-8 left-1/3 h-20 w-20 rounded-full bg-white" />
          <div className="absolute -right-4 -bottom-4 h-32 w-32 rounded-full bg-white" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs text-white backdrop-blur-sm sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
            <Sparkles className="h-4 w-4" />
            Your personal journey
          </div>
          <h1 className="mb-3 text-2xl font-bold text-white sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
            Welcome back,
            {' '}
            {userName}
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-purple-100 sm:text-base lg:text-lg">
            Your personalized stories are here to help you reflect, grow, and visualize your therapeutic journey.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        {/* Stats Cards - mobile optimized */}
        {storyPages.length > 0 && (
          <div className="mb-8 grid grid-cols-3 gap-2 sm:mb-12 sm:gap-4">
            <div className="group rounded-xl border border-purple-100 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-2xl sm:p-6">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 transition-colors group-hover:bg-purple-200 sm:mb-3 sm:h-12 sm:w-12 sm:rounded-xl">
                <BookOpen className="h-4 w-4 text-purple-600 sm:h-6 sm:w-6" />
              </div>
              <div className="text-xl font-bold text-gray-900 sm:text-3xl">{storyPages.length}</div>
              <div className="text-xs text-gray-500 sm:text-sm">Stories</div>
            </div>

            <div className="group rounded-xl border border-pink-100 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-2xl sm:p-6">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-pink-100 transition-colors group-hover:bg-pink-200 sm:mb-3 sm:h-12 sm:w-12 sm:rounded-xl">
                <Heart className="h-4 w-4 text-pink-600 sm:h-6 sm:w-6" />
              </div>
              <div className="text-xl font-bold text-gray-900 sm:text-3xl">
                {storyPages.reduce((acc, p) => acc + p.blockCount, 0)}
              </div>
              <div className="text-xs text-gray-500 sm:text-sm">Sections</div>
            </div>

            <div className="group rounded-xl border border-indigo-100 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-2xl sm:p-6">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 transition-colors group-hover:bg-indigo-200 sm:mb-3 sm:h-12 sm:w-12 sm:rounded-xl">
                <Star className="h-4 w-4 text-indigo-600 sm:h-6 sm:w-6" />
              </div>
              <div className="text-xl font-bold text-gray-900 sm:text-3xl">
                {storyPages.filter((p) => {
                  const daysSince = Math.floor(
                    (Date.now() - new Date(p.publishedAt).getTime()) / (1000 * 60 * 60 * 24),
                  );
                  return daysSince < 7;
                }).length}
              </div>
              <div className="text-xs text-gray-500 sm:text-sm">New</div>
            </div>
          </div>
        )}

        {/* Story Pages Grid - mobile optimized */}
        {storyPages.length === 0 ? (
          <div className="overflow-hidden rounded-2xl border-2 border-dashed border-purple-200 bg-white p-8 text-center sm:rounded-3xl sm:p-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 sm:mb-6 sm:h-24 sm:w-24">
              <BookOpen className="h-8 w-8 text-purple-600 sm:h-12 sm:w-12" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl">
              Your Story Space
            </h3>
            <p className="mx-auto mb-4 max-w-md text-sm text-gray-600 sm:mb-6 sm:text-base">
              Your therapist is crafting personalized story pages just for you.
              They'll appear here when ready.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs text-purple-600 sm:px-4 sm:py-2 sm:text-sm">
              <Clock className="h-4 w-4" />
              Check back soon
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 sm:gap-3 sm:text-xl">
              <BookOpen className="h-5 w-5 text-purple-600 sm:h-6 sm:w-6" />
              Your Stories
            </h2>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {storyPages.map((page, index) => (
                <Link
                  key={page.id}
                  href={`/patient/story/${page.id}`}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden">
                    {page.thumbnailUrl ? (
                      <img
                        src={page.thumbnailUrl}
                        alt={page.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600">
                        <BookOpen className="h-16 w-16 text-white/80" />
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Play indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm">
                        <ChevronRight className="h-7 w-7 text-purple-600" />
                      </div>
                    </div>

                    {/* New badge */}
                    {Math.floor(
                      (Date.now() - new Date(page.publishedAt).getTime()) / (1000 * 60 * 60 * 24),
                    ) < 7 && (
                      <div className="absolute top-3 left-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1 text-xs font-medium text-white shadow-lg">
                        New
                      </div>
                    )}
                  </div>

                  {/* Content - mobile optimized */}
                  <div className="p-4 sm:p-6">
                    <h3 className="mb-1 text-base font-semibold text-gray-900 transition-colors group-hover:text-purple-600 sm:mb-2 sm:text-lg">
                      {page.title}
                    </h3>
                    {page.description && (
                      <p className="mb-3 line-clamp-2 text-xs text-gray-600 sm:mb-4 sm:text-sm">
                        {page.description}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(page.publishedAt)}
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-0.5 sm:px-2.5 sm:py-1">
                        {page.blockCount}
                        {' '}
                        <span className="hidden sm:inline">sections</span>
                        <span className="sm:hidden">sec</span>
                      </div>
                    </div>

                    {/* Content indicators - simplified on mobile */}
                    <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 sm:mt-4 sm:gap-3 sm:pt-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500 sm:gap-1.5">
                        <PlayCircle className="h-3.5 w-3.5 text-purple-500 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Videos</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 sm:gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-blue-500 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Images</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 sm:gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-green-500 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Reflect</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Welcome Message - mobile optimized */}
        <div className="mt-8 overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white shadow-xl sm:mt-12 sm:rounded-2xl sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm sm:h-14 sm:w-14 sm:rounded-2xl">
              <Heart className="h-6 w-6 text-white sm:h-7 sm:w-7" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold sm:mb-2 sm:text-xl">
                Your Story Matters
              </h3>
              <p className="text-sm text-purple-100 sm:text-base">
                Each story page is thoughtfully created by your therapist to help you visualize and
                reflect on your therapeutic journey. Take your time with each one - there's no rush.
                Your thoughts and reflections are valuable parts of your growth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
