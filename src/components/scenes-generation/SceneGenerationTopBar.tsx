'use client';

import { Check, ChevronDown, HelpCircle, Info, Loader2, Play, Redo, Undo } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getAllImageModelsFlat, getAvailableVideoModels, getFilteredImageModels } from '@/libs/ModelMetadata';

type Patient = {
  id: string;
  name: string;
  avatarUrl?: string;
  referenceImageUrl?: string;
};

type ReferenceImage = {
  id: string;
  url: string;
  name?: string;
};

type SceneGenerationTopBarProps = {
  patientName: string;
  patientAvatarUrl?: string;
  patients?: Patient[];
  selectedPatientId?: string;
  onPatientChange?: (patientId: string) => void;
  loadingPatients?: boolean;
  selectedImageModel: string;
  onImageModelChange: (modelValue: string) => void;
  selectedVideoModel: string;
  onVideoModelChange: (modelValue: string) => void;
  useReference: boolean;
  onUseReferenceChange: (useReference: boolean) => void;
  onShowReferenceModal: () => void;
  referenceImages?: ReferenceImage[];
  selectedReferenceImageIds?: string[]; // IDs of selected reference images
  onReferenceImageSelectionChange?: (selectedIds: string[]) => void; // Callback when selection changes
  settingsLocked?: boolean; // Lock settings after any image is generated
  onPreview?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
};

