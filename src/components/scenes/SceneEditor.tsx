'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';

type SceneEditorProps = {
  sceneTitle: string;
  onSceneTitleChange: (title: string) => void;
  onPatientSelect: (patientId: string | null) => void;
};

export function SceneEditor({
  sceneTitle,
  onSceneTitleChange,
}: SceneEditorProps) {
  const [loopAudio, setLoopAudio] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900">Scene Editor</h2>
      </div>

      {/* Scene Title */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Scene Title (Optional)
        </label>
        <Input
          value={sceneTitle}
          onChange={e => onSceneTitleChange(e.target.value)}
          placeholder="Jay's vision of the future self"
        />
        <p className="mt-1 text-xs text-gray-500">
          If provided, the title will be inserted at the beginning of your scene for 3 seconds.
        </p>
      </div>

      {/* Audio Options */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
          Audio Options
        </div>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="loop-audio"
            checked={loopAudio}
            onChange={e => setLoopAudio(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
          />
          <div className="flex-1">
            <label htmlFor="loop-audio" className="block text-sm font-medium text-gray-900">
              Loop audio to match video duration
            </label>
            <p className="mt-1 text-xs text-gray-600">
              When enabled, the selected audio will repeat to fill the entire video duration. Only one audio can be selected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
