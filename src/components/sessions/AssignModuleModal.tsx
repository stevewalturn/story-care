'use client';

/**
 * Assign Module Modal Component
 * Modal for assigning treatment modules to therapy sessions
 */

import type { TreatmentModule } from '@/models/Schema';
import { CheckCircle, FileText, Lightbulb, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ModuleBadge } from '@/components/modules/ModuleBadge';
import { ModulePicker } from '@/components/modules/ModulePicker';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type AssignModuleModalProps = {
  sessionId: string;
  sessionTitle: string;
  currentModuleId?: string | null;
  onClose: () => void;
  onAssigned: () => void;
};

export function AssignModuleModal({
  sessionId,
  sessionTitle,
  currentModuleId,
  onClose,
  onAssigned,
}: AssignModuleModalProps) {
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState<TreatmentModule | null>(null);
  const [notes, setNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [isLoadingModule, setIsLoadingModule] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch and set current module when modal opens with an existing module assignment
  useEffect(() => {
    async function fetchCurrentModule() {
      if (currentModuleId && user) {
        setIsLoadingModule(true);
        try {
          const response = await authenticatedFetch(`/api/modules/${currentModuleId}`, user);
          if (response.ok) {
            const data = await response.json();
            setSelectedModule(data.module);
          }
        } catch (err) {
          console.error('Error fetching current module:', err);
          // Don't show error to user - they can still select a module manually
        } finally {
          setIsLoadingModule(false);
        }
      } else {
        // Reset if no current module
        setSelectedModule(null);
        setIsLoadingModule(false);
      }
    }

    fetchCurrentModule();
  }, [currentModuleId, user]);

  async function handleAssign() {
    if (!selectedModule) {
      setError('Please select a module');
      return;
    }

    setAssigning(true);
    setError(null);

    try {
      const response = await authenticatedFetch(`/api/sessions/${sessionId}/assign-module`, user, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: selectedModule.id,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign module');
      }

      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen px-4 py-8">
        <div className="relative mx-auto max-w-2xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Assign Treatment Module</h2>
              <p className="mt-1 text-sm text-gray-600">
                Session:
                {' '}
                <span className="font-medium">{sessionTitle}</span>
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
            {isLoadingModule ? (
              // Loading State
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Select Treatment Module
                    {' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex h-10 items-center rounded-lg border border-gray-300 bg-gray-50 px-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm text-gray-600">Loading module...</span>
                    </div>
                  </div>
                </div>
                {/* Loading skeleton for module details */}
                <div className="animate-pulse space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="h-6 w-32 rounded bg-gray-200" />
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Module Picker */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Select Treatment Module
                    {' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <ModulePicker
                    selectedModuleId={currentModuleId}
                    onSelect={setSelectedModule}
                    placeholder="Choose a therapeutic protocol"
                    allowClear={true}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Select the clinical protocol that guides this session's therapeutic approach
                  </p>
                </div>

                {/* Module Details (when selected) */}
                {selectedModule && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <ModuleBadge
                        moduleName={selectedModule.name}
                        domain={selectedModule.domain as any}
                        size="md"
                      />
                    </div>

                    <div className="space-y-3">
                      {/* Description */}
                      <div>
                        <h4 className="mb-1 text-sm font-semibold text-gray-900">
                          Therapeutic Aim
                        </h4>
                        <p className="text-sm text-gray-700">{selectedModule.description}</p>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                          <span>AI-Guided Analysis</span>
                        </div>
                        {(selectedModule as any).reflectionTemplateIds && (selectedModule as any).reflectionTemplateIds.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                            <span>
                              Reflection Questions (
                              {(selectedModule as any).reflectionTemplateIds.length}
                              )
                            </span>
                          </div>
                        )}
                        {(selectedModule as any).surveyTemplateIds && (selectedModule as any).surveyTemplateIds.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span>
                              Survey Questions (
                              {(selectedModule as any).surveyTemplateIds.length}
                              )
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes (Optional) */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Add any notes about why this module was chosen or session context..."
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={assigning}
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              type="button"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={!selectedModule || assigning || isLoadingModule}
            >
              {assigning ? 'Assigning...' : isLoadingModule ? 'Loading...' : currentModuleId ? 'Update Module' : 'Assign Module'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
