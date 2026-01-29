/**
 * Patient My Story Page
 * View personalized story pages created by therapist
 * Modern, human-crafted design with warm interactions
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-purple-50/30 to-white">
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-purple-200 opacity-75" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
              <BookOpen className="h-8 w-8 animate-pulse text-purple-500" />
            </div>
          </div>
          <p className="mt-4 text-gray-600">Loading your stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/20 to-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 px-4 py-10 sm:px-8 sm:py-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -left-4 h-24 w-24 rounded-full bg-white" />
          <div className="absolute top-10 right-20 h-16 w-16 rounded-full bg-white" />
          <div className="absolute bottom-8 left-1/3 h-20 w-20 rounded-full bg-white" />
          <div className="absolute -right-4 -bottom-4 h-32 w-32 rounded-full bg-white" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur-sm sm:mb-6">
            <Sparkles className="h-4 w-4" />
            Your personal journey
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:mb-4 sm:text-4xl md:text-5xl">
            Welcome back,
            {' '}
            {userName}
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-purple-100 sm:text-lg">
            Your personalized stories are here to help you reflect, grow, and visualize your therapeutic journey.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        {/* Stats Cards */}
        {storyPages.length > 0 && (
          <div className="mb-10 grid grid-cols-3 gap-3 sm:mb-14 sm:gap-6">
            <div className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 transition-colors group-hover:bg-purple-200 sm:h-12 sm:w-12">
                <BookOpen className="h-5 w-5 text-purple-600 sm:h-6 sm:w-6" />
              </div>
              <div className="text-2xl font-bold text-gray-800 sm:text-3xl">{storyPages.length}</div>
              <div className="text-sm text-gray-500">Stories</div>
            </div>

            <div className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 transition-colors group-hover:bg-pink-200 sm:h-12 sm:w-12">
                <Heart className="h-5 w-5 text-pink-600 sm:h-6 sm:w-6" />
              </div>
              <div className="text-2xl font-bold text-gray-800 sm:text-3xl">
                {storyPages.reduce((acc, p) => acc + p.blockCount, 0)}
              </div>
              <div className="text-sm text-gray-500">Sections</div>
            </div>

            <div className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 transition-colors group-hover:bg-amber-200 sm:h-12 sm:w-12">
                <Star className="h-5 w-5 text-amber-600 sm:h-6 sm:w-6" />
              </div>
              <div className="text-2xl font-bold text-gray-800 sm:text-3xl">
                {storyPages.filter((p) => {
                  const daysSince = Math.floor(
                    (Date.now() - new Date(p.publishedAt).getTime()) / (1000 * 60 * 60 * 24),
                  );
                  return daysSince < 7;
                }).length}
              </div>
              <div className="text-sm text-gray-500">New</div>
            </div>
          </div>
        )}

        {/* Story Pages Grid */}
        {storyPages.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-gray-100 sm:p-16">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 sm:mb-6 sm:h-24 sm:w-24">
              <BookOpen className="h-10 w-10 text-purple-500 sm:h-12 sm:w-12" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-800 sm:text-2xl">
              Your Story Space
            </h3>
            <p className="mx-auto mb-5 max-w-md text-gray-600 sm:mb-6">
              Your therapist is crafting personalized story pages just for you.
              They'll appear here when ready.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm text-purple-600">
              <Clock className="h-4 w-4" />
              Check back soon
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="flex items-center gap-3 text-xl font-semibold text-gray-800">
              <BookOpen className="h-6 w-6 text-purple-500" />
              Your Stories
            </h2>

            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {storyPages.map((page, index) => (
                <Link
                  key={page.id}
                  href={`/patient/story/${page.id}`}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-purple-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden sm:h-52">
                    {page.thumbnailUrl ? (
                      <img
                        src={page.thumbnailUrl}
                        alt={page.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
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

                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    <h3 className="mb-1 text-lg font-semibold text-gray-800 transition-colors group-hover:text-purple-600 sm:text-xl">
                      {page.title}
                    </h3>
                    {page.description && (
                      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600">
                        {page.description}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {formatDate(page.publishedAt)}
                      </div>
                      <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                        {page.blockCount}
                        {' '}
                        sections
                      </div>
                    </div>

                    {/* Content indicators */}
                    <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <PlayCircle className="h-4 w-4 text-purple-500" />
                        <span className="hidden sm:inline">Videos</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <ImageIcon className="h-4 w-4 text-blue-500" />
                        <span className="hidden sm:inline">Images</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                        <span className="hidden sm:inline">Reflect</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Welcome Message */}
        <div className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white shadow-xl sm:mt-14 sm:p-10">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm sm:h-16 sm:w-16">
              <Heart className="h-7 w-7 text-white sm:h-8 sm:w-8" />
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold sm:text-2xl">
                Your Story Matters
              </h3>
              <p className="leading-relaxed text-purple-100">
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
