'use client';

import type { SessionFormData } from '@/components/sessions/wizard/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AssignSpeakerStep } from '@/components/sessions/wizard/AssignSpeakerStep';
import { CompletedStep } from '@/components/sessions/wizard/CompletedStep';
import { GeneralInfoStep } from '@/components/sessions/wizard/GeneralInfoStep';
import { UploadFileStep } from '@/components/sessions/wizard/UploadFileStep';
import { Button } from '@/components/ui/Button';

type WizardStep = 'general-info' | 'upload-file' | 'assign-speaker' | 'completed';

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: 'general-info', label: 'General Info' },
  { id: 'upload-file', label: 'Upload File' },
  { id: 'assign-speaker', label: 'Assign Speaker' },
  { id: 'completed', label: 'Completed' },
];

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');

  const [currentStep, setCurrentStep] = useState<WizardStep>('general-info');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SessionFormData>({
    title: '',
    sessionDate: new Date().toISOString().split('T')[0] || '',
    description: '',
    patientIds: [],
    audioFile: null,
  });

  // Ref to store the current step's proceed function
  const stepProceedRef = useState<{ current: (() => void) | null }>({ current: null })[0];

  // Track if current step is ready to proceed
  const [stepReady, setStepReady] = useState(false);

  // Update current step based on URL parameter
  useEffect(() => {
    if (stepParam && STEPS.some(s => s.id === stepParam)) {
      setCurrentStep(stepParam as WizardStep);
    }
  }, [stepParam]);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    // Each step has its own Next logic that will be triggered
    // by the footer button through refs or callbacks
    // This is just a fallback for direct navigation
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      const nextStep = STEPS[nextIndex];
      if (nextStep) {
        setCurrentStep(nextStep.id);
        router.push(`/sessions/new?step=${nextStep.id}`);
      }
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = STEPS[prevIndex];
      if (prevStep) {
        setCurrentStep(prevStep.id);
        router.push(`/sessions/new?step=${prevStep.id}`);
      }
    }
  };

  const handleGeneralInfoNext = (data: Partial<SessionFormData>) => {
    setFormData({ ...formData, ...data });
    handleNext();
  };

  const handleUploadComplete = (file: File, url: string, path: string) => {
    // url: presigned URL for preview (expires in 1 hour)
    // path: permanent GCS path to save in database
    setFormData({ ...formData, audioFile: file, audioUrl: url, audioPath: path });
    handleNext();
  };

  const handleSpeakerAssignmentComplete = (id: string) => {
    setSessionId(id);
    handleNext();
  };

  const handleWizardComplete = () => {
    if (sessionId) {
      router.push(`/sessions/${sessionId}/transcript`);
    } else {
      router.push('/sessions');
    }
  };

  const handleCancel = () => {
    router.push('/sessions');
  };

  const canProceed = currentStep === 'general-info'
    ? formData.title.trim() && formData.sessionDate && formData.patientIds.length > 0
    : stepReady;

  return (
    <div className="relative min-h-screen bg-white pb-[88px]">
      {/* Main Content */}
      <div className="px-[64px] py-[32px]">
        {/* Progress Indicator */}
        <div className="mb-[40px] flex justify-center">
          <div className="relative flex items-start gap-[50px]">
            {/* Background line - connects circle centers */}
            <div
              className="absolute top-[39px] left-[65px] h-[2px] bg-[#e4e4e4]"
              style={{
                width: '540px',
              }}
            />

            {/* Progress line - fills based on current step */}
            {currentStepIndex > 0 && (
              <div
                className="absolute top-[39px] left-[65px] h-[2px] bg-[#5c1ce3] transition-all duration-300"
                style={{
                  width: `${(540 * currentStepIndex) / (STEPS.length - 1)}px`,
                }}
              />
            )}

            {/* Step columns with label above circle */}
            {STEPS.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="relative z-10 flex w-[130px] flex-col items-center gap-[10px]">
                  {/* Step Label - ABOVE circle */}
                  <div
                    className={`
                      font-jakarta text-center text-[14px] leading-[24px] font-medium whitespace-nowrap
                      ${isActive ? 'text-[#5c1ce3]' : isCompleted ? 'text-[#898989]' : 'text-[#bfbfbf]'}
                    `}
                  >
                    {step.label}
                  </div>

                  {/* Step Circle - BELOW label */}
                  <div className="flex h-[10px] w-[10px] items-center justify-center rounded-full">
                    {isCompleted || isActive ? (
                      <div className="h-[10px] w-[10px] rounded-full bg-[#5c1ce3]" />
                    ) : (
                      <div className="h-[10px] w-[10px] rounded-full border-2 border-[#bfbfbf] bg-white" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className={`mx-auto ${currentStep === 'assign-speaker' ? 'max-w-[2000px] px-8' : 'max-w-[410px]'}`}>
          {currentStep === 'general-info' && (
            <GeneralInfoStep
              formData={formData}
              onNext={handleGeneralInfoNext}
              onCancel={handleCancel}
              onChange={data => setFormData(prev => ({ ...prev, ...data }))}
            />
          )}

          {currentStep === 'upload-file' && (
            <UploadFileStep
              onNext={handleUploadComplete}
              onBack={handleBack}
              setStepReady={setStepReady}
              stepProceedRef={stepProceedRef}
            />
          )}

          {currentStep === 'assign-speaker' && (
            <AssignSpeakerStep
              formData={formData}
              onNext={handleSpeakerAssignmentComplete}
              onBack={handleBack}
              setStepReady={setStepReady}
              stepProceedRef={stepProceedRef}
            />
          )}

          {currentStep === 'completed' && (
            <CompletedStep
              sessionId={sessionId || ''}
              onClose={handleWizardComplete}
            />
          )}
        </div>
      </div>

      {/* Fixed Footer with Buttons */}
      <div className="fixed right-0 bottom-0 left-0 border-t border-[#e4e4e4] bg-white px-[32px] py-[12px]">
        <div className="flex items-center justify-end gap-[10px]">
          <Button variant="secondary" onClick={currentStepIndex > 0 ? handleBack : handleCancel}>
            {currentStepIndex > 0 ? 'Back' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              // Call the step's proceed function if it exists, otherwise use default handleNext
              if (stepProceedRef.current) {
                stepProceedRef.current();
              } else if (currentStep === 'general-info') {
                handleGeneralInfoNext(formData);
              } else {
                handleNext();
              }
            }}
            disabled={!canProceed}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
