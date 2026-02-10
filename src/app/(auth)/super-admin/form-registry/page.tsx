'use client';

import type { InstrumentStatus, InstrumentType } from '@/models/Schema';
import { FileCheck, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { InstrumentTypeBadge } from '@/components/assessments/InstrumentTypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type Instrument = {
  id: string;
  name: string;
  fullName: string;
  instrumentType: InstrumentType;
  itemCount: number;
  status: InstrumentStatus;
  createdAt: string;
};

const TYPE_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Types' },
  { value: 'ptsd', label: 'PTSD' },
  { value: 'depression', label: 'Depression' },
  { value: 'schizophrenia', label: 'Schizophrenia' },
  { value: 'substance_use', label: 'Substance Use' },
  { value: 'anxiety', label: 'Anxiety' },
  { value: 'enrollment', label: 'Enrollment' },
  { value: 'general', label: 'General' },
];

export default function FormRegistryPage() {
  const { user } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchInstruments = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (typeFilter) params.set('instrumentType', typeFilter);

      const response = await authenticatedFetch(
        `/api/super-admin/assessment-instruments?${params.toString()}`,
        user,
      );

      if (!response.ok) throw new Error('Failed to fetch instruments');
      const data = await response.json();
      setInstruments(data.instruments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch instruments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstruments();
  }, [user, searchQuery, typeFilter]);

  const toggleStatus = async (id: string, currentStatus: InstrumentStatus) => {
    if (!user?.uid) return;
    setTogglingId(id);

    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const response = await authenticatedFetch(
        `/api/super-admin/assessment-instruments/${id}`,
        user,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) throw new Error('Failed to update status');

      setInstruments(prev =>
        prev.map(i => (i.id === id ? { ...i, status: newStatus } : i)),
      );
    } catch (err) {
      console.error('Error toggling status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <FileCheck className="h-7 w-7 text-indigo-600" />
            Form Registry
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage clinical assessment instruments available to therapists
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-md min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search instruments..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        >
          {TYPE_FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading
        ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          )
        : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Form Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Instrument Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Added
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {instruments.length === 0
                    ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                            No instruments found. Run the seed script to add clinical assessments.
                          </td>
                        </tr>
                      )
                    : (
                        instruments.map(instrument => (
                          <tr key={instrument.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {instrument.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {instrument.fullName}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <InstrumentTypeBadge type={instrument.instrumentType} />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {instrument.itemCount}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => toggleStatus(instrument.id, instrument.status)}
                                disabled={togglingId === instrument.id}
                                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                                style={{
                                  backgroundColor: instrument.status === 'active' ? '#4F46E5' : '#D1D5DB',
                                }}
                              >
                                <span
                                  className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                                  style={{
                                    transform: instrument.status === 'active' ? 'translateX(20px)' : 'translateX(0px)',
                                  }}
                                />
                              </button>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatDate(instrument.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                </tbody>
              </table>
            </div>
          )}
    </div>
  );
}
