'use client';

type Item = {
  id: string;
  itemNumber: number;
  questionText: string;
  itemType: string;
  scaleMin: number | null;
  scaleMax: number | null;
  scaleLabels: Record<string, string> | null;
};

type QuestionStepperProps = {
  item: Item;
  defaultScaleMin: number;
  defaultScaleMax: number;
  defaultScaleLabels: Record<string, string> | null;
  selectedValue: number | null;
  onSelect: (itemId: string, value: number) => void;
};

export function QuestionStepper({
  item,
  defaultScaleMin,
  defaultScaleMax,
  defaultScaleLabels,
  selectedValue,
  onSelect,
}: QuestionStepperProps) {
  const scaleMin = item.scaleMin ?? defaultScaleMin;
  const scaleMax = item.scaleMax ?? defaultScaleMax;
  const scaleLabels = item.scaleLabels ?? defaultScaleLabels ?? {};

  const options = [];
  for (let i = scaleMin; i <= scaleMax; i++) {
    options.push({ value: i, label: scaleLabels[String(i)] ?? String(i) });
  }

  if (item.itemType === 'open_text') {
    return (
      <div className="space-y-4">
        <div className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
          Question
          {' '}
          {item.itemNumber}
        </div>
        <p className="text-lg font-medium text-gray-900">{item.questionText}</p>
        <textarea
          className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          rows={4}
          placeholder="Enter response..."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
        Question
        {' '}
        {item.itemNumber}
      </div>
      <p className="text-lg font-medium text-gray-900">{item.questionText}</p>

      <div className="mt-6 space-y-2">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(item.id, option.value)}
            className={`w-full rounded-lg border p-3 text-left transition-all ${
              selectedValue === option.value
                ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  selectedValue === option.value
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}
              >
                {option.value}
              </div>
              <span className={`text-sm ${selectedValue === option.value ? 'font-medium text-indigo-900' : 'text-gray-700'}`}>
                {option.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
