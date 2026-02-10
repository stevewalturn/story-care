'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { InstrumentTypeBadge } from './InstrumentTypeBadge';

type Instrument = {
  id: string;
  name: string;
  fullName: string;
  instrumentType: string;
  description: string | null;
  itemCount: number;
};

type NewAssessmentModalProps = {
  patientId: string;
  onClose: () => void;
  onCreated: (sessionId: string) => void;
};

const TIMEPOINT_OPTIONS = [
  { value: 'screening', label: 'Screening' },
  { value: 'baseline', label: 'Baseline' },
  { value: 'mid_treatment', label: 'Mid-Treatment' },
  { value: 'post_treatment', label: 'Post-Treatment' },
  { value: 'follow_up_1m', label: '1-Month Follow-up' },
  { value: 'follow_up_3m', label: '3-Month Follow-up' },
  { value: 'follow_up_6m', label: '6-Month Follow-up' },
  { value: 'follow_up_12m', label: '12-Month Follow-up' },
  { value: 'other', label: 'Other' },
];

export function NewAssessmentModal({ patientId, onClose, onCreated }: NewAssessmentModalProps) {
  const { user } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | null>(null);
  const [timepoint, setTimepoint] = useState('baseline');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchInstruments = async () => {
      try {
        const response = await authenticatedFetch('/api/assessment-instruments', user);
        if (response.ok) {
          const data = await response.json();
          setInstruments(data.instruments || []);
        }
      } catch (err) {
        console.error('Error fetching instruments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInstruments();
  }, [user]);

  const filteredInstruments = instruments.filter((i) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.name.toLowerCase().includes(q)
      || i.fullName.toLowerCase().includes(q)
      || i.instrumentType.toLowerCase().includes(q)
    );
  });

  const handleStart = async () => {
    if (!user?.uid || !selectedInstrumentId) return;
    setCreating(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        `/api/patients/${patientId}/assessments`,
        user,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instrumentId: selectedInstrumentId,
            timepoint,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create assessment');
      }

      const data = await response.json();
      onCreated(data.session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assessment');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">New Assessment</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search instruments..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Instrument List */}
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {loading
              ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  </div>
                )
              : filteredInstruments.length === 0
                ? (
                    <p className="py-4 text-center text-sm text-gray-500">No instruments found</p>
                  )
                : (
                    filteredInstruments.map(instrument => (
                      <button
                        key={instrument.id}
                        type="button"
                        onClick={() => setSelectedInstrumentId(instrument.id)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          selectedInstrumentId === instrument.id
                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{instrument.name}</span>
                            <InstrumentTypeBadge type={instrument.instrumentType} />
                          </div>
                          <span className="text-xs text-gray-500">
                            {instrument.itemCount}
                            {' '}
                            items
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{instrument.fullName}</p>
                        {instrument.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-gray-400">{instrument.description}</p>
                        )}
                      </button>
                    ))
                  )}
          </div>

          {/* Timepoint Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Timepoint</label>
            <select
              value={timepoint}
              onChange={e => setTimepoint(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {TIMEPOINT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={!selectedInstrumentId || creating}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {creating ? 'Starting...' : 'Start Assessment'}
          </button>
        </div>
      </div>
    </div>
  );
}
