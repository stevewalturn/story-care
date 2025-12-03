/**
 * Patient My Story Page
 * View personalized story pages created by therapist
 */

'use client';

import { BookOpen, Image as ImageIcon, MessageSquare, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type StoryPage = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  blockCount: number;
};

export default function PatientStoryPage() {
  const { user } = useAuth();
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Stories for You</h1>
        <p className="mt-2 text-gray-600">
          Your personalized stories from your therapist
        </p>
      </div>

      {/* Story Pages Grid */}
      {storyPages.length === 0
        ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                No story pages available yet
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Your therapist will create personalized story pages for you
              </p>
            </div>
          )
        : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {storyPages.map(page => (
                <a
                  key={page.id}
                  href={`/patient/story/${page.id}`}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
                >
                  {page.thumbnailUrl
                    ? (
                        <img
                          src={page.thumbnailUrl}
                          alt={page.title}
                          className="h-48 w-full object-cover"
                        />
                      )
                    : (
                        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                          <BookOpen className="h-12 w-12 text-indigo-600" />
                        </div>
                      )}

                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                      {page.title}
                    </h3>
                    {page.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {page.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {page.blockCount}
                        {' '}
                        sections
                      </span>
                      <span>
                        {new Date(page.publishedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                      <PlayCircle className="h-4 w-4" />
                      <ImageIcon className="h-4 w-4" />
                      <MessageSquare className="h-4 w-4" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

      {/* Welcome Message */}
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6">
        <div className="flex items-start">
          <BookOpen className="mr-3 h-6 w-6 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-indigo-900">
              Welcome to Your Story
            </h3>
            <p className="mt-1 text-sm text-indigo-700">
              Your story pages are created by your therapist to help you visualize and reflect on your therapeutic journey. Each page contains videos, images, and reflection questions designed specifically for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
