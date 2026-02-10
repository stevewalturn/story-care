'use client';

import { Check, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AssessmentProgressBar } from '@/components/assessments/AssessmentProgressBar';
import { InstrumentTypeBadge } from '@/components/assessments/InstrumentTypeBadge';
import { QuestionStepper } from '@/components/assessments/QuestionStepper';
import { ScoreSummary } from '@/components/assessments/ScoreSummary';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type InstrumentItem = {
  id: string;
  itemNumber: number;
  questionText: string;
  itemType: string;
  scaleMin: number | null;
  scaleMax: number | null;
  scaleLabels: Record<string, string> | null;
  subscaleName: string | null;
};

type SessionData = {
  id: string;
  patientId: string;
  therapistId: string;
  status: string;
  timepoint: string;
  totalScore: string | null;
  subscaleScores: Record<string, number> | null;
  percentComplete: number;
  lastItemNumber: number | null;
  clinicianNotes: string | null;
  completedAt: string | null;
  instrument: {
    id: string;
    name: string;
    fullName: string;
    instrumentType: string;
    instructions: string | null;
    scaleMin: number;
    scaleMax: number;
    scaleLabels: Record<string, string> | null;
    totalScoreRange: { min: number; max: number } | null;
    clinicalCutoffs: Array<{ min: number; max: number; label: string; severity?: string }> | null;
    items: InstrumentItem[];
  };
  responses: Array<{
    id: string;
    itemId: string;
    responseNumeric: number | null;
  }>;
  patient: { id: string; name: string; email: string } | null;
  therapist: { id: string; name: string; email: string } | null;
};

type CompletionResult = {
  totalScore: string;
  subscaleScores: Record<string, number> | null;
  interpretation: string | null;
};

const TIMEPOINT_LABELS: Record<string, string> = {
  screening: 'Screening',
  baseline: 'Baseline',
  mid_treatment: 'Mid-Treatment',
  post_treatment: 'Post-Treatment',
  follow_up_1m: '1-Month Follow-up',
  follow_up_3m: '3-Month Follow-up',
  follow_up_6m: '6-Month Follow-up',
  follow_up_12m: '12-Month Follow-up',
  other: 'Other',
};

