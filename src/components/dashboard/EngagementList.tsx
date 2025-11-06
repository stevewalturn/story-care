'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

type Patient = {
  id: string;
  name: string;
  avatar?: string;
  pagesCount: number;
  surveysCount: number;
  reflectionsCount: number;
  sessionsCount: number;
  lastSeen: string;
  status: 'active' | 'at_risk' | 'inactive';
};

type EngagementListProps = {
  patients: Patient[];
};

export function EngagementList({ patients }: EngagementListProps) {
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    at_risk: 'bg-yellow-100 text-yellow-700',
    inactive: 'bg-gray-100 text-gray-700',
  };

  const statusLabels = {
    active: 'Active',
    at_risk: 'At Risk',
    inactive: 'Inactive',
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Patient Engagement</h2>
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div className="divide-y divide-gray-200">
        {filteredPatients.length === 0
          ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                {searchTerm ? 'No patients found' : 'No patients yet'}
              </div>
            )
          : (
              filteredPatients.map(patient => (
                <div key={patient.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPatient(expandedPatient === patient.id ? null : patient.id)}
                    className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex flex-1 items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                        <span className="text-sm font-medium text-gray-600">
                          {patient.avatar || patient.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[patient.status]}`}
                          >
                            {statusLabels[patient.status]}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {patient.pagesCount}
                            {' '}
                            pages
                          </span>
                          <span>•</span>
                          <span>
                            {patient.surveysCount}
                            {' '}
                            surveys
                          </span>
                          <span>•</span>
                          <span>
                            {patient.reflectionsCount}
                            {' '}
                            reflections
                          </span>
                          <span>•</span>
                          <span>
                            {patient.sessionsCount}
                            {' '}
                            sessions
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{patient.lastSeen}</p>
                      </div>
                      {expandedPatient === patient.id
                        ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          )
                        : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                    </div>
                  </button>

                  {expandedPatient === patient.id && (
                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="mb-2 text-xs font-medium text-gray-500">Pages</p>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-700">No recent pages</p>
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-medium text-gray-500">Survey Responses</p>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-700">No recent responses</p>
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-medium text-gray-500">Reflections</p>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-700">No recent reflections</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
      </div>
    </div>
  );
}
