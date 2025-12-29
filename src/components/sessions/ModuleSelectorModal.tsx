'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type TreatmentModule = {
  id: string;
  name: string;
  description: string | null;
  domain: string | null;
};

type ModuleSelectorModalProps = {
  user: any;
  isOpen: boolean;
  onModuleSelected: (moduleId: string) => void;
  onClose: () => void;
};

export function ModuleSelectorModal({
  user,
  isOpen,
  onModuleSelected,
  onClose,
}: ModuleSelectorModalProps) {
  const [modules, setModules] = useState<TreatmentModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen)
      return;

    async function fetchModules() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await authenticatedFetch('/api/modules', user);

        if (!response.ok) {
          throw new Error('Failed to fetch modules');
        }

        const data = await response.json();
        setModules(data.modules || []);
      }
      catch (err) {
        setError((err as Error).message);
      }
      finally {
        setIsLoading(false);
      }
    }

    fetchModules();
  }, [isOpen, user]);

  const handleSelect = () => {
    if (selectedModuleId) {
      onModuleSelected(selectedModuleId);
      onClose();
    }
  };

  if (!isOpen)
    return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Select a Module</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <svg className="h-8 w-8 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Error loading modules</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && modules.length === 0 && (
          <div className="rounded-lg bg-gray-50 p-6 text-center">
            <p className="text-sm font-medium text-gray-700">No modules available</p>
            <p className="mt-1 text-xs text-gray-500">
              Create treatment modules first to assign them to sessions.
            </p>
          </div>
        )}

        {/* Module List */}
        {!isLoading && !error && modules.length > 0 && (
          <>
            <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
              {modules.map(module => (
                <button
                  key={module.id}
                  onClick={() => setSelectedModuleId(module.id)}
                  className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                    selectedModuleId === module.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">{module.name}</div>
                  {module.domain && (
                    <div className="mt-1 text-xs text-purple-600">{module.domain}</div>
                  )}
                  {module.description && (
                    <div className="mt-1 text-sm text-gray-600">{module.description}</div>
                  )}
                </button>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSelect}
                disabled={!selectedModuleId}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Select Module
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
