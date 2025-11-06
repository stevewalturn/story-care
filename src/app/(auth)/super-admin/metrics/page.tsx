/**
 * Super Admin Metrics Page
 * System performance and usage statistics
 */

'use client';

import { Activity, Database, TrendingUp, Zap } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';

export default function MetricsPage() {
  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Metrics</h1>
        <p className="mt-2 text-gray-600">
          Monitor platform performance and usage statistics
        </p>
      </div>

      {/* Performance Metrics */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Performance
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="API Response Time"
            value="120ms"
            icon={<Activity className="h-6 w-6" />}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />

          <MetricCard
            label="Uptime"
            value="99.9%"
            icon={<TrendingUp className="h-6 w-6" />}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />

          <MetricCard
            label="Database Size"
            value="2.4GB"
            icon={<Database className="h-6 w-6" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />

          <MetricCard
            label="Active Sessions"
            value="1,234"
            icon={<Zap className="h-6 w-6" />}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-600"
          />
        </div>
      </div>

      {/* Usage Metrics */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Usage</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">
              AI API Calls (30 days)
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">45,231</p>
            <p className="mt-1 text-sm text-gray-600">
              Across all organizations
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Storage Used
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">156GB</p>
            <p className="mt-1 text-sm text-gray-600">
              Media files and transcripts
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Transcription Hours
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">2,847</p>
            <p className="mt-1 text-sm text-gray-600">
              Total hours processed
            </p>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          System Health
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Database</span>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Healthy
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">API Server</span>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Healthy
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Storage</span>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Healthy
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">AI Services</span>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Healthy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
