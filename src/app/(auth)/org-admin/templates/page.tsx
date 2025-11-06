/**
 * Org Admin Templates Page
 * Approve and manage template submissions
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { FileText, Check, X, Clock } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  type: 'survey' | 'reflection';
  category: string;
  createdBy: string;
  createdAt: string;
  status: 'pending_approval' | 'active' | 'rejected';
  questionCount: number;
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user, activeTab]);

  const fetchTemplates = async () => {
    try {
      const idToken = await user?.getIdToken();
      const endpoint = activeTab === 'pending'
        ? '/api/templates/pending'
        : '/api/templates/reflections'; // Would need status filter

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (templateId: string, type: string) => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/templates/${type}/${templateId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (templateId: string, type: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/templates/${type}/${templateId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Template Library</h1>
        <p className="mt-2 text-gray-600">
          Review and approve template submissions from therapists
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'pending'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Pending Approval
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'approved'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'rejected'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Rejected
          </button>
        </nav>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            No {activeTab} templates
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {template.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {template.type === 'survey' ? 'Survey' : 'Reflection'}
                    </span>
                    <span>{template.category}</span>
                    <span>{template.questionCount} questions</span>
                    <span className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {activeTab === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleReject(template.id, template.type)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleApprove(template.id, template.type)}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
