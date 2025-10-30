'use client';

import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SessionCard } from '@/components/sessions/SessionCard';
import { UploadModal, type SessionUploadData } from '@/components/sessions/UploadModal';

export default function SessionsPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - will be replaced with real API
  const sessions = [
    {
      id: '1',
      title: '9/16 Chris & Jay',
      date: '10/08/2025',
      type: 'group' as const,
      groupName: 'Chris & Jay',
      sessionCount: 1,
    },
    {
      id: '2',
      title: 'Session with Jay',
      date: '09/15/2025',
      type: 'individual' as const,
      patientName: 'Jay',
      sessionCount: 3,
    },
    {
      id: '3',
      title: 'Session with Chris',
      date: '09/10/2025',
      type: 'individual' as const,
      patientName: 'Chris',
      sessionCount: 2,
    },
  ];

  const filteredSessions = sessions.filter((session) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      session.title.toLowerCase().includes(searchLower) ||
      session.patientName?.toLowerCase().includes(searchLower) ||
      session.groupName?.toLowerCase().includes(searchLower)
    );
  });

  const handleUpload = (data: SessionUploadData) => {
    console.log('Uploading session:', data);
    // TODO: Implement actual upload logic
    // 1. Upload audio file to GCS
    // 2. Create session record in database
    // 3. Trigger transcription with Deepgram
    // 4. Navigate to speaker labeling page
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
      {filteredSessions.length === 0 ? (
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
                // TODO: Navigate to session detail page
                console.log('Opening session:', session.id);
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
