'use client';

import { CheckSquare } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

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

type SurveyResponsesTableProps = {
  responses: SurveyResponse[];
  loading?: boolean;
};

export function SurveyResponsesTable({ responses, loading = false }: SurveyResponsesTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Survey Responses</h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading responses...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (responses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Survey Responses</h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="py-8 text-center">
            <CheckSquare className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm text-gray-500">No survey responses yet</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Survey Responses</h2>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  When
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {responses.map(response => (
                <tr key={response.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {response.patient.avatar ? (
                        <img
                          src={response.patient.avatar}
                          alt={response.patient.name}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                          {response.patient.initials}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900">{response.patient.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="max-w-xs truncate text-sm text-gray-700">{response.question}</p>
                  </td>
                  <td className="px-6 py-4">
                    {typeof response.response === 'number' ? (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-sm font-semibold text-green-600">
                        {response.response}
                      </span>
                    ) : (
                      <p className="max-w-md text-sm text-gray-700">{response.response}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{response.page}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{response.when}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
