'use client';

import { Edit2, Eye, FileText, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageEditor } from '@/components/pages/PageEditor';
import { Button } from '@/components/ui/Button';
import { } from '@/components/ui/Modal';

type StoryPage = {
  id: string;
  title: string;
  patientName: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  blockCount: number;
};

export function PagesClient() {
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pages');
      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      const data = await response.json();
      setPages(data.pages.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      })));
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = () => {
    setEditingPageId(null);
    setShowEditor(true);
  };

  const handleEditPage = (pageId: string) => {
    setEditingPageId(pageId);
    setShowEditor(true);
  };

  const handleSavePage = async (title: string, blocks: any[]) => {
    try {
      const endpoint = editingPageId ? `/api/pages/${editingPageId}` : '/api/pages';
      const method = editingPageId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, blocks }),
      });

      if (!response.ok) {
        throw new Error('Failed to save page');
      }

      await fetchPages();
      setShowEditor(false);
    } catch (error) {
      console.error('Failed to save page:', error);
      alert('Failed to save page. Please try again.');
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) {
      return;
    }

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      await fetchPages();
    } catch (error) {
      console.error('Failed to delete page:', error);
      alert('Failed to delete page. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Story Pages</h1>
          <Button variant="primary" onClick={handleCreatePage}>
            <Plus className="mr-2 h-4 w-4" />
            Create Page
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Create interactive story pages with media, reflections, and surveys for patients
        </p>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages.map(page => (
          <div
            key={page.id}
            className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg"
          >
            {/* Header */}
            <div className="border-b border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900">
                    {page.title}
                  </h3>
                  <p className="text-sm text-gray-600">{page.patientName}</p>
                </div>
                <div className={`rounded px-2 py-1 text-xs font-medium ${
                  page.isPublished
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
                >
                  {page.isPublished ? 'Published' : 'Draft'}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4">
              <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>
                    {page.blockCount}
                    {' '}
                    blocks
                  </span>
                </div>
                <div>
                  Updated
                  {' '}
                  {formatDate(page.updatedAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEditPage(page.id)}
                  className="flex-1"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Preview functionality
                    window.open(`/story/${page.id}`, '_blank');
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletePage(page.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {pages.length === 0 && (
          <div className="col-span-full rounded-lg border-2 border-dashed border-gray-300 py-16 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <p className="mb-4 text-gray-600">No story pages yet</p>
            <Button variant="primary" onClick={handleCreatePage}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Page
            </Button>
          </div>
        )}
      </div>

      {/* Page Editor Modal */}
      {showEditor && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-gray-900 p-4">
          <div className="h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl">
            <PageEditor
              pageId={editingPageId || undefined}
              onSave={handleSavePage}
            />
            <div className="flex justify-end border-t border-gray-200 bg-gray-50 p-4">
              <Button variant="ghost" onClick={() => setShowEditor(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
