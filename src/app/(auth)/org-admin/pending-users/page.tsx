/**
 * Org Admin Pending Users Page
 * Approve or reject new user registrations
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { UserCheck, X, Check, Clock, User } from 'lucide-react';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: 'therapist' | 'patient';
  createdAt: string;
}

export default function PendingUsersPage() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPendingUsers();
    }
  }, [user]);

  const fetchPendingUsers = async () => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/users/pending', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data.users || []);
      } else {
        setError('Failed to load pending users');
      }
    } catch (err) {
      setError('Error loading pending users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        // Remove from pending list
        setPendingUsers(pendingUsers.filter(u => u.id !== userId));
      } else {
        alert('Failed to approve user');
      }
    } catch (err) {
      console.error(err);
      alert('Error approving user');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setProcessingId(userId);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/users/${userId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        // Remove from pending list
        setPendingUsers(pendingUsers.filter(u => u.id !== userId));
      } else {
        alert('Failed to reject user');
      }
    } catch (err) {
      console.error(err);
      alert('Error rejecting user');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pending Users</h1>
        <p className="mt-2 text-gray-600">
          Review and approve new user registrations
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Pending Users List */}
      {pendingUsers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            No pending users to review
          </p>
          <p className="mt-1 text-xs text-gray-400">
            New registration requests will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((pendingUser) => (
            <div
              key={pendingUser.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {pendingUser.name}
                  </h3>
                  <p className="text-sm text-gray-500">{pendingUser.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {pendingUser.role === 'therapist' ? 'Therapist' : 'Patient'}
                    </span>
                    <span className="flex items-center text-xs text-gray-500">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(pendingUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleReject(pendingUser.id)}
                  disabled={processingId === pendingUser.id}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleApprove(pendingUser.id)}
                  disabled={processingId === pendingUser.id}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