export default function ActiveAssessmentPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);

  // Fetch session data
  useEffect(() => {
    if (!user?.uid || !sessionId) return;

    const fetchSession = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/assessments/${sessionId}`, user);
        if (!response.ok) throw new Error('Failed to fetch assessment');

        const data = await response.json();
        setSession(data.session);

        // Restore existing answers
        const existingAnswers: Record<string, number> = {};
        for (const r of data.session.responses) {
          if (r.responseNumeric != null) {
            existingAnswers[r.itemId] = r.responseNumeric;
          }
        }
        setAnswers(existingAnswers);

        // If completed, show results
        if (data.session.status === 'completed') {
          setCompletionResult({
            totalScore: data.session.totalScore,
            subscaleScores: data.session.subscaleScores,
            interpretation: null, // Will be computed from cutoffs
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [user, sessionId]);

  // Auto-save a response
  const saveResponse = useCallback(async (itemId: string, value: number) => {
    if (!user?.uid || saving) return;
    setSaving(true);

    try {
      await authenticatedFetch(`/api/assessments/${sessionId}/responses`, user, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: [{ itemId, responseNumeric: value }],
        }),
      });
    } catch (err) {
      console.error('Error saving response:', err);
    } finally {
      setSaving(false);
    }
  }, [user, sessionId, saving]);

  const handleSelect = useCallback((itemId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [itemId]: value }));
    saveResponse(itemId, value);
  }, [saveResponse]);

  const handleComplete = async () => {
    if (!user?.uid || completing) return;
    setCompleting(true);

    try {
      const response = await authenticatedFetch(
        `/api/assessments/${sessionId}/complete`,
        user,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );

      if (!response.ok) throw new Error('Failed to complete assessment');

      const data = await response.json();
      setCompletionResult({
        totalScore: data.session.totalScore,
        subscaleScores: data.session.subscaleScores,
        interpretation: data.session.interpretation,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete assessment');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{error || 'Assessment not found'}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 text-sm text-indigo-600 hover:text-indigo-800"
        >
          Go back
        </button>
      </div>
    );
  }

  const items = session.instrument?.items || [];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount >= items.length;
  const isCompleted = session.status === 'completed' || completionResult != null;

  // Completed view
  if (isCompleted && completionResult) {
    const totalScore = Number.parseFloat(completionResult.totalScore);

    // Compute interpretation from cutoffs if not provided
    let interpretation = completionResult.interpretation;
    if (!interpretation && session.instrument?.clinicalCutoffs) {
      for (const cutoff of session.instrument.clinicalCutoffs) {
        if (totalScore >= cutoff.min && totalScore <= cutoff.max) {
          interpretation = cutoff.label;
          break;
        }
      }
    }

    return (
      <div>
        {/* Sticky sub-header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-2xl px-6 py-3">
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/patients/${session.patientId}`}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Patient
              </Link>
              <div className="h-4 w-px bg-gray-300" />
              <InstrumentTypeBadge type={session.instrument.instrumentType} />
              <span className="text-sm font-medium text-gray-900">{session.instrument.name}</span>
              <div className="h-4 w-px bg-gray-300" />
              <span className="text-xs text-gray-500">
                Timepoint:
                {' '}
                {TIMEPOINT_LABELS[session.timepoint]}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-2xl space-y-6 px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{session.instrument.fullName}</h1>
            </div>

            <div className="mb-6 flex items-center gap-4 text-sm text-gray-500">
              <span>
                Patient:
                {' '}
                {session.patient?.name}
              </span>
              <span>
                Timepoint:
                {' '}
                {TIMEPOINT_LABELS[session.timepoint]}
              </span>
            </div>

            <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
              <Check className="h-4 w-4" />
              Assessment Completed
            </div>

            <ScoreSummary
              totalScore={totalScore}
              totalScoreRange={session.instrument.totalScoreRange}
              subscaleScores={completionResult.subscaleScores}
              clinicalCutoffs={session.instrument.clinicalCutoffs}
              interpretation={interpretation}
            />
          </div>
        </div>
      </div>
    );
  }

  // Active form view
  return (
    <div>
      {/* Sticky sub-header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/patients/${session.patientId}`}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to History
            </Link>
            <div className="h-4 w-px bg-gray-300" />
            <InstrumentTypeBadge type={session.instrument.instrumentType} />
            <span className="text-sm font-medium text-gray-900">{session.instrument.name}</span>
            <div className="h-4 w-px bg-gray-300" />
            <span className="text-xs text-gray-500">
              Timepoint:
              {' '}
              {TIMEPOINT_LABELS[session.timepoint]}
            </span>
          </div>
          <div className="mt-2">
            <AssessmentProgressBar current={answeredCount} total={items.length} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-6 py-6">
        {/* Form card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Form header */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900">{session.instrument.fullName}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span>
                Patient:
                {' '}
                {session.patient?.name}
              </span>
              <span>
                Administered by:
                {' '}
                {session.therapist?.name}
              </span>
            </div>
          </div>

          {/* Instructions */}
          {session.instrument.instructions && (
            <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
              {session.instrument.instructions}
            </div>
          )}

          {/* All questions */}
          <div className="space-y-6">
            {items.map(item => (
              <QuestionStepper
                key={item.id}
                item={item}
                defaultScaleMin={session.instrument.scaleMin}
                defaultScaleMax={session.instrument.scaleMax}
                defaultScaleLabels={session.instrument.scaleLabels}
                selectedValue={answers[item.id] ?? null}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <span className="text-xs text-gray-400">
              {saving ? 'Saving...' : 'Auto-saved'}
            </span>

            {allAnswered
              ? (
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={completing}
                    className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    {completing ? 'Completing...' : 'Complete Assessment'}
                  </button>
                )
              : (
                  <div className="rounded-lg px-4 py-2 text-xs text-gray-400">
                    Answer all questions to complete
                  </div>
                )}
          </div>
        </div>
      </div>
    </div>
  );
}
