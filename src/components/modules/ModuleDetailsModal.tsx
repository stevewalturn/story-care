'use client';

/**
 * Module Details Modal Component
 * Read-only view of module with tabbed interface
 */

import type { TreatmentModuleWithPrompts } from '@/models/Schema';
import { Pencil, Sparkles, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type ModuleDetailsModalProps = {
  module: TreatmentModuleWithPrompts;
  onClose: () => void;
  onEdit?: () => void; // Optional - only provided for editable modules
  onCopy?: () => void; // Optional - only provided for system modules
};

type Tab = 'overview' | 'prompts';

export function ModuleDetailsModal({ module, onClose, onEdit, onCopy }: ModuleDetailsModalProps) {
  const { dbUser } = useAuth();
  const isSuperAdmin = dbUser?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState<Tab>(isSuperAdmin ? 'overview' : 'prompts');

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
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
                    type="button"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                )}
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
                {isSuperAdmin && (
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
                )}
                <button
                  onClick={() => setActiveTab('prompts')}
                  className={`pb-3 text-sm font-medium transition-colors ${
                    activeTab === 'prompts'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  AI Prompts
                  {' '}
                  {module.linkedPrompts && module.linkedPrompts.length > 0 && (
                    <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                      {module.linkedPrompts.length}
                    </span>
                  )}
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
                {/* Stats - Only visible to Super Admins */}
                {isSuperAdmin && (
                  <>
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
                  </>
                )}
              </div>
            )}

            {/* AI Prompts Tab */}
            {activeTab === 'prompts' && (
              <div className="space-y-6">
                {/* Section 1: Module AI Prompt (Always shown) */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Module AI Prompt
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    Core AI prompt stored directly on this module. Always executed during analysis.
                  </p>

                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-600" />
                      <h4 className="font-semibold text-gray-900">Base Analysis Prompt</h4>
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        Required
                      </span>
                    </div>
                    <div className="rounded-md border border-indigo-300 bg-white p-3">
                      <pre className="font-mono text-xs whitespace-pre-wrap text-gray-700">
                        {module.aiPromptText}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Section 2: Linked AI Prompts from Library */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Linked AI Prompts from Library
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    Additional AI prompts from the shared library. These are executed alongside the module prompt.
                  </p>

                  {module.linkedPrompts && module.linkedPrompts.length > 0 ? (
                    <div className="space-y-3">
                      {module.linkedPrompts.map((prompt) => {
                        const categoryColors = {
                          analysis: 'bg-blue-100 text-blue-700 border-blue-200',
                          creative: 'bg-purple-100 text-purple-700 border-purple-200',
                          extraction: 'bg-green-100 text-green-700 border-green-200',
                          reflection: 'bg-orange-100 text-orange-700 border-orange-200',
                        };

                        const colorClass = categoryColors[prompt.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-700 border-gray-200';

                        return (
                          <div
                            key={prompt.id}
                            className={`rounded-lg border p-4 transition-shadow hover:shadow-md ${colorClass}`}
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{prompt.name}</h4>
                                <div className="mt-1 flex items-center gap-2">
                                  {prompt.category && (
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
                                      {prompt.category}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <Sparkles className="h-3 w-3" />
                                    {prompt.icon || 'sparkles'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {prompt.description && (
                              <p className="mb-3 text-sm text-gray-600">{prompt.description}</p>
                            )}

                            <div className="rounded-md border border-gray-300 bg-white p-3">
                              <pre className="font-mono text-xs whitespace-pre-wrap text-gray-700">
                                {prompt.promptText}
                              </pre>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                      <Sparkles className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                      <h4 className="mb-1 text-sm font-semibold text-gray-900">
                        No Library Prompts Linked
                      </h4>
                      <p className="text-xs text-gray-600">
                        This module only uses its base prompt. You can link additional prompts from the library when editing.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            {isSuperAdmin && (
              <p className="text-sm text-gray-500">
                Module ID:
                {' '}
                <code className="rounded bg-gray-100 px-1 font-mono text-xs">{module.id}</code>
              </p>
            )}
            {!isSuperAdmin && <div />}
            <div className="flex gap-2">
              {onCopy && (
                <button
                  onClick={onCopy}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                  type="button"
                >
                  Copy Module
                </button>
              )}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  type="button"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Module
                </button>
              )}
            </div>
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
