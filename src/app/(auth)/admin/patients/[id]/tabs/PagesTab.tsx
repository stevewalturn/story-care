'use client';

import { Book, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type PagesTabProps = {
  patientId: string;
};

type StoryPage = {
  id: string;
  title: string;
  description?: string;
  status: string;
  blockCount: number;
  updatedAt: string;
};

export function PagesTab({ patientId }: PagesTabProps) {
  const { user } = useAuth();
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch story pages from API
  useEffect(() => {
    if (!user?.uid || !patientId) return;

    const fetchPages = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/pages?patientId=${patientId}`, user);
        if (response.ok) {
          const data = await response.json();
          setPages(data.pages || []);
        }
      } catch (error) {
        console.error('Error fetching pages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [user, patientId]);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInMinutes > 0) return `${diffInMinutes} min ago`;
    return 'Just now';
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pages.map(page => (
          <Link
            key={page.id}
            href={`/pages/${page.id}`}
            className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg"
          >
            {/* Cover Image Placeholder */}
            <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200">
              <div className="flex h-full items-center justify-center">
                <Book className="h-12 w-12 text-purple-400" />
              </div>
              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  page.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {page.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="mb-1 font-semibold text-gray-900">{page.title}</h3>
              <p className="mb-4 text-sm text-gray-500 line-clamp-2">
                {page.description || 'No description available'}
              </p>

              {/* Footer Stats - Figma style */}
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-400">
                  <span>Last updated</span>
                  <p className="text-gray-600">{formatRelativeTime(page.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-gray-500">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>{page.blockCount} blocks</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {pages.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Book className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mb-1 text-sm font-medium text-gray-900">No story pages yet</h3>
          <p className="text-sm text-gray-500">
            Create a story page to share with this patient
          </p>
        </div>
      )}
    </div>
  );
}
