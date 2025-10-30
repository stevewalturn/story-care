'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SessionCard } from '@/components/sessions/SessionCard';
import { UploadModal, type SessionUploadData } from '@/components/sessions/UploadModal';
import { useAuth } from '@/contexts/AuthContext';

interface Session {
  id: string;
  title: string;
  date: string;
  type: 'individual' | 'group';
  patientName?: string;
  groupName?: string;
  sessionCount?: number;
}

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
    if (!user?.uid) return;

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
      session.title.toLowerCase().includes(searchLower) ||
      session.patientName?.toLowerCase().includes(searchLower) ||
      session.groupName?.toLowerCase().includes(searchLower)
    );
  });

  const handleUpload = async (data: SessionUploadData) => {
    if (!user?.uid) {
      alert('You must be logged in to upload sessions');
      return;
    }

    try {
      // 1. Upload audio file to GCS (if audioFile exists)
      let audioUrl = '';
      if (data.audioFile) {
        const formData = new FormData();
        formData.append('file', data.audioFile);
        formData.append('sessionId', `temp-${Date.now()}`);

        const uploadResponse = await fetch('/api/sessions/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload audio file');
        }

        const uploadData = await uploadResponse.json();
        audioUrl = uploadData.url;
      }

      // 2. Create session record in database
      const sessionData = {
        therapistId: user.uid,
        title: data.title,
        sessionDate: data.sessionDate,
        sessionType: data.sessionType,
        patientId: data.patientId || null,
        groupId: data.groupId || null,
        audioUrl,
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

      // 3. Trigger transcription with Deepgram
      await fetch(`/api/sessions/${session.id}/transcribe`, {
        method: 'POST',
      });

      // 4. Close modal and refresh sessions list
      setIsUploadModalOpen(false);
      await fetchSessions();

      // 5. Navigate to speaker labeling page
      window.location.href = `/sessions/${session.id}/speakers`;
    } catch (error) {
      console.error('Error uploading session:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload session. Please try again.');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-500 mt-1">
            Upload and manage therapy session recordings
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsUploadModalOpen(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          New Session
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search sessions, patients, or groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button variant="secondary">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Session Grid */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Loading sessions...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No sessions found' : 'No sessions yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? 'Try adjusting your search'
              : 'Get started by uploading your first session'}
          </p>
          {!searchTerm && (
            <Button
              variant="primary"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Upload First Session
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              {...session}
              onClick={() => {
                window.location.href = `/sessions/${session.id}/transcript`;
              }}
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
