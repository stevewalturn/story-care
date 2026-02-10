'use client';

type AssessmentProgressBarProps = {
  current: number;
  total: number;
};

export function AssessmentProgressBar({ current, total }: AssessmentProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm font-medium whitespace-nowrap text-gray-600">
        {current}
        {' '}
        of
        {' '}
        {total}
      </span>
    </div>
  );
}
