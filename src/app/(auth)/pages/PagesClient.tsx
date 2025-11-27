'use client';

import { CheckCircle, Copy, Edit2, FileText, Link2, Plus, Share2, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { PageEditor } from '@/components/pages/PageEditor';
import { Button } from '@/components/ui/Button';
import { } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedDelete, authenticatedFetch, authenticatedPost, authenticatedPut } from '@/utils/AuthenticatedFetch';

type StoryPage = {
  id: string;
  title: string;
  patientName: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  blockCount: number;
  status: 'draft' | 'published' | 'archived';
  patientId: string;
};

type Patient = {
  id: string;
  name: string;
};

type ContentBlock = {
  id: string;
  type: 'text' | 'image' | 'video' | 'quote' | 'scene' | 'reflection' | 'survey';
  order: number;
  content: any;
};

export function PagesClient() {
  const { user } = useAuth();
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageData, setEditingPageData] = useState<{
    title: string;
    blocks: ContentBlock[];
    patientId: string;
  } | null>(null);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePageId, setSharePageId] = useState<string | null>(null);
  const [shareLinks, setShareLinks] = useState<any[]>([]);
  const [loadingShare, setLoadingShare] = useState(false);
  const [expiryMinutes, setExpiryMinutes] = useState(60);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/pages', user);
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
  }, [user]);

  const fetchPatients = useCallback(async () => {
    if (!user) return;

    try {
      const response = await authenticatedFetch('/api/patients', user);
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();
      setPatients(data.patients);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      setPatients([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPages();
      fetchPatients();
    }
  }, [user, fetchPages, fetchPatients]);

  const handleCreatePage = () => {
    setEditingPageId(null);
    setEditingPageData(null);
    setShowEditor(true);
  };

  const handleEditPage = async (pageId: string) => {
    try {
      // Fetch page data with blocks
      const response = await authenticatedFetch(`/api/pages/${pageId}`, user);
      if (!response.ok) {
        throw new Error('Failed to fetch page');
      }

      const data = await response.json();
      const { page, blocks: dbBlocks } = data;

      // Get reflection block IDs
      const reflectionBlockIds = dbBlocks
        .filter((b: any) => b.blockType === 'reflection')
        .map((b: any) => b.id);

      // Get survey block IDs
      const surveyBlockIds = dbBlocks
        .filter((b: any) => b.blockType === 'survey')
        .map((b: any) => b.id);

      // Fetch reflection questions if any reflection blocks exist
      let reflectionQuestionsData: any[] = [];
      if (reflectionBlockIds.length > 0) {
        const questionsResponse = await authenticatedFetch(
          `/api/questions/reflection?blockIds=${reflectionBlockIds.join(',')}`,
          user,
        );
        if (questionsResponse.ok) {
          const questionsJson = await questionsResponse.json();
          reflectionQuestionsData = questionsJson.questions || [];
        }
      }

      // Fetch survey questions if any survey blocks exist
      let surveyQuestionsData: any[] = [];
      if (surveyBlockIds.length > 0) {
        const questionsResponse = await authenticatedFetch(
          `/api/questions/survey?blockIds=${surveyBlockIds.join(',')}`,
          user,
        );
        if (questionsResponse.ok) {
          const questionsJson = await questionsResponse.json();
          surveyQuestionsData = questionsJson.questions || [];
        }
      }

      // Fetch scene information for scene blocks
      const sceneBlockIds = dbBlocks
        .filter((b: any) => b.blockType === 'scene' && b.sceneId)
        .map((b: any) => b.sceneId);

      const scenesData: any = {};
      if (sceneBlockIds.length > 0) {
        for (const sceneId of sceneBlockIds) {
          try {
            const sceneResponse = await authenticatedFetch(`/api/scenes/${sceneId}`, user);
            if (sceneResponse.ok) {
              const sceneJson = await sceneResponse.json();
              scenesData[sceneId] = sceneJson.scene;
            }
          } catch (error) {
            console.error(`Failed to fetch scene ${sceneId}:`, error);
          }
        }
      }

      // Transform database blocks to PageEditor format
      const transformedBlocks: ContentBlock[] = dbBlocks.map((block: any) => {
        const baseBlock = {
          id: block.id,
          type: block.blockType,
          order: block.sequenceNumber,
          content: {
            text: block.textContent || undefined,
            sceneId: block.sceneId || undefined,
            mediaUrl: block.mediaUrl || undefined,
            ...(block.settings || {}),
          },
        };

        // Add scene information if this is a scene block
        if (block.blockType === 'scene' && block.sceneId && scenesData[block.sceneId]) {
          const scene = scenesData[block.sceneId];
          baseBlock.content.sceneTitle = scene.title;
          baseBlock.content.mediaUrl = scene.videoUrl || scene.thumbnailUrl || baseBlock.content.mediaUrl;
        }

        // Add reflection questions if this is a reflection block
        if (block.blockType === 'reflection') {
          const blockQuestions = reflectionQuestionsData
            .filter(q => q.blockId === block.id)
            .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
            .map(q => ({
              id: q.id,
              text: q.questionText,
              type: q.questionType,
              sequenceNumber: q.sequenceNumber,
            }));

          baseBlock.content.questions = blockQuestions.length > 0
            ? blockQuestions
            : [{ id: `q-default`, text: '', type: 'open_text', sequenceNumber: 0 }];
        }

        // Add survey questions if this is a survey block
        if (block.blockType === 'survey') {
          const blockQuestions = surveyQuestionsData
            .filter(q => q.blockId === block.id)
            .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
            .map(q => ({
              id: q.id,
              text: q.questionText,
              type: q.questionType,
              sequenceNumber: q.sequenceNumber,
              scaleMin: q.scaleMin,
              scaleMax: q.scaleMax,
              scaleMinLabel: q.scaleMinLabel,
              scaleMaxLabel: q.scaleMaxLabel,
              options: q.options ? JSON.parse(q.options) : undefined,
            }));

          baseBlock.content.surveyQuestions = blockQuestions.length > 0
            ? blockQuestions
            : [{ id: `sq-default`, text: '', type: 'open_text', sequenceNumber: 0 }];
        }

        return baseBlock;
      });

      setEditingPageId(pageId);
      setEditingPageData({
        title: page.title,
        blocks: transformedBlocks,
        patientId: page.patientId,
      });
      setShowEditor(true);
    } catch (error) {
      console.error('Failed to load page:', error);
      alert('Failed to load page. Please try again.');
    }
  };

  const handleSavePage = async (title: string, blocks: any[], patientId: string | null) => {
    try {
      let response;
      if (editingPageId) {
        response = await authenticatedPut(`/api/pages/${editingPageId}`, user, { title, blocks, patientId });
      } else {
        response = await authenticatedPost('/api/pages', user, { title, blocks, patientId });
      }

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
      const response = await authenticatedDelete(`/api/pages/${pageId}`, user);

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      await fetchPages();
    } catch (error) {
      console.error('Failed to delete page:', error);
      alert('Failed to delete page. Please try again.');
    }
  };

  const handleTogglePublish = async (pageId: string, currentStatus: 'draft' | 'published' | 'archived') => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const action = newStatus === 'published' ? 'publish' : 'unpublish';

    try {
      const response = await authenticatedPut(`/api/pages/${pageId}`, user, { status: newStatus });

      if (!response.ok) {
        throw new Error(`Failed to ${action} page`);
      }

      await fetchPages();
    } catch (error) {
      console.error(`Failed to ${action} page:`, error);
      alert(`Failed to ${action} page. Please try again.`);
    }
  };

  const handleOpenShareModal = async (pageId: string) => {
    setSharePageId(pageId);
    setShowShareModal(true);
    await fetchShareLinks(pageId);
  };

  const fetchShareLinks = async (pageId: string) => {
    setLoadingShare(true);
    try {
      const response = await authenticatedFetch(`/api/pages/${pageId}/share`, user);
      if (response.ok) {
        const data = await response.json();
        setShareLinks(data.shareLinks || []);
      }
    } catch (error) {
      console.error('Failed to fetch share links:', error);
    } finally {
      setLoadingShare(false);
    }
  };

  const handleCreateShareLink = async () => {
    if (!sharePageId) return;

    setLoadingShare(true);
    try {
      const response = await authenticatedPost(`/api/pages/${sharePageId}/share`, user, {
        expiryMinutes,
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      await fetchShareLinks(sharePageId);
    } catch (error) {
      console.error('Failed to create share link:', error);
      alert('Failed to create share link. Please try again.');
    } finally {
      setLoadingShare(false);
    }
  };

  const handleRevokeShareLink = async (linkId: string) => {
    if (!sharePageId) return;

    try {
      const response = await authenticatedDelete(`/api/pages/${sharePageId}/share/${linkId}`, user);

      if (!response.ok) {
        throw new Error('Failed to revoke share link');
      }

      await fetchShareLinks(sharePageId);
    } catch (error) {
      console.error('Failed to revoke share link:', error);
      alert('Failed to revoke share link. Please try again.');
    }
  };

  const handleCopyLink = (shareUrl: string, linkId: string) => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(linkId);
    setTimeout(() => setCopiedLink(null), 2000);
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
                  variant={page.status === 'published' ? 'ghost' : 'primary'}
                  size="sm"
                  onClick={() => handleTogglePublish(page.id, page.status)}
                  title={page.status === 'published' ? 'Unpublish page' : 'Publish page'}
                >
                  {page.status === 'published' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenShareModal(page.id)}
                  title="Share page"
                >
                  <Share2 className="h-4 w-4 text-indigo-600" />
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
          <div className="h-[90vh] w-full max-w-6xl overflow-auto rounded-lg bg-white shadow-xl">
            <PageEditor
              pageId={editingPageId || undefined}
              initialTitle={editingPageData?.title}
              initialBlocks={editingPageData?.blocks}
              initialPatientId={editingPageData?.patientId}
              patients={patients}
              onSave={handleSavePage}
              onClose={() => setShowEditor(false)}
            />
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-gray-900 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Share Page</h3>
                <p className="text-sm text-gray-600">Create time-limited shareable links</p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {/* Create New Link */}
              <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <h4 className="mb-3 font-medium text-indigo-900">Create New Share Link</h4>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Expires in (minutes)
                    </label>
                    <input
                      type="number"
                      value={expiryMinutes}
                      onChange={e => setExpiryMinutes(parseInt(e.target.value) || 60)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="60"
                      min="1"
                      max="10080"
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      Common: 60 (1 hour), 1440 (1 day), 10080 (7 days)
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleCreateShareLink}
                    disabled={loadingShare}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Generate Link
                  </Button>
                </div>
              </div>

              {/* Active Share Links */}
              <div>
                <h4 className="mb-3 font-medium text-gray-900">Active Share Links</h4>
                {loadingShare && (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                  </div>
                )}

                {!loadingShare && shareLinks.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
                    <Link2 className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                    <p className="text-sm text-gray-600">No active share links</p>
                    <p className="text-xs text-gray-500">Create a link above to get started</p>
                  </div>
                )}

                {!loadingShare && shareLinks.length > 0 && (
                  <div className="space-y-3">
                    {shareLinks.map((link) => {
                      const isExpired = link.isExpired || new Date(link.expiresAt) < new Date();
                      return (
                        <div
                          key={link.id}
                          className={`rounded-lg border p-4 ${
                            isExpired ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`rounded px-2 py-1 text-xs font-medium ${
                                isExpired
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                              >
                                {isExpired ? 'Expired' : 'Active'}
                              </span>
                              <span className="text-xs text-gray-600">
                                Expires:
                                {' '}
                                {new Date(link.expiresAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {!isExpired && (
                                <button
                                  onClick={() => handleCopyLink(link.shareUrl, link.id)}
                                  className="rounded p-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-indigo-600"
                                  title="Copy link"
                                >
                                  {copiedLink === link.id ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleRevokeShareLink(link.id)}
                                className="rounded p-1 text-gray-600 transition-colors hover:bg-red-100 hover:text-red-600"
                                title="Revoke link"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="group relative">
                            <input
                              type="text"
                              value={link.shareUrl}
                              readOnly
                              className="w-full truncate rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                            />
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                            <span>
                              Duration:
                              {link.expiryDurationMinutes}
                              {' '}
                              minutes
                            </span>
                            <span>
                              Accessed:
                              {link.accessCount}
                              {' '}
                              times
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-gray-200 p-4">
              <Button variant="ghost" onClick={() => setShowShareModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
