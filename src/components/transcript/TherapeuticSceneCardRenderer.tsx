'use client';

import { ChevronLeft, ChevronRight, Image as ImageIcon, Lightbulb, MessageSquareQuote, Play } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export type TherapeuticSceneCard = {
  type: 'therapeutic_scene_card';
  title: string;
  subtitle?: string;
  patient: string;
  scenes: Array<{
    sceneNumber: number;
    sections: {
      patientQuote: { label: string; content: string };
      meaning: { label: string; content: string };
      imagePrompt: { label: string; content: string };
      imageToScene: { label: string; content: string };
    };
  }>;
  status: 'pending' | 'completed';
};

type TherapeuticSceneCardRendererProps = {
  data: TherapeuticSceneCard;
  onGenerateScenes?: (data: TherapeuticSceneCard) => void;
};

export function TherapeuticSceneCardRenderer({
  data,
  onGenerateScenes,
}: TherapeuticSceneCardRendererProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  const currentScene = data.scenes[currentSceneIndex];
  const totalScenes = data.scenes.length;

  const handlePrevious = () => {
    setCurrentSceneIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentSceneIndex(prev => Math.min(totalScenes - 1, prev + 1));
  };

  if (!currentScene || !currentScene.sections) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-500">No scenes available or scene data is incomplete</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-50 p-4">
        <h3 className="text-base font-semibold text-gray-900">
          {data.title}
        </h3>
        {data.subtitle && (
          <p className="mt-1 text-xs text-gray-600">
            {data.subtitle}
          </p>
        )}

        {/* Patient Badge */}
        <div className="mt-3 flex items-center gap-2">
          <div className="rounded-full bg-purple-100 px-3 py-1">
            <span className="text-xs font-medium text-purple-700">
              Patient:
              {' '}
              {data.patient}
            </span>
          </div>

          {/* Scene Navigation */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentSceneIndex === 0}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-600 transition-colors hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-gray-700">
              {currentScene.sceneNumber}
              /
              {totalScenes}
            </span>
            <button
              onClick={handleNext}
              disabled={currentSceneIndex === totalScenes - 1}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-600 transition-colors hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scene Content */}
      <div className="p-4">
        {/* Patient Quote Anchor */}
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-purple-600" />
            <h4 className="text-sm font-semibold text-gray-900">
              {currentScene.sections.patientQuote.label}
            </h4>
          </div>
          <p className="rounded-lg bg-purple-50 p-3 text-sm leading-relaxed text-gray-700 italic">
            "
            {currentScene.sections.patientQuote.content}
            "
          </p>
        </div>

        {/* Meaning */}
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <h4 className="text-sm font-semibold text-gray-900">
              {currentScene.sections.meaning.label}
            </h4>
          </div>
          <p className="rounded-lg bg-amber-50 p-3 text-sm leading-relaxed text-gray-700">
            {currentScene.sections.meaning.content}
          </p>
        </div>

        {/* Image Prompt */}
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-gray-900">
              {currentScene.sections.imagePrompt.label}
            </h4>
          </div>
          <p className="rounded-lg bg-blue-50 p-3 text-sm leading-relaxed text-gray-700">
            {currentScene.sections.imagePrompt.content}
          </p>
        </div>

        {/* Image to Scene */}
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <Play className="h-4 w-4 text-purple-600" />
            <h4 className="text-sm font-semibold text-gray-900">
              {currentScene.sections.imageToScene.label}
            </h4>
          </div>
          <p className="rounded-lg bg-purple-50 p-3 text-sm leading-relaxed text-gray-700">
            {currentScene.sections.imageToScene.content}
          </p>
        </div>

        {/* Generate Button */}
        {onGenerateScenes && (
          <div className="pt-2">
            <Button
              onClick={() => onGenerateScenes(data)}
              variant="primary"
              className="w-full"
              size="lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Generate Scenes
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}
