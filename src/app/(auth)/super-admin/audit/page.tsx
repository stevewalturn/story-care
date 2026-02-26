/**
 * Super Admin Audit Logs Page
 * Security and access logs across the platform
 */

'use client';

import { ChevronLeft, ChevronRight, Search, Shield } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

type AuditLog = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  timestamp: string;
};

type AuditStats = {
  totalEvents: number;
  failedLogins: number;
  criticalEvents: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalEvents: 0,
    failedLogins: 0,
    criticalEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedResourceType, setSelectedResourceType] = useState('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
    end: new Date().toISOString().split('T')[0] || '',
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const idToken = await user?.getIdToken();

      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      params.append('startDate', dateRange.start);
      params.append('endDate', dateRange.end);

      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (selectedAction !== 'all') {
        params.append('action', selectedAction);
      }
      if (selectedResourceType !== 'all') {
        params.append('resourceType', selectedResourceType);
      }

      const response = await fetch(`/api/super-admin/audit?${params}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        setError('Failed to load audit logs');
      }
    } catch (err) {
      setError('Error loading audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, pagination.page, pagination.limit, searchQuery, selectedAction, selectedResourceType, dateRange]);

  useEffect(() => {
    if (user) {
      fetchAuditLogs();
    }
  }, [user, fetchAuditLogs]);

  const getActionBadge = (action: string) => {
    const styles = {
      auth_success: 'bg-green-100 text-green-700',
      auth_failed: 'bg-red-100 text-red-700',
      logout: 'bg-gray-100 text-gray-700',
      create: 'bg-blue-100 text-blue-700',
      read: 'bg-gray-100 text-gray-700',
      update: 'bg-yellow-100 text-yellow-700',
      delete: 'bg-red-100 text-red-700',
      export: 'bg-purple-100 text-purple-700',
    };

    const labels = {
      auth_success: 'Login',
      auth_failed: 'Failed Login',
      logout: 'Logout',
      create: 'Create',
      read: 'Read',
      update: 'Update',
      delete: 'Delete',
      export: 'Export',
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[action as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}
      >
        {labels[action as keyof typeof labels] || action}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-2 text-gray-600">
          Monitor security events and access logs across the platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">
            Total Events
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {stats.totalEvents.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            In selected date range
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Failed Logins</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {stats.failedLogins.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Security incidents
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Critical Events</h3>
          <p className="mt-2 text-3xl font-bold text-orange-600">
            {stats.criticalEvents.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Deletes and exports
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="min-w-[200px] flex-1">
          <div className="relative">
            <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search resource type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setPagination(prev => ({ ...prev, page: 1 }));
                  fetchAuditLogs();
                }
              }}
              className="pl-10"
            />
          </div>
        </div>

        <div className="w-48">
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="all">All Events</option>
            <option value="auth_success">Login</option>
            <option value="auth_failed">Failed Login</option>
            <option value="logout">Logout</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="export">Export</option>
          </select>
        </div>

        <div className="w-48">
          <select
            value={selectedResourceType}
            onChange={(e) => {
              setSelectedResourceType(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="all">All Resources</option>
            <option value="note">Note</option>
            <option value="session">Session</option>
            <option value="user">User</option>
            <option value="media">Media</option>
            <option value="quote">Quote</option>
            <option value="story_page">Story Page</option>
            <option value="scene">Scene</option>
            <option value="transcript">Transcript</option>
            <option value="reflection_response">Reflection Response</option>
            <option value="survey_response">Survey Response</option>
            <option value="auth">Auth</option>
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <span className="flex items-center text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setPagination(prev => ({ ...prev, page: 1 }));
            fetchAuditLogs();
          }}
        >
          Apply Filters
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading
              ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                )
              : logs.length === 0
                ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Shield className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          No audit logs found
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Try adjusting your filters or date range
                        </p>
                      </td>
                    </tr>
                  )
                : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {log.userName || 'Unknown'}
                            </div>
                            <div className="text-gray-500">
                              {log.userEmail || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {log.resourceType}
                          </div>
                          {log.resourceId && (
                            <div className="font-mono text-xs text-gray-500">
                              {log.resourceId.substring(0, 8)}
                              ...
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    ))
                  )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                variant="secondary"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing
                  {' '}
                  <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                  {' '}
                  to
                  {' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                  {' '}
                  of
                  {' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}
                  results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset">
                    Page
                    {' '}
                    {pagination.page}
                    {' '}
                    of
                    {' '}
                    {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start">
          <Shield className="mr-3 h-5 w-5 text-blue-600" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Audit Log Retention</p>
            <p className="mt-1">
              Audit logs are retained for 7 years in compliance with HIPAA regulations.
              All security events, user actions, and data access are logged automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
