'use client';

/**
 * Module Analysis Panel Component
 * Displays assigned treatment module information in transcript viewer
 */

import type { TreatmentModule } from '@/models/Schema';
import { ChevronDown, ChevronUp, Lightbulb, Target } from 'lucide-react';
import { useState } from 'react';
import { ModuleBadge } from '@/components/modules/ModuleBadge';

type ModuleAnalysisPanelProps = {
  module: TreatmentModule;
  onAnalyzeWithModule?: () => void;
};

export function ModuleAnalysisPanel({ module, onAnalyzeWithModule }: ModuleAnalysisPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left"
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">Treatment Protocol Active</span>
            </div>
            <ModuleBadge
              moduleName={module.name}
              domain={module.domain as any}
              size="sm"
            />
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="space-y-4 border-t border-purple-200 p-4">
          {/* Therapeutic Aim */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Therapeutic Aim
            </h4>
            <p className="text-sm text-gray-700">{module.description}</p>
          </div>

          {/* Action Button */}
          {onAnalyzeWithModule && (
            <button
              onClick={onAnalyzeWithModule}
              className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
              type="button"
            >
              Analyze Full Transcript with Module
            </button>
          )}

          {/* Info Footer */}
          <div className="rounded-lg border border-purple-200 bg-white/50 p-3">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Protocol Guidance:</span>
              {' '}
              Use the opening questions above to guide your analysis.
              When analyzing text, module-specific prompts will be automatically included.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Module Indicator
 * Shows just the module badge with minimal info
 */
export function CompactModuleIndicator({ module }: { module: TreatmentModule }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
      <Target className="h-4 w-4 text-purple-600" />
      <span className="text-xs font-medium text-gray-700">Protocol:</span>
      <ModuleBadge
        moduleName={module.name}
        domain={module.domain as any}
        size="sm"
        showIcon={false}
      />
    </div>
  );
}