export function SceneGenerationTopBar({
  patientName,
  patientAvatarUrl,
  patients = [],
  selectedPatientId,
  onPatientChange,
  loadingPatients = false,
  selectedImageModel,
  onImageModelChange,
  selectedVideoModel,
  onVideoModelChange,
  useReference,
  onUseReferenceChange,
  onShowReferenceModal,
  referenceImages = [],
  selectedReferenceImageIds,
  onReferenceImageSelectionChange,
  settingsLocked = false,
  onPreview,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: SceneGenerationTopBarProps) {
  console.log('[TopBar] settingsLocked:', settingsLocked);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showImageModelDropdown, setShowImageModelDropdown] = useState(false);
  const [showVideoModelDropdown, setShowVideoModelDropdown] = useState(false);
  const [showReferencePreview, setShowReferencePreview] = useState(false);

  // Ref for popover hide delay
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle mouse enter for reference preview (clears any pending hide)
  const handleReferenceMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowReferencePreview(true);
  };

  // Handle mouse leave for reference preview (delays hide to allow mouse to move to popover)
  const handleReferenceMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowReferencePreview(false);
    }, 150);
  };

  // Get filtered image models based on useReference toggle
  const imageModels = getFilteredImageModels(useReference);
  const videoModels = getAvailableVideoModels();

  // Check if selected image model supports prompts
  const selectedModelMeta = getAllImageModelsFlat().find(m => m.value === selectedImageModel);
  const modelSupportsPrompt = selectedModelMeta?.supportsPrompt ?? true;

  // Get display label for selected image model
  const getImageModelLabel = (value: string) => {
    for (const providerModels of Object.values(imageModels)) {
      const model = providerModels.find(m => m.value === value);
      if (model) return model.label.split(' - ')[0]; // Get short name without price
    }
    return value;
  };

  // Get display label for selected video model
  const getVideoModelLabel = (value: string) => {
    for (const providerModels of Object.values(videoModels)) {
      const model = providerModels.find(m => m.value === value);
      if (model) return model.label.split(' - ')[0]; // Get short name without price
    }
    return value;
  };

  // Get patient initial for avatar fallback
  const getPatientInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Get currently selected patient
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || {
    id: '',
    name: patientName,
    avatarUrl: patientAvatarUrl,
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      {/* Left Side - Patient & Model Selection */}
      <div className="flex items-center gap-4">
        {/* Patient Selector */}
        <div className="relative">
          <button
            onClick={() => !loadingPatients && patients.length > 0 && setShowPatientDropdown(!showPatientDropdown)}
            disabled={loadingPatients}
            className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 transition-colors ${
              loadingPatients
                ? 'cursor-wait opacity-70'
                : patients.length > 0
                  ? 'cursor-pointer hover:border-gray-300'
                  : 'cursor-default'
            }`}
          >
            {loadingPatients ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                <span className="text-gray-500">Loading patients...</span>
              </>
            ) : (
              <>
                {/* Patient Avatar */}
                {selectedPatient.avatarUrl || selectedPatient.referenceImageUrl ? (
                  <img
                    src={selectedPatient.avatarUrl || selectedPatient.referenceImageUrl}
                    alt={selectedPatient.name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-medium text-white">
                    {getPatientInitial(selectedPatient.name)}
                  </div>
                )}
                <span>{selectedPatient.name}</span>
                {patients.length > 0 && (
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showPatientDropdown ? 'rotate-180' : ''}`} />
                )}
              </>
            )}
          </button>

          {/* Patient Dropdown */}
          {showPatientDropdown && patients.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowPatientDropdown(false)}
              />
              <div className="absolute top-full left-0 z-20 mt-1 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                {patients.map(patient => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      onPatientChange?.(patient.id);
                      setShowPatientDropdown(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                      patient.id === selectedPatientId ? 'bg-purple-50 text-purple-600' : 'text-gray-700'
                    }`}
                  >
                    {patient.avatarUrl || patient.referenceImageUrl ? (
                      <img
                        src={patient.avatarUrl || patient.referenceImageUrl}
                        alt={patient.name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-medium text-white">
                        {getPatientInitial(patient.name)}
                      </div>
                    )}
                    <span>{patient.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Image Model Selector */}
        <div className="relative">
          <button
            onClick={() => !settingsLocked && setShowImageModelDropdown(!showImageModelDropdown)}
            disabled={settingsLocked}
            className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium transition-colors ${
              settingsLocked
                ? 'cursor-not-allowed text-gray-500 opacity-50'
                : 'text-gray-900 hover:border-gray-300'
            }`}
            title={settingsLocked ? 'Settings locked after image generation' : undefined}
          >
            <span className="text-purple-600">Image:</span>
            <span>{getImageModelLabel(selectedImageModel)}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showImageModelDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Image Model Dropdown */}
          {showImageModelDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowImageModelDropdown(false)}
              />
              <div className="absolute top-full left-0 z-20 mt-1 max-h-80 w-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {useReference && (
                  <div className="border-b border-purple-200 bg-purple-50 px-3 py-2">
                    <p className="text-xs font-medium text-purple-600">Reference Mode - Image-to-Image models only</p>
                  </div>
                )}
                {Object.entries(imageModels).map(([provider, providerModels]) => (
                  <div key={provider} className="border-b border-gray-100 last:border-b-0">
                    <div className="bg-gray-50 px-3 py-2">
                      <p className="text-xs font-semibold text-gray-500">{provider}</p>
                    </div>
                    {providerModels.map(model => (
                      <button
                        key={model.value}
                        onClick={() => {
                          onImageModelChange(model.value);
                          setShowImageModelDropdown(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                          model.value === selectedImageModel ? 'bg-purple-50 font-medium text-purple-600' : 'text-gray-700'
                        }`}
                      >
                        <span>{model.label}</span>
                        {model.supportsReference && model.maxReferenceImages > 0 && (
                          <span className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                            model.maxReferenceImages === 1
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {model.maxReferenceImages === 1 ? '1 ref' : `${model.maxReferenceImages}+ refs`}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* No Prompt Support Notice */}
        {!modelSupportsPrompt && (
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
            <Info className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs text-amber-700">No prompt input - transforms reference only</span>
          </div>
        )}

        {/* Video Model Selector */}
        <div className="relative">
          <button
            onClick={() => !settingsLocked && setShowVideoModelDropdown(!showVideoModelDropdown)}
            disabled={settingsLocked}
            className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium transition-colors ${
              settingsLocked
                ? 'cursor-not-allowed text-gray-500 opacity-50'
                : 'text-gray-900 hover:border-gray-300'
            }`}
            title={settingsLocked ? 'Settings locked after image generation' : undefined}
          >
            <span className="text-blue-600">Video:</span>
            <span>{getVideoModelLabel(selectedVideoModel)}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showVideoModelDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Video Model Dropdown */}
          {showVideoModelDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowVideoModelDropdown(false)}
              />
              <div className="absolute top-full left-0 z-20 mt-1 max-h-96 w-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {Object.entries(videoModels).map(([provider, providerModels]) => (
                  <div key={provider} className="border-b border-gray-100 last:border-b-0">
                    <div className="bg-gray-50 px-3 py-2">
                      <p className="text-xs font-semibold text-gray-500">{provider}</p>
                    </div>
                    {providerModels.map(model => (
                      <button
                        key={model.value}
                        onClick={() => {
                          onVideoModelChange(model.value);
                          setShowVideoModelDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left transition-colors hover:bg-gray-50 ${
                          model.value === selectedVideoModel ? 'bg-purple-50 font-medium text-purple-600' : 'text-gray-700'
                        }`}
                      >
                        <div className="text-sm">{model.label}</div>
                        {'description' in model && model.description && (
                          <div className="text-xs text-gray-500">{model.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Side - Use Reference Toggle & Actions */}
      <div className="flex items-center gap-4">
        {/* Use Reference Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Use Reference</span>
          {/* Reference Image Preview Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowReferencePreview(!showReferencePreview)}
              onMouseEnter={handleReferenceMouseEnter}
              onMouseLeave={handleReferenceMouseLeave}
              className="text-gray-400 transition-colors hover:text-gray-600"
              title="View reference images"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            {/* Reference Image Preview Popover */}
            {showReferencePreview && (
              <div
                className="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
                onMouseEnter={handleReferenceMouseEnter}
                onMouseLeave={handleReferenceMouseLeave}
              >
                {referenceImages.length > 0 ? (
                  <>
                    <div className="p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-500">Select Reference Images</p>
                        <span className="text-xs text-gray-400">
                          {selectedReferenceImageIds?.length || 0}
                          {' '}
                          selected
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {referenceImages.map(img => {
                          const isSelected = selectedReferenceImageIds?.includes(img.id) ?? true;
                          return (
                            <button
                              key={img.id}
                              onClick={() => {
                                if (!onReferenceImageSelectionChange) return;
                                const currentSelected = selectedReferenceImageIds || referenceImages.map(i => i.id);

                                // Get current model's max reference images
                                const modelMeta = getAllImageModelsFlat().find(m => m.value === selectedImageModel);
                                const maxRefs = modelMeta?.maxReferenceImages || 4;

                                if (isSelected) {
                                  // Deselecting - ensure at least one remains
                                  const newSelected = currentSelected.filter(id => id !== img.id);
                                  if (newSelected.length > 0) {
                                    onReferenceImageSelectionChange(newSelected);
                                  }
                                } else {
                                  // Selecting - check if we're at the limit
                                  if (currentSelected.length >= maxRefs) {
                                    toast(`${modelMeta?.label || 'This model'} only supports ${maxRefs} reference image${maxRefs === 1 ? '' : 's'}`, {
                                      icon: '⚠️',
                                    });
                                    return;
                                  }
                                  onReferenceImageSelectionChange([...currentSelected, img.id]);
                                }
                              }}
                              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                                isSelected
                                  ? 'border-purple-500 ring-2 ring-purple-200'
                                  : 'border-gray-200 opacity-50 hover:opacity-75'
                              }`}
                            >
                              <img
                                src={img.url}
                                alt={img.name || 'Reference'}
                                className="h-full w-full object-cover"
                              />
                              {isSelected && (
                                <div className="absolute top-1 right-1 rounded-full bg-purple-500 p-0.5">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                              {img.name && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                                  <p className="truncate text-xs text-white">{img.name}</p>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
                      <button
                        onClick={() => {
                          setShowReferencePreview(false);
                          onShowReferenceModal();
                        }}
                        className="w-full text-center text-xs font-medium text-purple-600 hover:text-purple-700"
                      >
                        Manage Reference Images
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center">
                    <p className="mb-2 text-sm text-gray-600">No reference images</p>
                    <button
                      onClick={() => {
                        setShowReferencePreview(false);
                        onShowReferenceModal();
                      }}
                      className="text-xs font-medium text-purple-600 hover:text-purple-700"
                    >
                      Add Reference Images
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Toggle Switch */}
          <button
            onClick={() => !settingsLocked && onUseReferenceChange(!useReference)}
            disabled={settingsLocked}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              settingsLocked ? 'cursor-not-allowed opacity-50' : ''
            } ${useReference ? 'bg-purple-600' : 'bg-gray-300'}`}
            title={settingsLocked ? 'Settings locked after image generation' : undefined}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                useReference ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-l border-gray-200 pl-4">
          {onUndo && (
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Undo className="h-4 w-4" />
            </button>
          )}
          {onRedo && (
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Redo className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Preview Button */}
        {onPreview && (
          <button
            onClick={onPreview}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
          >
            <Play className="h-4 w-4" />
            Preview
          </button>
        )}
      </div>
    </div>
  );
}
