'use client';

import { Calendar, Clock, ExternalLink, Filter, Link2, Loader2, Mic, Music, Play, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

type Recording = {
  id: string;
  source: 'direct' | 'share_link';
  title: string | null;
  recordedAt: string | null;
  totalDurationSeconds: number | null;
  totalFileSizeBytes: number | null;
  status: 'recording' | 'uploading' | 'completed' | 'failed' | 'used';
  sessionId: string | null;
  createdAt: string;
  audioUrl: string | null;
};

type RecordingLink = {
  id: string;
  token: string;
  sessionTitle: string | null;
  status: 'pending' | 'recording' | 'completed' | 'expired' | 'revoked';
  expiresAt: string;
  accessCount: number;
  createdAt: string;
  recording?: {
    id: string;
    status: string;
    totalDurationSeconds: number | null;
    createdAt: string;
  } | null;
};

export default function RecordingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [links, setLinks] = useState<RecordingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recordings' | 'links'>('recordings');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch recordings and links
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        const idToken = await user.getIdToken();

        // Fetch recordings
        const recordingsResponse = await fetch('/api/recordings', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (recordingsResponse.ok) {
          const data = await recordingsResponse.json();
          setRecordings(data.recordings);
        }

        // Fetch links
        const linksResponse = await fetch('/api/recording-links', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (linksResponse.ok) {
          const data = await linksResponse.json();
          setLinks(data.links);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Format duration
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '--';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'recording':
      case 'uploading':
        return 'bg-yellow-100 text-yellow-800';
      case 'used':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
      case 'revoked':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Create session from recording
  const handleCreateSession = async (recording: Recording) => {
    // Navigate to session creation with recording ID
    router.push(`/sessions/new?recordingId=${recording.id}`);
  };

  // Delete recording
  const handleDeleteRecording = async (recordingId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this recording?')) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/recordings/${recordingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (response.ok) {
        setRecordings(recordings.filter(r => r.id !== recordingId));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete recording');
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
      alert('Failed to delete recording');
    }
  };

  // Revoke link
  const handleRevokeLink = async (linkId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to revoke this link?')) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/recording-links/${linkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (response.ok) {
        setLinks(links.map(l => l.id === linkId ? { ...l, status: 'revoked' as const } : l));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to revoke link');
      }
    } catch (error) {
      console.error('Failed to revoke link:', error);
      alert('Failed to revoke link');
    }
  };

  // Copy link to clipboard
  const copyLinkToClipboard = (token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const url = `${baseUrl}/record/${token}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  // Filter recordings
  const filteredRecordings = statusFilter === 'all'
    ? recordings
    : recordings.filter(r => r.status === statusFilter);

  // Filter links
  const filteredLinks = statusFilter === 'all'
    ? links
    : links.filter(l => l.status === statusFilter);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recordings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage voice recordings and shareable recording links
          </p>
        </div>
        <Button variant="primary" onClick={() => router.push('/sessions/recordings/new')}>
          <Mic className="mr-2 h-4 w-4" />
          New Recording
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('recordings')}
            className={`border-b-2 px-1 pb-4 text-sm font-medium ${
              activeTab === 'recordings'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Mic className="mr-2 inline-block h-4 w-4" />
            Recordings
            {recordings.length > 0 && (
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                {recordings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`border-b-2 px-1 pb-4 text-sm font-medium ${
              activeTab === 'links'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Link2 className="mr-2 inline-block h-4 w-4" />
            Recording Links
            {links.length > 0 && (
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                {links.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Filter */}
      <div className="mb-6 flex items-center gap-4">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          {activeTab === 'recordings'
            ? (
                <>
                  <option value="completed">Completed</option>
                  <option value="recording">Recording</option>
                  <option value="uploading">Uploading</option>
                  <option value="used">Used</option>
                  <option value="failed">Failed</option>
                </>
              )
            : (
                <>
                  <option value="pending">Pending</option>
                  <option value="recording">Recording</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                </>
              )}
        </select>
      </div>

      {/* Recordings List */}
      {activeTab === 'recordings' && (
        <div className="space-y-4">
          {filteredRecordings.length === 0
            ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center">
                  <Mic className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-500">No recordings found</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Click "New Recording" to start recording
                  </p>
                </div>
              )
            : (
                filteredRecordings.map(recording => (
                  <div
                    key={recording.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                            <Music className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {recording.title || 'Untitled Recording'}
                            </h3>
                            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDuration(recording.totalDurationSeconds)}
                              </span>
                              <span>{formatFileSize(recording.totalFileSizeBytes)}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(recording.createdAt)}
                              </span>
                              {recording.source === 'share_link' && (
                                <span className="flex items-center gap-1 text-purple-600">
                                  <Link2 className="h-4 w-4" />
                                  via link
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(recording.status)}`}>
                          {recording.status}
                        </span>

                        {recording.status === 'completed' && (
                          <>
                            {recording.audioUrl && (
                              <button
                                onClick={() => window.open(recording.audioUrl!, '_blank')}
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                title="Play"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                            )}
                            <Button
                              variant="primary"
                              onClick={() => handleCreateSession(recording)}
                              className="text-sm"
                            >
                              Create Session
                            </Button>
                          </>
                        )}

                        {recording.status === 'used' && recording.sessionId && (
                          <Button
                            variant="secondary"
                            onClick={() => router.push(`/sessions/${recording.sessionId}/transcript`)}
                            className="text-sm"
                          >
                            View Session
                          </Button>
                        )}

                        {recording.status !== 'used' && (
                          <button
                            onClick={() => handleDeleteRecording(recording.id)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
        </div>
      )}

      {/* Links List */}
      {activeTab === 'links' && (
        <div className="space-y-4">
          {filteredLinks.length === 0
            ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center">
                  <Link2 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-500">No recording links found</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Create a shareable link when starting a new session
                  </p>
                </div>
              )
            : (
                filteredLinks.map(link => (
                  <div
                    key={link.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            link.status === 'completed' ? 'bg-green-100' : 'bg-purple-100'
                          }`}
                          >
                            <Link2 className={`h-5 w-5 ${
                              link.status === 'completed' ? 'text-green-600' : 'text-purple-600'
                            }`}
                            />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {link.sessionTitle || 'Untitled Session'}
                            </h3>
                            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(link.createdAt)}
                              </span>
                              {link.status !== 'completed' && link.status !== 'revoked' && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  Expires
                                  {' '}
                                  {formatDate(link.expiresAt)}
                                </span>
                              )}
                              {link.accessCount > 0 && (
                                <span>
                                  Accessed
                                  {' '}
                                  {link.accessCount}
                                  x
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Show recording info if completed */}
                        {link.recording && (
                          <div className="mt-2 ml-13 rounded-lg bg-gray-50 p-2 text-sm">
                            <span className="text-gray-500">Recording: </span>
                            <span className="font-medium">
                              {formatDuration(link.recording.totalDurationSeconds)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(link.status)}`}>
                          {link.status}
                        </span>

                        {link.status === 'pending' && (
                          <>
                            <button
                              onClick={() => copyLinkToClipboard(link.token)}
                              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              title="Copy Link"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRevokeLink(link.id)}
                              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Revoke"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {link.status === 'completed' && link.recording && (
                          <Button
                            variant="primary"
                            onClick={() => {
                              // Navigate to create session from recording
                              router.push(`/sessions/new?recordingId=${link.recording!.id}`);
                            }}
                            className="text-sm"
                          >
                            Create Session
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
        </div>
      )}
    </div>
  );
}
