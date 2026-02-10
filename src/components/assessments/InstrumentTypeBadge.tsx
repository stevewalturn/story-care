'use client';

type InstrumentTypeBadgeProps = {
  type: string;
  className?: string;
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  ptsd: { label: 'PTSD', color: 'bg-red-100 text-red-800' },
  depression: { label: 'Depression', color: 'bg-blue-100 text-blue-800' },
  schizophrenia: { label: 'Schizophrenia', color: 'bg-purple-100 text-purple-800' },
  substance_use: { label: 'Substance Use', color: 'bg-orange-100 text-orange-800' },
  anxiety: { label: 'Anxiety', color: 'bg-teal-100 text-teal-800' },
  enrollment: { label: 'Enrollment', color: 'bg-gray-100 text-gray-800' },
  general: { label: 'General', color: 'bg-slate-100 text-slate-800' },
};

export function InstrumentTypeBadge({ type, className = '' }: InstrumentTypeBadgeProps) {
  const config = TYPE_CONFIG[type] ?? { label: type, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color} ${className}`}>
      {config.label}
    </span>
  );
}
