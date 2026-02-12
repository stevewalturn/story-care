'use client';

import type { ModelCategory, ModelStatus, PricingUnit } from '@/models/Schema';
import type { CreateAiModelInput } from '@/validations/AiModelValidation';
import { AlertCircle, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { createAiModelSchema } from '@/validations/AiModelValidation';

const CATEGORY_OPTIONS: { value: ModelCategory; label: string }[] = [
  { value: 'text_to_image', label: 'Text to Image' },
  { value: 'image_to_image', label: 'Image to Image' },
  { value: 'image_to_video', label: 'Image to Video' },
  { value: 'text_to_video', label: 'Text to Video' },
  { value: 'text_to_text', label: 'Text to Text' },
  { value: 'image_to_text', label: 'Image to Text' },
  { value: 'music_generation', label: 'Music Generation' },
  { value: 'transcription', label: 'Transcription' },
];

const PRICING_UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: 'per_image', label: 'Per Image' },
  { value: 'per_second', label: 'Per Second' },
  { value: 'per_minute', label: 'Per Minute' },
  { value: 'per_1k_tokens', label: 'Per 1K Tokens' },
  { value: 'per_request', label: 'Per Request' },
];

const STATUS_OPTIONS: { value: ModelStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'deprecated', label: 'Deprecated' },
];

const CATEGORY_DEFAULT_PRICING_UNIT: Record<ModelCategory, PricingUnit> = {
  text_to_image: 'per_image',
  image_to_image: 'per_image',
  image_to_video: 'per_second',
  text_to_video: 'per_second',
  text_to_text: 'per_1k_tokens',
  image_to_text: 'per_1k_tokens',
  music_generation: 'per_minute',
  transcription: 'per_minute',
};

const IMAGE_CATEGORIES: ModelCategory[] = ['text_to_image', 'image_to_image'];
const VIDEO_CATEGORIES: ModelCategory[] = ['image_to_video', 'text_to_video'];
const CAPABILITIES_CATEGORIES: ModelCategory[] = [...IMAGE_CATEGORIES, ...VIDEO_CATEGORIES];

type FormData = {
  displayName: string;
  modelId: string;
  description: string;
  category: ModelCategory;
  provider: string;
  providerGroup: string;
  status: ModelStatus;
  costPerUnit: string;
  pricingUnit: string;
  apiModelId: string;
  apiProvider: string;
  supportsReference: boolean;
  maxReferenceImages: string;
  supportsPrompt: boolean;
  maxOutputDuration: string;
  maxResolution: string;
};

const INITIAL_FORM_DATA: FormData = {
  displayName: '',
  modelId: '',
  description: '',
  category: 'image_to_video',
  provider: '',
  providerGroup: '',
  status: 'active',
  costPerUnit: '',
  pricingUnit: 'per_second',
  apiModelId: '',
  apiProvider: 'atlascloud',
  supportsReference: false,
  maxReferenceImages: '',
  supportsPrompt: true,
  maxOutputDuration: '',
  maxResolution: '',
};

type AddModelModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateAiModelInput) => Promise<{ error?: string; field?: string }>;
};

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function AddModelModal({ isOpen, onClose, onSave }: AddModelModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [modelIdManuallyEdited, setModelIdManuallyEdited] = useState(false);
  const [pricingUnitManuallyEdited, setPricingUnitManuallyEdited] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [capabilitiesOpen, setCapabilitiesOpen] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM_DATA);
      setModelIdManuallyEdited(false);
      setPricingUnitManuallyEdited(false);
      setFieldErrors({});
      setFormError('');
      setSaving(false);
      setCapabilitiesOpen(false);
    }
  }, [isOpen]);

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear field error on change
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // Auto-generate modelId from displayName
  const handleDisplayNameChange = useCallback((value: string) => {
    updateField('displayName', value);
    if (!modelIdManuallyEdited) {
      setFormData(prev => ({ ...prev, displayName: value, modelId: toKebabCase(value) }));
    }
  }, [modelIdManuallyEdited, updateField]);

  // Handle manual modelId edit
  const handleModelIdChange = useCallback((value: string) => {
    setModelIdManuallyEdited(true);
    updateField('modelId', value);
  }, [updateField]);

  // Auto-set pricing unit on category change
  const handleCategoryChange = useCallback((value: string) => {
    const category = value as ModelCategory;
    updateField('category', category);
    if (!pricingUnitManuallyEdited) {
      const defaultUnit = CATEGORY_DEFAULT_PRICING_UNIT[category];
      setFormData(prev => ({ ...prev, category, pricingUnit: defaultUnit }));
    }
  }, [pricingUnitManuallyEdited, updateField]);

  // Handle manual pricing unit edit
  const handlePricingUnitChange = useCallback((value: string) => {
    setPricingUnitManuallyEdited(true);
    updateField('pricingUnit', value);
  }, [updateField]);

  // On-blur validation for required fields
  const validateField = useCallback((field: string, value: string) => {
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, [field]: 'This field is required' }));
    }
  }, []);

  const showCapabilities = CAPABILITIES_CATEGORIES.includes(formData.category);
  const isImageCategory = IMAGE_CATEGORIES.includes(formData.category);
  const isVideoCategory = VIDEO_CATEGORIES.includes(formData.category);

  // Build capabilities object
  const buildCapabilities = () => {
    if (!showCapabilities) return undefined;

    const caps: Record<string, unknown> = {};

    if (isImageCategory) {
      caps.supportsReference = formData.supportsReference;
      if (formData.supportsReference && formData.maxReferenceImages) {
        caps.maxReferenceImages = Number.parseInt(formData.maxReferenceImages, 10);
      }
      caps.supportsPrompt = formData.supportsPrompt;
    }
    if (isVideoCategory && formData.maxOutputDuration) {
      caps.maxOutputDuration = Number.parseFloat(formData.maxOutputDuration);
    }
    if (formData.maxResolution) {
      caps.maxResolution = formData.maxResolution;
    }

    return Object.keys(caps).length > 0 ? caps : undefined;
  };

  const handleSave = async () => {
    setFormError('');
    setFieldErrors({});

    const payload = {
      modelId: formData.modelId.trim(),
      displayName: formData.displayName.trim(),
      category: formData.category,
      provider: formData.provider.trim(),
      providerGroup: formData.providerGroup.trim() || null,
      status: formData.status,
      costPerUnit: formData.costPerUnit || null,
      pricingUnit: formData.pricingUnit || null,
      apiModelId: formData.apiModelId.trim() || null,
      apiProvider: formData.apiProvider.trim() || null,
      description: formData.description.trim() || null,
      capabilities: buildCapabilities(),
    };

    // Client-side validation
    const result = createAiModelSchema.safeParse(payload);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0]?.toString();
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const serverResult = await onSave(result.data);
      if (serverResult?.error) {
        if (serverResult.field) {
          setFieldErrors(prev => ({ ...prev, [serverResult.field!]: serverResult.error! }));
        } else {
          setFormError(serverResult.error);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const apiModelIdHint = formData.provider && formData.modelId
    ? `e.g., ${formData.provider.toLowerCase()}/${formData.modelId}`
    : 'e.g., provider/model-id';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Model"
      description="Add a new AI model to the platform"
      size="lg"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            disabled={saving}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Model
          </Button>
        </>
      )}
    >
      <div className="space-y-6">
        {/* Form Error Banner */}
        {formError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{formError}</p>
          </div>
        )}

        {/* Section: Model Identity */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Model Identity</h4>

          <Input
            label="Display Name *"
            value={formData.displayName}
            onChange={e => handleDisplayNameChange(e.target.value)}
            onBlur={() => validateField('displayName', formData.displayName)}
            placeholder="e.g. Seedance v1 Lite i2v 720p"
            error={fieldErrors.displayName}
          />

          <Input
            label="Model ID *"
            value={formData.modelId}
            onChange={e => handleModelIdChange(e.target.value)}
            onBlur={() => validateField('modelId', formData.modelId)}
            placeholder="e.g. seedance-v1-lite-i2v-720p"
            error={fieldErrors.modelId}
            helperText={!modelIdManuallyEdited && formData.displayName ? 'Auto-generated from display name' : undefined}
            className="font-mono"
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={e => updateField('description', e.target.value)}
            placeholder="Optional model description"
            rows={2}
          />
        </div>

        {/* Section: Classification */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Classification</h4>

          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label="Category *"
              value={formData.category}
              onChange={handleCategoryChange}
              options={CATEGORY_OPTIONS}
              error={fieldErrors.category}
            />

            <Dropdown
              label="Status"
              value={formData.status}
              onChange={v => updateField('status', v as ModelStatus)}
              options={STATUS_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Provider *"
              value={formData.provider}
              onChange={e => updateField('provider', e.target.value)}
              onBlur={() => validateField('provider', formData.provider)}
              placeholder="e.g. ByteDance"
              error={fieldErrors.provider}
            />

            <Input
              label="Provider Group"
              value={formData.providerGroup}
              onChange={e => updateField('providerGroup', e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Section: Pricing & API */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Pricing & API</h4>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cost Per Unit ($)"
              type="number"
              step="0.000001"
              value={formData.costPerUnit}
              onChange={e => updateField('costPerUnit', e.target.value)}
              placeholder="0.00"
            />

            <Dropdown
              label="Pricing Unit"
              value={formData.pricingUnit}
              onChange={handlePricingUnitChange}
              options={PRICING_UNIT_OPTIONS}
              placeholder="Select unit..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="API Model ID"
              value={formData.apiModelId}
              onChange={e => updateField('apiModelId', e.target.value)}
              placeholder="e.g. bytedance/seedance-v1-lite"
              helperText={apiModelIdHint}
              className="font-mono"
            />

            <Input
              label="API Provider"
              value={formData.apiProvider}
              onChange={e => updateField('apiProvider', e.target.value)}
              placeholder="e.g. atlascloud"
            />
          </div>
        </div>

        {/* Section: Capabilities (collapsible) */}
        {showCapabilities && (
          <div className="rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setCapabilitiesOpen(!capabilitiesOpen)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              <span>Capabilities (optional)</span>
              {capabilitiesOpen
                ? <ChevronDown className="h-4 w-4 text-gray-400" />
                : <ChevronRight className="h-4 w-4 text-gray-400" />}
            </button>

            {capabilitiesOpen && (
              <div className="space-y-4 border-t border-gray-200 px-4 py-4">
                {isImageCategory && (
                  <>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.supportsReference}
                        onChange={e => updateField('supportsReference', e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      Supports Reference Images
                    </label>

                    <Input
                      label="Max Reference Images"
                      type="number"
                      min="0"
                      value={formData.maxReferenceImages}
                      onChange={e => updateField('maxReferenceImages', e.target.value)}
                      placeholder="e.g. 4"
                      disabled={!formData.supportsReference}
                    />

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.supportsPrompt}
                        onChange={e => updateField('supportsPrompt', e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      Supports Prompt
                    </label>
                  </>
                )}

                {isVideoCategory && (
                  <Input
                    label="Max Output Duration (seconds)"
                    type="number"
                    min="0"
                    value={formData.maxOutputDuration}
                    onChange={e => updateField('maxOutputDuration', e.target.value)}
                    placeholder="e.g. 10"
                  />
                )}

                <Input
                  label="Max Resolution"
                  value={formData.maxResolution}
                  onChange={e => updateField('maxResolution', e.target.value)}
                  placeholder="e.g. 1920x1080"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
