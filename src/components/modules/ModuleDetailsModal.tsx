'use client';

/**
 * Module Details Modal Component
 * Read-only view of module with tabbed interface
 */

import { Pencil, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import type { TreatmentModule } from '@/models/Schema';

interface ModuleDetailsModalProps {
  module: TreatmentModule;
  onClose: () => void;
  onEdit: () => void;
}

type Tab = 'overview' | 'questions' | 'prompt';

export function ModuleDetailsModal({ module, onClose, onEdit }: ModuleDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const domainInfo = getDomainInfo(module.domain);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen px-4 py-8">
        <div className="relative mx-auto max-w-4xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="border-b border-gray-200">
            <div className="flex items-start justify-between px-6 py-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${domainInfo.badgeClass}`}>
                    <span className={`h-2 w-2 rounded-full ${domainInfo.dotClass}`} />
                    {domainInfo.name}
                  </span>
                  {module.scope !== 'system' && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                      {module.scope === 'organization' ? 'Organization' : 'Private'}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{module.name}</h2>
                <p className="mt-2 text-gray-600">{module.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onEdit}
                  className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
                  type="button"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6">
              <div className="flex gap-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3 text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`pb-3 text-sm font-medium transition-colors ${
                    activeTab === 'questions'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  Questions
                </button>
                <button
                  onClick={() => setActiveTab('prompt')}
                  className={`pb-3 text-sm font-medium transition-colors ${
                    activeTab === 'prompt'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  AI Prompt
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="h-4 w-4" />
                      Usage Count
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {module.useCount}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">Sessions using this module</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm text-gray-600">Status</div>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {module.status === 'active' ? '✓ Active' : module.status}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">Current module status</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm text-gray-600">Created</div>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {new Date(module.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">Module creation date</p>
                  </div>
                </div>

                {/* Full Description */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Therapeutic Aim</h3>
                  <p className="text-gray-700">{module.description}</p>
                </div>
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Opening Questions (In-Session)
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    These questions guide the therapeutic conversation during sessions.
                  </p>
                  <ol className="space-y-3">
                    {(module.inSessionQuestions as string[])?.map((question, index) => (
                      <li key={index} className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                          {index + 1}
                        </span>
                        <p className="flex-1 text-gray-700">{question}</p>
                      </li>
                    )) || (
                      <p className="text-sm text-gray-500">No questions defined</p>
                    )}
                  </ol>
                </div>
              </div>
            )}

            {/* AI Prompt Tab */}
            {activeTab === 'prompt' && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">AI Analysis Instructions</h3>
                  <p className="mb-4 text-sm text-gray-600">
                    This prompt guides AI to extract module-specific insights from transcripts.
                  </p>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700">
                      {module.aiPromptText}
                    </pre>
                  </div>
                </div>

                {module.aiPromptMetadata && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">Expected Output Format</h3>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700">
                        {JSON.stringify(module.aiPromptMetadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-500">
              Module ID: <code className="rounded bg-gray-100 px-1 font-mono text-xs">{module.id}</code>
            </p>
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              type="button"
            >
              <Pencil className="h-4 w-4" />
              Edit Module
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get domain styling
function getDomainInfo(domain: string) {
  const domains = {
    self_strength: {
      name: 'Self & Strength',
      badgeClass: 'bg-blue-50 text-blue-700',
      dotClass: 'bg-blue-500',
    },
    relationships_repair: {
      name: 'Relationships & Repair',
      badgeClass: 'bg-green-50 text-green-700',
      dotClass: 'bg-green-500',
    },
    identity_transformation: {
      name: 'Identity & Transformation',
      badgeClass: 'bg-purple-50 text-purple-700',
      dotClass: 'bg-purple-500',
    },
    purpose_future: {
      name: 'Purpose & Future',
      badgeClass: 'bg-orange-50 text-orange-700',
      dotClass: 'bg-orange-500',
    },
  };

  return domains[domain as keyof typeof domains] || domains.self_strength;
}
