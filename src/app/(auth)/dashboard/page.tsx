'use client';

import { Calendar, FileText, MessageCircle, TrendingUp, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ContinueYourWork } from '@/components/dashboard/ContinueYourWork';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ReflectionResponsesTable } from '@/components/dashboard/ReflectionResponsesTable';
import { SurveyResponsesTable } from '@/components/dashboard/SurveyResponsesTable';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import 'react-day-picker/dist/style.css';

type DashboardStats = {
  activePatients: number;
  publishedPages: number;
  surveyResponses: number;
  writtenReflections: number;
};

type ReflectionResponse = {
  id: string;
  patient: {
    name: string;
    avatar?: string;
    initials: string;
  };
  question: string;
  response: string;
  page: string;
  when: string;
};

type SurveyResponse = {
  id: string;
  patient: {
    name: string;
    avatar?: string;
    initials: string;
  };
  question: string;
  response: string | number;
  page: string;
  when: string;
};

type RecentSession = {
  id: string;
  title: string;
  groupName?: string;
  participants: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
    initials: string;
  }>;
  timeAgo: string;
};

export default function DashboardPage() {
  const { user, dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reflectionResponses, setReflectionResponses] = useState<ReflectionResponse[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [responsesLoading, setResponsesLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Date picker states
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const startDateButtonRef = useRef<HTMLButtonElement>(null);
  const endDateButtonRef = useRef<HTMLButtonElement>(null);
  const [startDatePickerPos, setStartDatePickerPos] = useState({ top: 0, left: 0 });
  const [endDatePickerPos, setEndDatePickerPos] = useState({ top: 0, left: 0 });

  // Redirect non-therapists to their role-specific dashboard
  useEffect(() => {
    if (!authLoading && dbUser?.role) {
      if (dbUser.role === 'super_admin') {
        router.push('/super-admin/dashboard');
      } else if (dbUser.role === 'org_admin') {
        router.push('/org-admin/dashboard');
      } else if (dbUser.role === 'patient') {
        router.push('/patient/story');
      }
      // Therapists stay on this page
    }
  }, [dbUser, authLoading, router]);

  // Fetch dashboard stats when user is available or dates change
  useEffect(() => {
    if (user?.uid) {
      fetchStats();
      fetchRecentResponses();
      fetchRecentSessions();
    }
  }, [user, startDate, endDate]);

  // Calculate position for date pickers when they open
  useEffect(() => {
    if (showStartDatePicker && startDateButtonRef.current) {
      const rect = startDateButtonRef.current.getBoundingClientRect();
      const dropdownWidth = 300;
      let left = rect.right - dropdownWidth;
      if (left < 16) left = 16;
      setStartDatePickerPos({ top: rect.bottom + 8, left });
    }
  }, [showStartDatePicker]);

  useEffect(() => {
    if (showEndDatePicker && endDateButtonRef.current) {
      const rect = endDateButtonRef.current.getBoundingClientRect();
      const dropdownWidth = 300;
      let left = rect.right - dropdownWidth;
      if (left < 16) left = 16;
      setEndDatePickerPos({ top: rect.bottom + 8, left });
    }
  }, [showEndDatePicker]);

  // Click outside handler to close date pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideStart = !startDateButtonRef.current?.contains(target);
      const isOutsideEnd = !endDateButtonRef.current?.contains(target);
      const clickedElement = event.target as HTMLElement;
      const isInsideDropdown = clickedElement.closest('.fixed.z-50');

      if (isOutsideStart && isOutsideEnd && !isInsideDropdown) {
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStats = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setLoading(true);
      const dateParams = buildDateParams();
      const url = `/api/dashboard/stats${dateParams ? `?${dateParams}` : ''}`;
      const response = await authenticatedFetch(url, user);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentResponses = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setResponsesLoading(true);
      const dateParams = buildDateParams();
      const url = `/api/dashboard/recent-responses?limit=3${dateParams ? `&${dateParams}` : ''}`;
      const response = await authenticatedFetch(url, user);
      if (response.ok) {
        const data = await response.json();

        // Transform reflection responses
        const transformedReflections: ReflectionResponse[] = data.reflections.map((r: any) => ({
          id: r.id,
          patient: {
            name: r.patientName || 'Unknown',
            initials: getInitials(r.patientName || 'Unknown'),
          },
          question: r.questionText || 'No question',
          response: r.response || '',
          page: r.pageTitle || 'Unknown Page',
          when: formatRelativeTime(r.createdAt),
        }));

        // Transform survey responses
        const transformedSurveys: SurveyResponse[] = data.surveys.map((s: any) => ({
          id: s.id,
          patient: {
            name: s.patientName || 'Unknown',
            initials: getInitials(s.patientName || 'Unknown'),
          },
          question: s.questionText || 'No question',
          response: s.responseNumeric || s.response || '',
          page: s.pageTitle || 'Unknown Page',
          when: formatRelativeTime(s.createdAt),
        }));

        setReflectionResponses(transformedReflections);
        setSurveyResponses(transformedSurveys);
      } else {
        console.error('Failed to fetch recent responses');
      }
    } catch (error) {
      console.error('Error fetching recent responses:', error);
    } finally {
      setResponsesLoading(false);
    }
  };

  const fetchRecentSessions = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setSessionsLoading(true);
      const dateParams = buildDateParams();
      const url = `/api/sessions?limit=3&sort=updatedAt${dateParams ? `&${dateParams}` : ''}`;
      const response = await authenticatedFetch(url, user);
      if (response.ok) {
        const data = await response.json();

        const transformedSessions: RecentSession[] = (data.sessions || []).map((s: any) => ({
          id: s.id,
          title: s.title,
          groupName: s.group?.name,
          participants: (s.patients || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatarUrl,
            initials: getInitials(p.name),
          })),
          timeAgo: formatRelativeTime(s.updatedAt || s.createdAt),
        }));

        setRecentSessions(transformedSessions);
      } else {
        console.error('Failed to fetch recent sessions');
      }
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Date picker toggle handlers
  const toggleStartDatePicker = () => {
    setShowEndDatePicker(false);
    setShowStartDatePicker(!showStartDatePicker);
  };

  const toggleEndDatePicker = () => {
    setShowStartDatePicker(false);
    setShowEndDatePicker(!showEndDatePicker);
  };

  // Build date query params helper
  const buildDateParams = (): string => {
    const params = new URLSearchParams();
    if (startDate) {
      const dateStr = startDate.toISOString().split('T')[0];
      if (dateStr) params.set('startDate', dateStr);
    }
    if (endDate) {
      const dateStr = endDate.toISOString().split('T')[0];
      if (dateStr) params.set('endDate', dateStr);
    }
    return params.toString();
  };

  // Helper functions
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatRelativeTime = (dateString: string | Date): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInYears > 0) {
      return `about ${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    }
    if (diffInMonths > 0) {
      return `about ${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }
    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    return 'just now';
  };

  const metrics = [
    {
      label: 'Active Patients',
      value: stats?.activePatients?.toString() || '0',
      icon: <Users className="h-4 w-4" />,
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      change: 36,
      changeType: 'increase' as const,
    },
    {
      label: 'Published Pages',
      value: stats?.publishedPages?.toString() || '0',
      icon: <FileText className="h-4 w-4" />,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      change: 14,
      changeType: 'decrease' as const,
    },
    {
      label: 'Survey Responses',
      value: stats?.surveyResponses?.toString() || '0',
      icon: <TrendingUp className="h-4 w-4" />,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      change: 36,
      changeType: 'increase' as const,
    },
    {
      label: 'Written Reflections',
      value: stats?.writtenReflections?.toString() || '0',
      icon: <MessageCircle className="h-4 w-4" />,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      change: 36,
      changeType: 'increase' as const,
    },
  ];

  // Get user's display name or email
  const userName = user?.displayName || user?.email?.split('@')[0] || 'there';

  if (loading) {
    return (
      <div className="p-8">
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header Section - matches Figma Dashboard.png */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Hey
            {' '}
            {userName}
            ,
          </h1>
          <p className="text-sm text-gray-500">Let's see what is happening today</p>
        </div>
        {/* Date Range Picker */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5">
          <Calendar className="h-4 w-4 text-gray-500" />
          {/* Start Date Button */}
          <div className="flex items-center">
            <button
              ref={startDateButtonRef}
              type="button"
              onClick={toggleStartDatePicker}
              className="rounded px-2 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              {startDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Start Date'}
            </button>
            {startDate && (
              <button
                type="button"
                onClick={() => setStartDate(undefined)}
                className="ml-1 rounded-full p-0.5 hover:bg-gray-200"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            )}
          </div>
          <span className="text-gray-400">→</span>
          {/* End Date Button */}
          <div className="flex items-center">
            <button
              ref={endDateButtonRef}
              type="button"
              onClick={toggleEndDatePicker}
              className="rounded px-2 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              {endDate ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'End Date'}
            </button>
            {endDate && (
              <button
                type="button"
                onClick={() => setEndDate(undefined)}
                className="ml-1 rounded-full p-0.5 hover:bg-gray-200"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Start Date Picker Dropdown */}
        {showStartDatePicker && (
          <div
            className="fixed z-50 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
            style={{ top: startDatePickerPos.top, left: startDatePickerPos.left }}
          >
            <DayPicker
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                setStartDate(date);
                setShowStartDatePicker(false);
              }}
              disabled={endDate ? { after: endDate } : undefined}
            />
          </div>
        )}

        {/* End Date Picker Dropdown */}
        {showEndDatePicker && (
          <div
            className="fixed z-50 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
            style={{ top: endDatePickerPos.top, left: endDatePickerPos.left }}
          >
            <DayPicker
              mode="single"
              selected={endDate}
              onSelect={(date) => {
                setEndDate(date);
                setShowEndDatePicker(false);
              }}
              disabled={startDate ? { before: startDate } : undefined}
            />
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(metric => (
          <MetricCard
            key={metric.label}
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            iconBg={metric.iconBg}
            iconColor={metric.iconColor}
            change={metric.change}
            changeType={metric.changeType}
          />
        ))}
      </div>

      {/* Continue Your Work - Recent Sessions */}
      <ContinueYourWork
        sessions={recentSessions}
        loading={sessionsLoading}
      />

      {/* Recent Reflection Responses */}
      <div className="mb-6">
        <ReflectionResponsesTable
          responses={reflectionResponses}
          loading={responsesLoading}
        />
      </div>

      {/* Recent Survey Responses */}
      <div className="mb-6">
        <SurveyResponsesTable
          responses={surveyResponses}
          loading={responsesLoading}
        />
      </div>
    </div>
  );
}
