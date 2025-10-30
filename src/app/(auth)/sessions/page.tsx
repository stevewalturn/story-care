'use client';

import type { SessionUploadData } from '@/components/sessions/UploadModal';
import { Filter, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SessionCard } from '@/components/sessions/SessionCard';
import { UploadModal } from '@/components/sessions/UploadModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

type Session = {
  id: string;
  title: string;
  date: string;
  type: 'individual' | 'group';
  patientName?: string;
  groupName?: string;
  sessionCount?: number;
};

export default function SessionsPage() {
  const { user } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sessions from API when user is available
  useEffect(() => {
    if (user?.uid) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/sessions?therapistId=${user.uid}`);
      const data = await response.json();

      if (response.ok) {
        const formattedSessions = data.sessions.map((session: any) => ({
          id: session.id,
          title: session.title,
          date: new Date(session.sessionDate).toLocaleDateString(),
          type: session.sessionType,
          patientName: session.patient?.name,
          groupName: session.group?.name,
          sessionCount: 1, // TODO: Calculate from database
        }));
        setSessions(formattedSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      session.title.toLowerCase().includes(searchLower)
      || session.patientName?.toLowerCase().includes(searchLower)
      || session.groupName?.toLowerCase().includes(searchLower)
    );
  });

  const handleUpload = async (data: SessionUploadData) => {
    if (!user?.uid) {
      alert('You must be logged in to upload sessions');
      return;
    }

    if (!data.audioUrl) {
      alert('Please wait for the file to finish uploading');
      return;
    }

    try {
      // File is already uploaded to GCS, use the provided audioUrl
      const sessionData = {
        therapistId: user.uid,
        title: data.title,
        sessionDate: data.sessionDate,
        sessionType: data.sessionType,
        patientId: data.patientId || null,
        groupId: data.groupId || null,
        audioUrl: data.audioUrl,
      };

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const { session } = await response.json();

      // Trigger transcription with Deepgram
      await fetch(`/api/sessions/${session.id}/transcribe`, {
        method: 'POST',
      });

      // Close modal and refresh sessions list
      setIsUploadModalOpen(false);
      await fetchSessions();

      // Navigate to speaker labeling page
      window.location.href = `/sessions/${session.id}/speakers`;
    } catch (error) {
      console.error('Error uploading session:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload session. Please try again.');
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete session');
      }

      // Refresh sessions list
      await fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete session. Please try again.');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="mt-1 text-gray-500">
            Upload and manage therapy session recordings
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsUploadModalOpen(true)}
        >
          <Plus className="mr-2 h-5 w-5" />
          New Session
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search sessions, patients, or groups..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Button variant="secondary">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Session Grid */}
      {isLoading
        ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              <p className="text-gray-500">Loading sessions...</p>
            </div>
          )
        : filteredSessions.length === 0
          ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {searchTerm ? 'No sessions found' : 'No sessions yet'}
                </h3>
                <p className="mb-6 text-gray-500">
                  {searchTerm
                    ? 'Try adjusting your search'
                    : 'Get started by uploading your first session'}
                </p>
                {!searchTerm && (
                  <Button
                    variant="primary"
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Upload First Session
                  </Button>
                )}
              </div>
            )
          : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredSessions.map(session => (
                  <SessionCard
                    key={session.id}
                    {...session}
                    onClick={() => {
                      window.location.href = `/sessions/${session.id}/transcript`;
                    }}
                    onDelete={() => handleDelete(session.id)}
                  />
                ))}
              </div>
            )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}
