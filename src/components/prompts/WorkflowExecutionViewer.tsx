'use client';

/**
 * Workflow Execution Viewer Component
 *
 * Visualizes the execution flow of building blocks workflows.
 * Shows execution status, step progress, and handles action button rendering.
 */

import { useState } from 'react';
import type {
  ActionExecutionRequest,
  ActionExecutionResult,
  BlockInstance,
  WorkflowExecution,
} from '@/types/BuildingBlocks';
import { getBlockDefinition } from '@/config/BlockDefinitions';
import { ActionButtonRenderer } from './ActionButtonRenderer';
import { Play, Pause, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface WorkflowExecutionViewerProps {
  execution: WorkflowExecution;
  onExecuteAction: (request: ActionExecutionRequest) => Promise<ActionExecutionResult>;
  onExecutionUpdate?: (execution: WorkflowExecution) => void;
}

/**
 * Displays workflow execution with step-by-step visualization
 */
export function WorkflowExecutionViewer({
  execution,
  onExecuteAction,
  onExecutionUpdate,
}: WorkflowExecutionViewerProps) {
  const [localExecution, setLocalExecution] = useState<WorkflowExecution>(execution);

  const handleActionExecute = async (request: ActionExecutionRequest) => {
    const result = await onExecuteAction(request);

    // Update local execution state
    const updatedBlocks = localExecution.blocks.map(block => {
      if (block.instanceId === request.blockInstanceId) {
        return {
          ...block,
          executionStatus: result.success ? 'completed' : 'failed',
          executionResult: result.data,
          executionError: result.error,
        } as BlockInstance;
      }
      return block;
    });

    const updatedExecution: WorkflowExecution = {
      ...localExecution,
      blocks: updatedBlocks,
    };

    setLocalExecution(updatedExecution);
    onExecutionUpdate?.(updatedExecution);

    return result;
  };

  return (
    <div className="space-y-6">
      {/* Execution Header */}
      <ExecutionHeader execution={localExecution} />

      {/* Workflow Progress */}
      <WorkflowProgress execution={localExecution} />

      {/* Step-by-Step Execution */}
      <div className="space-y-4">
        {localExecution.blocks.map((block, index) => (
          <StepCard
            key={block.instanceId}
            block={block}
            stepIndex={index}
            isCurrentStep={index === localExecution.currentStepIndex}
            context={localExecution.context}
            onExecuteAction={handleActionExecute}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Execution header showing overall status
 */
function ExecutionHeader({ execution }: { execution: WorkflowExecution }) {
  const statusConfig = {
    pending: { icon: Clock, color: 'gray', label: 'Pending' },
    running: { icon: Play, color: 'blue', label: 'Running' },
    paused: { icon: Pause, color: 'yellow', label: 'Paused - Waiting for Action' },
    completed: { icon: CheckCircle, color: 'green', label: 'Completed' },
    failed: { icon: XCircle, color: 'red', label: 'Failed' },
  };

  const config = statusConfig[execution.status];
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${config.color}-100`}>
            <Icon className={`h-5 w-5 text-${config.color}-600`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Workflow Execution</h3>
            <p className="text-sm text-gray-600">{config.label}</p>
          </div>
        </div>

        {execution.error && (
          <div className="text-sm text-red-600 max-w-md">
            <strong>Error:</strong> {execution.error}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Progress bar showing workflow completion
 */
function WorkflowProgress({ execution }: { execution: WorkflowExecution }) {
  const completedSteps = execution.blocks.filter(b => b.executionStatus === 'completed').length;
  const totalSteps = execution.blocks.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm text-gray-600">
          {completedSteps} / {totalSteps} steps
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Individual step card showing block execution
 */
function StepCard({
  block,
  stepIndex,
  isCurrentStep,
  context,
  onExecuteAction,
}: {
  block: BlockInstance;
  stepIndex: number;
  isCurrentStep: boolean;
  context: WorkflowExecution['context'];
  onExecuteAction: (request: ActionExecutionRequest) => Promise<ActionExecutionResult>;
}) {
  const blockDef = getBlockDefinition(block.blockId);
  const [isExpanded, setIsExpanded] = useState(isCurrentStep);

  if (!blockDef) {
    return null;
  }

  const isManualAction = block.executionMode === 'manual' || blockDef.executionMode === 'manual';

  // Status styling
  const statusConfig = {
    pending: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-600' },
    processing: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
    completed: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
    failed: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
  };

  const status = block.executionStatus || 'pending';
  const config = statusConfig[status];

  return (
    <div
      className={`rounded-lg border-2 ${config.border} ${config.bg} overflow-hidden transition-all ${
        isCurrentStep ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Step Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-opacity-80 transition-colors"
      >
        {/* Step Number */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
            status === 'completed'
              ? 'bg-green-600 text-white'
              : status === 'processing'
                ? 'bg-blue-600 text-white'
                : status === 'failed'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-300 text-gray-700'
          }`}
        >
          {status === 'completed' ? (
            <CheckCircle className="h-4 w-4" />
          ) : status === 'failed' ? (
            <XCircle className="h-4 w-4" />
          ) : (
            stepIndex + 1
          )}
        </div>

        {/* Block Info */}
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-900">{blockDef.label}</div>
          <div className="text-sm text-gray-600">
            {blockDef.category} • {isManualAction ? 'Manual Action' : 'Auto-execute'}
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'completed'
              ? 'bg-green-100 text-green-800'
              : status === 'processing'
                ? 'bg-blue-100 text-blue-800'
                : status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
          }`}
        >
          {status}
        </div>

        {/* Expand Icon */}
        <ArrowRight
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </button>

      {/* Step Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Block Description */}
          <p className="text-sm text-gray-700">{blockDef.description}</p>

          {/* Block Values */}
          {Object.keys(block.values).length > 0 && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-2">Configuration:</div>
              <div className="space-y-1">
                {Object.entries(block.values).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-gray-600">{key}:</span>{' '}
                    <span className="text-gray-900">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button for Manual Actions */}
          {isManualAction && status !== 'completed' && (
            <ActionButtonRenderer
              block={block}
              context={context}
              onExecute={onExecuteAction}
            />
          )}

          {/* Execution Result */}
          {status === 'completed' && block.executionResult && (
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="text-xs font-medium text-green-700 mb-2">Result:</div>
              <pre className="text-xs text-gray-700 overflow-auto max-h-40">
                {JSON.stringify(block.executionResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Error Message */}
          {status === 'failed' && block.executionError && (
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <div className="text-xs font-medium text-red-700 mb-2">Error:</div>
              <p className="text-xs text-red-600">{block.executionError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
