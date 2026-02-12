'use client';

import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { InstrumentTypeBadge } from '@/components/assessments/InstrumentTypeBadge';
import { NewAssessmentModal } from '@/components/assessments/NewAssessmentModal';
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type AssessmentsTabProps = {
  patientId: string;
};

type AssessmentSession = {
  id: string;
  instrumentName: string;
  instrumentFullName: string;
  instrumentType: string;
  timepoint: string;
  status: string;
  totalScore: string | null;
  percentComplete: number;
  createdAt: string;
  completedAt: string | null;
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

export function AssessmentsTab({ patientId }: AssessmentsTabProps) {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAssessments = async () => {
    if (!user?.uid || !patientId) return;

    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `/api/patients/${patientId}/assessments`,
        user,
      );
      if (response.ok) {
        const data = await response.json();
        setAssessments(data.assessments || []);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [user, patientId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSessionCreated = (sessionId: string) => {
    setShowNewModal(false);
    // Navigate to the assessment form
    window.location.href = `/assessments/${sessionId}`;
  };

  const handleDelete = async () => {
    if (!user?.uid || !deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await authenticatedFetch(
        `/api/assessments/${deleteTarget}`,
        user,
        { method: 'DELETE' },
      );
      if (response.ok) {
        setDeleteTarget(null);
        fetchAssessments();
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <ClipboardList className="h-5 w-5 text-indigo-600" />
          Clinical Assessments
        </h3>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Assessment
        </button>
      </div>

      {/* Table */}
      {assessments.length === 0
        ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-3 text-sm font-medium text-gray-600">No assessments yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Click &quot;New Assessment&quot; to administer a clinical instrument
              </p>
            </div>
          )
        : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Assessment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Timepoint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {assessments.map(assessment => (
                    <tr
                      key={assessment.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        window.location.href = `/assessments/${assessment.id}`;
                      }}
                    >
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-700">
                        {formatDate(assessment.completedAt || assessment.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <InstrumentTypeBadge type={assessment.instrumentType} />
                          <span className="text-sm font-medium text-gray-900">
                            {assessment.instrumentName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-700">
                        {TIMEPOINT_LABELS[assessment.timepoint] ?? assessment.timepoint}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                        {assessment.status === 'completed' && assessment.totalScore != null
                          ? Number.parseFloat(assessment.totalScore).toFixed(0)
                          : (
                              <span className="text-gray-400">&mdash;</span>
                            )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assessment.status === 'completed'
                          ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Completed
                              </span>
                            )
                          : assessment.status === 'in_progress'
                            ? (
                                <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                                  In Progress
                                </span>
                              )
                            : (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                  Abandoned
                                </span>
                              )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {assessment.status === 'in_progress' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(assessment.id);
                            }}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete assessment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

      {/* New Assessment Modal */}
      {showNewModal && (
        <NewAssessmentModal
          patientId={patientId}
          onClose={() => setShowNewModal(false)}
          onCreated={handleSessionCreated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Assessment"
        message="Are you sure you want to delete this in-progress assessment? All responses will be permanently lost."
        isDeleting={isDeleting}
      />
    </div>
  );
}
