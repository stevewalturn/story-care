/**
 * Super Admin Pending Invitations Page
 * Review and approve/reject user invitation requests
 */

'use client';

import { Check, ChevronLeft, ChevronRight, Search, UserCheck, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type PendingInvitation = {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string | null;
  organizationName: string | null;
  invitedBy: string | null;
  inviterName: string | null;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function PendingInvitationsPage() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Reject modal state
  const [rejectModalInvitation, setRejectModalInvitation] = useState<PendingInvitation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedRole !== 'all') params.append('role', selectedRole);

      const response = await authenticatedFetch(
        `/api/super-admin/pending-invitations?${params}`,
        user,
      );

      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
        setPagination(data.pagination);
        setError('');
      } else {
        setError('Failed to load pending invitations');
      }
    } catch {
      setError('Error loading pending invitations');
    } finally {
      setLoading(false);
    }
  }, [user, pagination.page, pagination.limit, searchQuery, selectedRole]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleApprove = async (invitation: PendingInvitation) => {
    if (!user) return;
    setProcessing(invitation.id);
    try {
      const response = await authenticatedFetch(
        `/api/super-admin/pending-invitations/${invitation.id}`,
        user,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'approve' }),
        },
      );

      if (response.ok) {
        setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to approve invitation');
      }
    } catch {
      setError('Error approving invitation');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!user || !rejectModalInvitation) return;
    setProcessing(rejectModalInvitation.id);
    try {
      const response = await authenticatedFetch(
        `/api/super-admin/pending-invitations/${rejectModalInvitation.id}`,
        user,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: 'reject',
            rejectionReason: rejectionReason || undefined,
          }),
        },
      );

      if (response.ok) {
        setInvitations(prev => prev.filter(inv => inv.id !== rejectModalInvitation.id));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        setRejectModalInvitation(null);
        setRejectionReason('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reject invitation');
      }
    } catch {
      setError('Error rejecting invitation');
    } finally {
      setProcessing(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      therapist: 'bg-green-100 text-green-700 border-green-200',
      patient: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    const labels: Record<string, string> = {
      therapist: 'Therapist',
      patient: 'Patient',
    };

    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[role] || styles.patient}`}
      >
        {labels[role] || role}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pending Invitations</h1>
        <p className="mt-2 text-gray-600">
          Review and approve user invitation requests
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-48">
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="therapist">Therapist</option>
            <option value="patient">Patient</option>
          </select>
        </div>
        <Button variant="primary" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
          <button type="button" onClick={() => setError('')} className="ml-2 font-medium underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Invitations Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Organization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Invited By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Submitted
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading
              ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                )
              : invitations.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">No pending invitations</p>
                        <p className="mt-1 text-xs text-gray-400">
                          All invitation requests have been processed
                        </p>
                      </td>
                    </tr>
                  )
                : invitations.map(invitation => (
                    <tr key={invitation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{invitation.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{invitation.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(invitation.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invitation.organizationName || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invitation.inviterName || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(invitation)}
                            disabled={processing === invitation.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectModalInvitation(invitation)}
                            disabled={processing === invitation.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && invitations.length > 0 && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
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
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectModalInvitation}
        onClose={() => {
          setRejectModalInvitation(null);
          setRejectionReason('');
        }}
        title="Reject Invitation"
        size="sm"
        hideFooter
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Reject the invitation request for
            {' '}
            <span className="font-medium">{rejectModalInvitation?.name}</span>
            {' '}
            (
            {rejectModalInvitation?.email}
            )?
          </p>
          <div>
            <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
              Reason (optional)
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Enter a reason for rejection..."
              rows={3}
              maxLength={1000}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setRejectModalInvitation(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleReject}
              disabled={processing === rejectModalInvitation?.id}
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing === rejectModalInvitation?.id ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
