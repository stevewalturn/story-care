'use client';

import { useState } from 'react';
import { Plus, FileText, Eye, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageEditor } from '@/components/pages/PageEditor';
import { Modal } from '@/components/ui/Modal';

interface StoryPage {
  id: string;
  title: string;
  patientName: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  blockCount: number;
}

interface PagesClientProps {
  locale: string;
}

export function PagesClient({ locale }: PagesClientProps) {
  const [pages, setPages] = useState<StoryPage[]>([
    {
      id: '1',
      title: 'Emma\'s Journey: Finding Strength',
      patientName: 'Emma Wilson',
      isPublished: true,
      createdAt: new Date(2025, 9, 15),
      updatedAt: new Date(2025, 9, 20),
      blockCount: 8,
    },
    {
      id: '2',
      title: 'Reflections on Growth',
      patientName: 'Emma Wilson',
      isPublished: false,
      createdAt: new Date(2025, 9, 22),
      updatedAt: new Date(2025, 9, 25),
      blockCount: 5,
    },
  ]);

  const [showEditor, setShowEditor] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  const handleCreatePage = () => {
    setEditingPageId(null);
    setShowEditor(true);
  };

  const handleEditPage = (pageId: string) => {
    setEditingPageId(pageId);
    setShowEditor(true);
  };

  const handleSavePage = (title: string, blocks: any[]) => {
    console.log('Saving page:', { title, blocks });
    // In real implementation, save to API
    setShowEditor(false);
    alert('Page saved successfully!');
  };

  const handleDeletePage = (pageId: string) => {
    if (confirm('Are you sure you want to delete this page?')) {
      setPages(pages.filter((p) => p.id !== pageId));
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Story Pages</h1>
          <Button variant="primary" onClick={handleCreatePage}>
            <Plus className="w-4 h-4 mr-2" />
            Create Page
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Create interactive story pages with media, reflections, and surveys for patients
        </p>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => (
          <div
            key={page.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white group"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {page.title}
                  </h3>
                  <p className="text-sm text-gray-600">{page.patientName}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  page.isPublished
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {page.isPublished ? 'Published' : 'Draft'}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4">
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{page.blockCount} blocks</span>
                </div>
                <div>
                  Updated {formatDate(page.updatedAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEditPage(page.id)}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Preview functionality
                    alert('Preview will open patient-facing view');
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletePage(page.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {pages.length === 0 && (
          <div className="col-span-full text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No story pages yet</p>
            <Button variant="primary" onClick={handleCreatePage}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Page
            </Button>
          </div>
        )}
      </div>

      {/* Page Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
            <PageEditor
              pageId={editingPageId || undefined}
              onSave={handleSavePage}
            />
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
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
