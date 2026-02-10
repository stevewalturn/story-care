'use client';

type ScoreSummaryProps = {
  totalScore: number;
  totalScoreRange: { min: number; max: number } | null;
  subscaleScores: Record<string, number> | null;
  clinicalCutoffs: Array<{ min: number; max: number; label: string; severity?: string }> | null;
  interpretation: string | null;
};

const SEVERITY_COLORS: Record<string, string> = {
  normal: 'text-green-700 bg-green-50 border-green-200',
  minimal: 'text-green-700 bg-green-50 border-green-200',
  mild: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  moderate: 'text-orange-700 bg-orange-50 border-orange-200',
  marked: 'text-orange-700 bg-orange-50 border-orange-200',
  severe: 'text-red-700 bg-red-50 border-red-200',
  very_severe: 'text-red-700 bg-red-50 border-red-200',
  extreme: 'text-red-700 bg-red-50 border-red-200',
  clinical: 'text-red-700 bg-red-50 border-red-200',
  low: 'text-green-700 bg-green-50 border-green-200',
  high: 'text-red-700 bg-red-50 border-red-200',
};

export function ScoreSummary({
  totalScore,
  totalScoreRange,
  subscaleScores,
  clinicalCutoffs,
  interpretation,
}: ScoreSummaryProps) {
  // Find severity for styling
  let severity = '';
  if (clinicalCutoffs) {
    for (const cutoff of clinicalCutoffs) {
      if (totalScore >= cutoff.min && totalScore <= cutoff.max) {
        severity = cutoff.severity ?? '';
        break;
      }
    }
  }

  const interpretationColor = SEVERITY_COLORS[severity] ?? 'text-gray-700 bg-gray-50 border-gray-200';

  return (
    <div className="space-y-6">
      {/* Total Score */}
      <div className="text-center">
        <div className="text-5xl font-bold text-gray-900">{totalScore}</div>
        {totalScoreRange && (
          <div className="mt-1 text-sm text-gray-500">
            out of
            {' '}
            {totalScoreRange.max}
          </div>
        )}
        {interpretation && (
          <div className={`mt-3 inline-block rounded-lg border px-4 py-2 text-sm font-medium ${interpretationColor}`}>
            {interpretation}
          </div>
        )}
      </div>

      {/* Score Bar */}
      {totalScoreRange && (
        <div className="space-y-1">
          <div className="h-3 w-full rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full bg-indigo-600 transition-all duration-500"
              style={{
                width: `${Math.min(100, ((totalScore - totalScoreRange.min) / (totalScoreRange.max - totalScoreRange.min)) * 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{totalScoreRange.min}</span>
            <span>{totalScoreRange.max}</span>
          </div>
        </div>
      )}

      {/* Clinical Cutoff Scale */}
      {clinicalCutoffs && clinicalCutoffs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Clinical Ranges</h4>
          <div className="space-y-1">
            {clinicalCutoffs.map(cutoff => (
              <div
                key={cutoff.label}
                className={`flex items-center justify-between rounded px-3 py-1.5 text-xs ${
                  totalScore >= cutoff.min && totalScore <= cutoff.max
                    ? 'bg-indigo-50 font-medium text-indigo-900 ring-1 ring-indigo-200'
                    : 'text-gray-500'
                }`}
              >
                <span>{cutoff.label}</span>
                <span>
                  {cutoff.min}
                  {' '}
                  &ndash;
                  {' '}
                  {cutoff.max}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscale Scores */}
      {subscaleScores && Object.keys(subscaleScores).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Subscale Scores</h4>
          <div className="space-y-1">
            {Object.entries(subscaleScores).map(([name, score]) => (
              <div key={name} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
                <span className="text-gray-600">{name}</span>
                <span className="font-medium text-gray-900">{score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
