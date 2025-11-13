'use client';

/**
 * Module Page Generator Component
 * Generates story pages from treatment modules and session analysis
 */

import { CheckCircle, FileText, Lightbulb, MessageSquare, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import type { TreatmentModule } from '@/models/Schema';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { ModuleBadge } from '@/components/modules/ModuleBadge';

interface ModulePageGeneratorProps {
  module: TreatmentModule;
  sessionId: string;
  patientId: string;
  patientName: string;
  onClose: () => void;
  onGenerated: (pageId: string) => void;
}

export function ModulePageGenerator({
  module,
  sessionId,
  patientId,
  patientName,
  onClose,
  onGenerated,
}: ModulePageGeneratorProps) {
  const { user } = useAuth();
  const [customTitle, setCustomTitle] = useState(`${module.name} - ${patientName}`);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [customMessage, setCustomMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const response = await authenticatedFetch(`/api/modules/${module.id}/generate-story-page`, user, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          patientId,
          customTitle: customTitle || undefined,
          includeMedia,
          sendNotification,
          customMessage: customMessage || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate story page');
      }

      const data = await response.json();
      onGenerated(data.storyPage.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen px-4 py-8">
        <div className="relative mx-auto max-w-3xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Generate Story Page from Module</h2>
              <p className="mt-1 text-sm text-gray-600">
                Create a personalized story page using the module protocol and session insights
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Module Info */}
              <div className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-semibold text-gray-900">Treatment Protocol</span>
                </div>
                <div className="mb-3">
                  <ModuleBadge
                    moduleName={module.name}
                    domain={module.domain as any}
                    size="md"
                  />
                </div>
                <p className="text-sm text-gray-700">{module.description}</p>
              </div>

              {/* What Will Be Generated */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  What Will Be Generated:
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <FileText className="h-5 w-5 shrink-0 text-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Story Page Content</div>
                      <div className="text-xs text-gray-600">
                        AI-generated content based on session analysis and module protocol
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                  </div>

                  {module.reflectionTemplateId && (
                    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <MessageSquare className="h-5 w-5 shrink-0 text-purple-600" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Reflection Questions</div>
                        <div className="text-xs text-gray-600">
                          Questions from module reflection template
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                    </div>
                  )}

                  {module.surveyTemplateId && (
                    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Survey Questions</div>
                        <div className="text-xs text-gray-600">
                          Questions from module survey template
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                    </div>
                  )}

                  {includeMedia && (
                    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <Sparkles className="h-5 w-5 shrink-0 text-amber-600" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Media Assets</div>
                        <div className="text-xs text-gray-600">
                          Recent images and videos from session library
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Customization Options */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Customization Options</h3>
                <div className="space-y-4">
                  {/* Page Title */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Story Page Title
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g., Your Journey of Resilience"
                    />
                  </div>

                  {/* Include Media */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="includeMedia"
                      checked={includeMedia}
                      onChange={(e) => setIncludeMedia(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="includeMedia" className="text-sm text-gray-700">
                      Include media assets from session
                    </label>
                  </div>

                  {/* Send Notification */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="sendNotification"
                      checked={sendNotification}
                      onChange={(e) => setSendNotification(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="sendNotification" className="text-sm text-gray-700">
                      Send email notification to patient
                    </label>
                  </div>

                  {/* Custom Message */}
                  {sendNotification && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Custom Message (Optional)
                      </label>
                      <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Add a personal message for the patient..."
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={generating}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={generating || !customTitle}
            >
              {generating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Story Page</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
