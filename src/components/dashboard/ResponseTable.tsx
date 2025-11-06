'use client';

type Response = {
  id: string;
  patient: string;
  patientAvatar?: string;
  question: string;
  response: string;
  page: string;
  timestamp: string;
};

type ResponseTableProps = {
  title: string;
  responses: Response[];
  type: 'reflection' | 'survey';
};

export function ResponseTable({ title, responses, type }: ResponseTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Question
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Response
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Page
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                When
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {responses.length === 0
              ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      No responses yet
                    </td>
                  </tr>
                )
              : (
                  responses.map(response => (
                    <tr key={response.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                            <span className="text-xs font-medium text-gray-600">
                              {response.patientAvatar || response.patient.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{response.patient}</span>
                        </div>
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-700">
                        {response.question}
                      </td>
                      <td className="max-w-sm px-6 py-4 text-sm text-gray-900">
                        <span className={type === 'survey' ? 'font-semibold' : ''}>
                          {response.response}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {response.page}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {response.timestamp}
                      </td>
                    </tr>
                  ))
                )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
