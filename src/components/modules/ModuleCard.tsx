'use client';

/**
 * Module Card Component
 * Displays individual treatment module with actions
 * Supports different action sets based on context (template vs module)
 */

import type { TreatmentModule } from '@/models/Schema';
import { Archive, Copy, Eye, MoreVertical, Pencil, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type ModuleCardProps = {
  module: TreatmentModule;
  onView?: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
  onRefresh?: () => void;
  isTemplate?: boolean;
  apiEndpoint?: string; // For archive endpoint override (e.g., /api/org-admin/modules)
};

export function ModuleCard({
  module,
  onView,
  onEdit,
  onCopy,
  onRefresh,
  isTemplate = false,
  apiEndpoint = '/api/modules',
}: ModuleCardProps) {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const domainInfo = getDomainInfo(module.domain);

  const handleArchive = async () => {
    if (!confirm(`Are you sure you want to archive "${module.name}"?`)) {
      return;
    }

    setIsArchiving(true);
    try {
      const response = await authenticatedFetch(`${apiEndpoint}/${module.id}`, user, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to archive module');
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      alert('Failed to archive module');
    } finally {
      setIsArchiving(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      {/* Domain gradient header */}
      <div
        className={`absolute top-0 left-0 h-1 w-full rounded-t-xl bg-gradient-to-r ${domainInfo.gradient}`}
      />

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          {/* Domain badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${domainInfo.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${domainInfo.dotClass}`} />
            {domainInfo.name}
          </span>

          {/* Scope badge */}
          {module.scope !== 'system' && (
            <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {module.scope === 'organization' ? 'Org' : 'Private'}
            </span>
          )}
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            type="button"
            disabled={isArchiving}
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
                onKeyDown={e => e.key === 'Escape' && setShowMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {onView && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onView();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    type="button"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                )}

                {onCopy && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onCopy();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
                    type="button"
                  >
                    <Copy className="h-4 w-4" />
                    Copy to Organization
                  </button>
                )}

                {onEdit && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    type="button"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                )}

                {onEdit && <hr className="my-1" />}

                {onEdit && (
                  <button
                    onClick={handleArchive}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    type="button"
                    disabled={isArchiving}
                  >
                    <Archive className="h-4 w-4" />
                    {isArchiving ? 'Archiving...' : 'Archive'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <button
        onClick={() => onView && onView()}
        className="w-full text-left"
        type="button"
      >
        <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
          {module.name}
        </h3>

        <p className="mb-4 line-clamp-2 text-sm text-gray-600">
          {module.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>
              Used
              {module.useCount}
              {' '}
              times
            </span>
          </div>
        </div>
      </button>

      {/* Footer - Status indicator */}
      {module.status !== 'active' && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            Status:
            {' '}
            {module.status === 'archived' ? '📦 Archived' : '⏳ Pending'}
          </span>
        </div>
      )}
    </div>
  );
}

// Helper function to get domain styling
function getDomainInfo(domain: string) {
  const domains = {
    self_strength: {
      name: 'Self & Strength',
      gradient: 'from-blue-500 to-cyan-500',
      badgeClass: 'bg-blue-50 text-blue-700',
      dotClass: 'bg-blue-500',
    },
    relationships_repair: {
      name: 'Relationships & Repair',
      gradient: 'from-green-500 to-emerald-500',
      badgeClass: 'bg-green-50 text-green-700',
      dotClass: 'bg-green-500',
    },
    identity_transformation: {
      name: 'Identity & Transformation',
      gradient: 'from-purple-500 to-pink-500',
      badgeClass: 'bg-purple-50 text-purple-700',
      dotClass: 'bg-purple-500',
    },
    purpose_future: {
      name: 'Purpose & Future',
      gradient: 'from-orange-500 to-amber-500',
      badgeClass: 'bg-orange-50 text-orange-700',
      dotClass: 'bg-orange-500',
    },
  };

  return domains[domain as keyof typeof domains] || domains.self_strength;
}
