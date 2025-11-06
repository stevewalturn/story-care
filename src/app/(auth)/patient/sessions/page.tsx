/**
 * Patient Sessions Page
 * View therapy session history
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, User } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  sessionDate: string;
  duration: number;
  therapistName: string;
  notes: string | null;
}

export default function PatientSessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/sessions?patientView=true', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
        <p className="mt-2 text-gray-600">
          View your therapy session history
        </p>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            No sessions available
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Your therapy sessions will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {session.title}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(session.sessionDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>

                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {session.duration} minutes
                    </div>

                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {session.therapistName}
                    </div>
                  </div>

                  {session.notes && (
                    <div className="mt-4 rounded-lg bg-gray-50 p-4">
                      <p className="text-sm font-medium text-gray-700">
                        Session Notes
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {session.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start">
          <Calendar className="mr-3 h-5 w-5 text-blue-600" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Session Privacy</p>
            <p className="mt-1">
              Session recordings and transcripts are kept confidential between you and your therapist. Only basic session information is shown here for your reference.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
