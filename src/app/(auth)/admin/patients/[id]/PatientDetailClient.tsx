'use client';

import { Book, Calendar, MessageCircle, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { AssessmentsTab } from './tabs/AssessmentsTab';
import { GeneralInformationTab } from './tabs/GeneralInformationTab';
import { PagesTab } from './tabs/PagesTab';
import { ReflectionsTab } from './tabs/ReflectionsTab';
import { SessionsTab } from './tabs/SessionsTab';
import { SurveyResponsesTab } from './tabs/SurveyResponsesTab';

type Tab = 'sessions' | 'pages' | 'survey-responses' | 'reflections' | 'assessments' | 'general-info';

type PatientDetailClientProps = {
  patientId: string;
};

type Patient = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  referenceImageUrl?: string;
  pageCount: number;
  surveyCount: number;
  reflectionCount: number;
  sessionCount: number;
};

export function PatientDetailClient({ patientId }: PatientDetailClientProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch patient data from API
  useEffect(() => {
    if (!user?.uid || !patientId) return;

    const fetchPatient = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/patients/${patientId}`, user);
        if (!response.ok) {
          throw new Error('Failed to fetch patient');
        }
        const data = await response.json();

        // Transform API response to component format
        // Note: counts are returned at top level, not inside patient object
        setPatient({
          id: data.patient.id,
          name: data.patient.name,
          firstName: data.patient.name.split(' ')[0] || '',
          lastName: data.patient.name.split(' ').slice(1).join(' ') || '',
          avatar: data.patient.avatarUrl || data.patient.referenceImageUrl,
          referenceImageUrl: data.patient.referenceImageUrl,
          pageCount: data.pageCount || 0,
          surveyCount: data.surveyCount || 0,
          reflectionCount: data.reflectionCount || 0,
          sessionCount: data.sessionCount || 0,
        });
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError(err instanceof Error ? err.message : 'Failed to load patient');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [user, patientId]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-gray-500">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-8">
        <div className="py-16 text-center">
          <p className="text-red-600">{error || 'Patient not found'}</p>
          <Link href="/admin/patients">
            <Button variant="secondary" className="mt-4">
              Back to Patients
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'sessions', label: 'Sessions' },
    { id: 'pages', label: 'Pages' },
    { id: 'survey-responses', label: 'Survey Responses' },
    { id: 'reflections', label: 'Reflections' },
    { id: 'assessments', label: 'Assessments' },
    { id: 'general-info', label: 'General Information' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Patient Header */}
      <div className="bg-white px-8 py-6">
        <div className="flex items-start gap-4">
          {/* Avatar - 80px to match Figma */}
          {patient.avatar ? (
            <img
              src={patient.avatar}
              alt={patient.name}
              className="h-20 w-20 rounded-full bg-gray-100 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-2xl font-semibold text-purple-600">
              {patient.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="flex-1">
            <h1 className="mb-2 text-xl font-semibold text-gray-900">{patient.name}</h1>

            {/* Stats - Figma style with icons and separators */}
            <div className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Book className="h-4 w-4" />
                <span>
                  {patient.pageCount}
                  {' '}
                  {patient.pageCount === 1 ? 'Page' : 'Pages'}
                </span>
              </div>
              <span className="mx-2 text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <SlidersHorizontal className="h-4 w-4" />
                <span>
                  {patient.surveyCount}
                  {' '}
                  {patient.surveyCount === 1 ? 'Survey' : 'Surveys'}
                </span>
              </div>
              <span className="mx-2 text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>
                  {patient.reflectionCount}
                  {' '}
                  Reflections
                </span>
              </div>
              <span className="mx-2 text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {patient.sessionCount}
                  {' '}
                  Sessions
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation - Text only, no icons */}
      <div className="border-b border-gray-200 bg-white px-8">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white px-8 py-6">
        {activeTab === 'sessions' && <SessionsTab patientId={patientId} />}
        {activeTab === 'pages' && <PagesTab patientId={patientId} />}
        {activeTab === 'survey-responses' && <SurveyResponsesTab patientId={patientId} />}
        {activeTab === 'reflections' && <ReflectionsTab patientId={patientId} />}
        {activeTab === 'assessments' && <AssessmentsTab patientId={patientId} />}
        {activeTab === 'general-info' && <GeneralInformationTab patientId={patientId} />}
      </div>
    </div>
  );
}
