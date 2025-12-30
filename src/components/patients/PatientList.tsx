'use client';

import type { PatientReferenceImage } from '@/models/Schema';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, FileText, Filter, Mail, MessageSquare, Plus, Search, User, Video } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type Patient = {
  id: string;
  name: string;
  email: string;
  referenceImageUrl?: string;
  avatarUrl?: string;
  sessionCount: number;
  createdAt: string | Date;
  referenceImages?: PatientReferenceImage[];
  pageCount?: number;
  surveyCount?: number;
  reflectionCount?: number;
  status?: 'active' | 'invited' | 'inactive';
};

type PatientListProps = {
  patients: Patient[];
  onAddClick: () => void;
  onEditClick: (patient: Patient) => void;
  onDeleteClick: (patientId: string) => void;
};

export function PatientList({
  patients,
  onAddClick,
  onEditClick: _onEditClick,
  onDeleteClick: _onDeleteClick,
}: PatientListProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [hoveredPatientId, setHoveredPatientId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
    || patient.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Pagination calculations
  const totalItems = filteredPatients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

  const handleResendInvitation = async (patientId: string) => {
    setResendingId(patientId);
    setResendSuccess(null);
    try {
      const response = await authenticatedFetch(
        `/api/patients/${patientId}/resend-invitation`,
        user,
        { method: 'POST' },
      );
      if (response.ok) {
        setResendSuccess(patientId);
        setTimeout(() => setResendSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage patient profiles
          </p>
        </div>
        <Button variant="primary" onClick={onAddClick}>
          <Plus className="mr-2 h-5 w-5" />
          New Patient
        </Button>
      </div>

      {/* Patients Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Patients</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-48 pl-10"
              />
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardBody className="p-0">

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Pages</th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Surveys</th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Reflections</th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Sessions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedPatients.length === 0
                  ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <User className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            {searchQuery ? 'No patients found matching your search' : 'No patients yet'}
                          </p>
                        </td>
                      </tr>
                    )
                  : paginatedPatients.map((patient) => {
                      const status = patient.status || 'invited';
                      const isHovered = hoveredPatientId === patient.id;
                      const canResend = status === 'invited' && patient.email;

                      // Status badge styling
                      const getStatusBadge = () => {
                        if (status === 'active') {
                          return { bg: 'bg-green-50 text-green-700', label: 'Active' };
                        }
                        if (status === 'invited') {
                          return { bg: 'bg-amber-50 text-amber-700', label: 'Pending' };
                        }
                        return { bg: 'bg-gray-100 text-gray-600', label: 'Inactive' };
                      };
                      const statusBadge = getStatusBadge();

                      return (
                        <tr
                          key={patient.id}
                          className="hover:bg-gray-50"
                        >
                          {/* Name with Avatar */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {patient.avatarUrl || patient.referenceImageUrl
                                ? (
                                    <img
                                      src={patient.avatarUrl || patient.referenceImageUrl}
                                      alt={patient.name}
                                      className="h-10 w-10 rounded-full object-cover"
                                    />
                                  )
                                : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-sm font-medium text-white">
                                      {patient.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                  )}
                              <span className="font-medium text-gray-900">{patient.name}</span>
                            </div>
                          </td>

                          {/* Pages */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <BookOpen className="h-4 w-4 text-gray-400" />
                              <span>{patient.pageCount || 0}</span>
                            </div>
                          </td>

                          {/* Surveys */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span>{patient.surveyCount || 0}</span>
                            </div>
                          </td>

                          {/* Reflections */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <MessageSquare className="h-4 w-4 text-gray-400" />
                              <span>{patient.reflectionCount || 0}</span>
                            </div>
                          </td>

                          {/* Sessions */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Video className="h-4 w-4 text-gray-400" />
                              <span>{patient.sessionCount || 0}</span>
                            </div>
                          </td>

                          {/* Status with Resend Invitation on hover */}
                          <td
                            className="px-4 py-4 whitespace-nowrap"
                            onMouseEnter={() => setHoveredPatientId(patient.id)}
                            onMouseLeave={() => setHoveredPatientId(null)}
                          >
                            {canResend && isHovered && !resendSuccess
                              ? (
                                  <button
                                    type="button"
                                    onClick={() => handleResendInvitation(patient.id)}
                                    disabled={resendingId === patient.id}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50"
                                  >
                                    <Mail className="h-3 w-3" />
                                    {resendingId === patient.id ? 'Sending...' : 'Resend Invitation'}
                                  </button>
                                )
                              : resendSuccess === patient.id
                                ? (
                                    <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                      Invitation Sent!
                                    </span>
                                  )
                                : (
                                    <span
                                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.bg}`}
                                    >
                                      {statusBadge.label}
                                    </span>
                                  )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Link
                              href={`/admin/patients/${patient.id}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginatedPatients.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Result
                  {' '}
                  {startIndex + 1}
                  {' '}
                  -
                  {' '}
                  {endIndex}
                  {' '}
                  of
                  {' '}
                  {totalItems}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(4, totalPages) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-purple-50 text-purple-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {totalPages > 4 && (
                    <>
                      <span className="px-1 text-gray-400">...</span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(totalPages)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'bg-purple-50 text-purple-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
