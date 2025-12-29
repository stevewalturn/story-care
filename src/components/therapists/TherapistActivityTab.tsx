/**
 * Therapist Activity Tab Component
 * Displays HIPAA-compliant audit log of therapist actions
 */

'use client';

import { Activity, Calendar, Clock, FileText } from 'lucide-react';
import { useState } from 'react';

type AuditLogEntry = {
  id: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'auth_success' | 'auth_failed' | 'logout';
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: string;
  metadata?: any;
};

type TherapistActivityTabProps = {
  activityLog: AuditLogEntry[];
};

const actionLabels: Record<string, string> = {
  create: 'Created',
  read: 'Viewed',
  update: 'Updated',
  delete: 'Deleted',
  export: 'Exported',
  auth_success: 'Logged in',
  auth_failed: 'Failed login',
  logout: 'Logged out',
};

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  read: 'bg-blue-100 text-blue-700',
  update: 'bg-yellow-100 text-yellow-700',
  delete: 'bg-red-100 text-red-700',
  export: 'bg-purple-100 text-purple-700',
  auth_success: 'bg-green-100 text-green-700',
  auth_failed: 'bg-red-100 text-red-700',
  logout: 'bg-gray-100 text-gray-700',
};

export function TherapistActivityTab({ activityLog }: TherapistActivityTabProps) {
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredActivity = activityLog.filter(
    entry => filterAction === 'all' || entry.action === filterAction,
  );

  if (activityLog.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <Activity className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No activity logged</h3>
        <p className="mt-1 text-sm text-gray-500">
          No activity has been recorded for this therapist yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterAction('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filterAction === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Activity
        </button>
        <button
          type="button"
          onClick={() => setFilterAction('auth_success')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filterAction === 'auth_success'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Logins
        </button>
        <button
          type="button"
          onClick={() => setFilterAction('read')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filterAction === 'read'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Patient Access
        </button>
        <button
          type="button"
          onClick={() => setFilterAction('export')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filterAction === 'export'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Data Exports
        </button>
      </div>

      {/* Activity Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Timestamp
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Action
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Resource
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                IP Address
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredActivity.length === 0
              ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-sm text-gray-500">No activity found for selected filter</p>
                    </td>
                  </tr>
                )
              : (
                  filteredActivity.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                            {new Date(entry.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="mr-1 h-3 w-3" />
                            {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            actionColors[entry.action] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {actionLabels[entry.action] || entry.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-gray-400" />
                          <span className="capitalize">{entry.resourceType}</span>
                        </div>
                        {entry.resourceId && (
                          <div className="mt-1 font-mono text-xs text-gray-500">
                            {entry.resourceId.substring(0, 8)}
                            ...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm whitespace-nowrap text-gray-500">
                        {entry.ipAddress || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate" title={entry.userAgent || ''}>
                          {entry.userAgent || 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing
            {' '}
            {filteredActivity.length}
            {' '}
            of
            {' '}
            {activityLog.length}
            {' '}
            activity entries
          </p>
          <p className="text-xs text-gray-500">
            HIPAA-compliant audit log • Retained for 7 years
          </p>
        </div>
      </div>
    </div>
  );
}
