import { setRequestLocale } from 'next-intl/server';
import { Users, FileText, BarChart3, MessageSquare } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ResponseTable } from '@/components/dashboard/ResponseTable';
import { EngagementList } from '@/components/dashboard/EngagementList';

export default async function DashboardPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  // Mock data - will be replaced with real API calls
  const metrics = {
    activePatients: 8,
    publishedPages: 1,
    surveyResponses: 3,
    writtenReflections: 3,
  };

  const recentReflections = [
    {
      id: '1',
      patient: 'test4',
      question: 'what color',
      response: '"works"',
      page: 'Unknown Page',
      timestamp: 'about 2 months ago',
    },
    {
      id: '2',
      patient: 'test4',
      question: 'how big',
      response: '"very cool"',
      page: 'Unknown Page',
      timestamp: 'about 2 months ago',
    },
    {
      id: '3',
      patient: 'test4',
      question: 'something else',
      response: '"give it 7"',
      page: 'Unknown Page',
      timestamp: 'about 2 months ago',
    },
  ];

  const recentSurveys = [
    {
      id: '1',
      patient: 'test4',
      question: 'How much do you relate to this?',
      response: '4',
      page: 'Unknown Page',
      timestamp: 'about 2 months ago',
    },
    {
      id: '2',
      patient: 'test4',
      question: 'How much do you relate to this?',
      response: '3',
      page: 'Unknown Page',
      timestamp: 'about 2 months ago',
    },
    {
      id: '3',
      patient: 'pedro',
      question: 'What primary emotion did you experience?',
      response: 'Confusion',
      page: 'Unknown Page',
      timestamp: 'about 2 months ago',
    },
  ];

  const patients = [
    {
      id: '1',
      name: 'pedro',
      pagesCount: 2,
      surveysCount: 1,
      reflectionsCount: 0,
      sessionsCount: 1,
      lastSeen: 'Last seen: Aug 8, 2025',
      status: 'active' as const,
    },
    {
      id: '2',
      name: 'kid',
      pagesCount: 0,
      surveysCount: 0,
      reflectionsCount: 0,
      sessionsCount: 0,
      lastSeen: 'Never active',
      status: 'inactive' as const,
    },
    {
      id: '3',
      name: 'test4',
      pagesCount: 0,
      surveysCount: 2,
      reflectionsCount: 3,
      sessionsCount: 0,
      lastSeen: 'Last seen: 2 months ago',
      status: 'active' as const,
    },
    {
      id: '4',
      name: 'francisco',
      pagesCount: 0,
      surveysCount: 0,
      reflectionsCount: 0,
      sessionsCount: 0,
      lastSeen: 'Never active',
      status: 'inactive' as const,
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, Noah Hendler
        </h1>
        <p className="text-gray-500 mt-1">
          Monitor your patients' engagement with their therapeutic content.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          label="Active Patients"
          value={metrics.activePatients}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <MetricCard
          icon={<FileText className="w-6 h-6" />}
          label="Published Pages"
          value={metrics.publishedPages}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <MetricCard
          icon={<BarChart3 className="w-6 h-6" />}
          label="Survey Responses"
          value={metrics.surveyResponses}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <MetricCard
          icon={<MessageSquare className="w-6 h-6" />}
          label="Written Reflections"
          value={metrics.writtenReflections}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
      </div>

      {/* Recent Reflection Responses */}
      <ResponseTable
        title="Recent Reflection Responses"
        responses={recentReflections}
        type="reflection"
      />

      {/* Recent Survey Responses */}
      <ResponseTable
        title="Recent Survey Responses"
        responses={recentSurveys}
        type="survey"
      />

      {/* Patient Engagement */}
      <EngagementList patients={patients} />
    </div>
  );
}
