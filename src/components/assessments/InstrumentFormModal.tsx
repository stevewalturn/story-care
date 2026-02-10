'use client';

import type { InstrumentType } from '@/models/Schema';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type InstrumentItem = {
  itemNumber: number;
  questionText: string;
  itemType: 'likert' | 'multi_choice' | 'open_text' | 'select' | 'number' | 'date';
  scaleMin?: number | null;
  scaleMax?: number | null;
  scaleLabels?: Record<string, string> | null;
  options?: Array<{ value: string; label: string }> | null;
  isReverseScored: boolean;
  subscaleName?: string | null;
  isRequired: boolean;
};

type ClinicalCutoff = {
  min: number;
  max: number;
  label: string;
  severity?: string;
};

type Subscale = {
  name: string;
  items: number[];
};

type FormData = {
  name: string;
  fullName: string;
  instrumentType: InstrumentType;
  description: string;
  instructions: string;
  scaleMin: number;
  scaleMax: number;
  scaleLabels: Record<string, string>;
  scoringMethod: string;
  totalScoreRange: { min: number; max: number } | null;
  clinicalCutoffs: ClinicalCutoff[];
  subscales: Subscale[];
  items: InstrumentItem[];
};

type FullInstrument = {
  id: string;
  name: string;
  fullName: string;
  instrumentType: InstrumentType;
  description?: string | null;
  instructions?: string | null;
  scaleMin: number;
  scaleMax: number;
  scaleLabels?: Record<string, string> | null;
  scoringMethod: string;
  totalScoreRange?: { min: number; max: number } | null;
  clinicalCutoffs?: ClinicalCutoff[] | null;
  subscales?: Subscale[] | null;
  items: InstrumentItem[];
};

type InstrumentFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instrument?: FullInstrument | null;
};

const INSTRUMENT_TYPES: Array<{ value: InstrumentType; label: string }> = [
  { value: 'ptsd', label: 'PTSD' },
  { value: 'depression', label: 'Depression' },
  { value: 'schizophrenia', label: 'Schizophrenia' },
  { value: 'substance_use', label: 'Substance Use' },
  { value: 'anxiety', label: 'Anxiety' },
  { value: 'enrollment', label: 'Enrollment' },
  { value: 'general', label: 'General' },
];

const ITEM_TYPES: Array<{ value: string; label: string }> = [
  { value: 'likert', label: 'Likert Scale' },
  { value: 'multi_choice', label: 'Multiple Choice' },
  { value: 'open_text', label: 'Open Text' },
  { value: 'select', label: 'Select' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
];

const EMPTY_ITEM: InstrumentItem = {
  itemNumber: 1,
  questionText: '',
  itemType: 'likert',
  isReverseScored: false,
  isRequired: true,
};

function getInitialFormData(instrument?: FullInstrument | null): FormData {
  if (instrument) {
    return {
      name: instrument.name,
      fullName: instrument.fullName,
      instrumentType: instrument.instrumentType,
      description: instrument.description ?? '',
      instructions: instrument.instructions ?? '',
      scaleMin: instrument.scaleMin,
      scaleMax: instrument.scaleMax,
      scaleLabels: instrument.scaleLabels ?? {},
      scoringMethod: instrument.scoringMethod,
      totalScoreRange: instrument.totalScoreRange ?? null,
      clinicalCutoffs: instrument.clinicalCutoffs ?? [],
      subscales: instrument.subscales ?? [],
      items: instrument.items.map(item => ({
        ...item,
        isReverseScored: item.isReverseScored ?? false,
        isRequired: item.isRequired ?? true,
      })),
    };
  }

  return {
    name: '',
    fullName: '',
    instrumentType: 'general',
    description: '',
    instructions: '',
    scaleMin: 0,
    scaleMax: 4,
    scaleLabels: {},
    scoringMethod: 'sum',
    totalScoreRange: null,
    clinicalCutoffs: [],
    subscales: [],
    items: [{ ...EMPTY_ITEM }],
  };
}

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none';
const sectionClass = 'space-y-4 border-t border-gray-200 pt-4';

export function InstrumentFormModal({ isOpen, onClose, onSuccess, instrument }: InstrumentFormModalProps) {
  const { user } = useAuth();
  const isEditMode = !!instrument;
  const [form, setForm] = useState<FormData>(() => getInitialFormData(instrument));
  const [saving, setSaving] = useState(false);
  const [loadingInstrument, setLoadingInstrument] = useState(false);

  // Reset form when instrument changes or modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (instrument?.id && !instrument.items?.length) {
      // Need to fetch full instrument with items
      setLoadingInstrument(true);
      authenticatedFetch(`/api/super-admin/assessment-instruments/${instrument.id}`, user)
        .then(res => res.json())
        .then((data) => {
          setForm(getInitialFormData(data.instrument));
        })
        .catch(() => {
          toast.error('Failed to load instrument details');
        })
        .finally(() => setLoadingInstrument(false));
    } else {
      setForm(getInitialFormData(instrument));
    }
  }, [isOpen, instrument, user]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // === Scale Labels ===
  const addScaleLabel = () => {
    const nextKey = String(Object.keys(form.scaleLabels).length);
    updateField('scaleLabels', { ...form.scaleLabels, [nextKey]: '' });
  };

  const updateScaleLabel = (key: string, value: string) => {
    updateField('scaleLabels', { ...form.scaleLabels, [key]: value });
  };

  const removeScaleLabel = (key: string) => {
    const next = { ...form.scaleLabels };
    delete next[key];
    updateField('scaleLabels', next);
  };

  // === Clinical Cutoffs ===
  const addCutoff = () => {
    updateField('clinicalCutoffs', [...form.clinicalCutoffs, { min: 0, max: 0, label: '', severity: '' }]);
  };

  const updateCutoff = (index: number, field: keyof ClinicalCutoff, value: string | number) => {
    const next = [...form.clinicalCutoffs];
    next[index] = { ...next[index]!, [field]: value };
    updateField('clinicalCutoffs', next);
  };

  const removeCutoff = (index: number) => {
    updateField('clinicalCutoffs', form.clinicalCutoffs.filter((_, i) => i !== index));
  };

  // === Subscales ===
  const addSubscale = () => {
    updateField('subscales', [...form.subscales, { name: '', items: [] }]);
  };

  const updateSubscaleName = (index: number, name: string) => {
    const next = [...form.subscales];
    next[index] = { ...next[index]!, name };
    updateField('subscales', next);
  };

  const updateSubscaleItems = (index: number, itemsStr: string) => {
    const next = [...form.subscales];
    next[index] = {
      ...next[index]!,
      items: itemsStr.split(',').map(s => Number.parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n)),
    };
    updateField('subscales', next);
  };

  const removeSubscale = (index: number) => {
    updateField('subscales', form.subscales.filter((_, i) => i !== index));
  };

  // === Items ===
  const addItem = () => {
    const nextNumber = form.items.length > 0 ? Math.max(...form.items.map(i => i.itemNumber)) + 1 : 1;
    updateField('items', [...form.items, { ...EMPTY_ITEM, itemNumber: nextNumber }]);
  };

  const updateItem = (index: number, field: keyof InstrumentItem, value: unknown) => {
    const next = [...form.items];
    next[index] = { ...next[index]!, [field]: value };
    updateField('items', next);
  };

  const removeItem = (index: number) => {
    const next = form.items.filter((_, i) => i !== index);
    // Re-number items
    updateField('items', next.map((item, i) => ({ ...item, itemNumber: i + 1 })));
  };

  // === Validation ===
  const validate = (): string | null => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.fullName.trim()) return 'Full name is required';
    if (form.items.length === 0) return 'At least one item is required';
    for (const item of form.items) {
      if (!item.questionText.trim()) return `Item ${item.itemNumber}: question text is required`;
    }
    return null;
  };

  // === Submit ===
  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        scaleLabels: Object.keys(form.scaleLabels).length > 0 ? form.scaleLabels : null,
        totalScoreRange: form.totalScoreRange,
        clinicalCutoffs: form.clinicalCutoffs.length > 0 ? form.clinicalCutoffs : null,
        subscales: form.subscales.length > 0 ? form.subscales : null,
      };

      const url = isEditMode
        ? `/api/super-admin/assessment-instruments/${instrument!.id}`
        : '/api/super-admin/assessment-instruments';

      const response = await authenticatedFetch(url, user, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save instrument');
      }

      toast.success(isEditMode ? 'Instrument updated' : 'Instrument created');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save instrument');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Instrument' : 'Add Instrument'}
      size="2xl"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={saving}>
            {isEditMode ? 'Save Changes' : 'Create Instrument'}
          </Button>
        </>
      )}
    >
      {loadingInstrument
        ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          )
        : (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="mb-3 text-sm font-semibold tracking-wider text-gray-900 uppercase">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Short Name *</label>
                    <input
                      className={inputClass}
                      value={form.name}
                      onChange={e => updateField('name', e.target.value)}
                      placeholder="e.g. PCL-5"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Instrument Type *</label>
                    <select
                      className={inputClass}
                      value={form.instrumentType}
                      onChange={e => updateField('instrumentType', e.target.value as InstrumentType)}
                    >
                      {INSTRUMENT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Full Name *</label>
                    <input
                      className={inputClass}
                      value={form.fullName}
                      onChange={e => updateField('fullName', e.target.value)}
                      placeholder="e.g. PTSD Checklist for DSM-5"
                      maxLength={255}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Description</label>
                    <textarea
                      className={`${inputClass} resize-none`}
                      value={form.description}
                      onChange={e => updateField('description', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Instructions</label>
                    <textarea
                      className={`${inputClass} resize-none`}
                      value={form.instructions}
                      onChange={e => updateField('instructions', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Scale Configuration */}
              <div className={sectionClass}>
                <h3 className="text-sm font-semibold tracking-wider text-gray-900 uppercase">Scale Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Scale Min</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={form.scaleMin}
                      onChange={e => updateField('scaleMin', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Scale Max</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={form.scaleMax}
                      onChange={e => updateField('scaleMax', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Scale Labels</label>
                    <button type="button" onClick={addScaleLabel} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
                      <Plus className="h-3 w-3" />
                      Add Label
                    </button>
                  </div>
                  {Object.entries(form.scaleLabels).map(([key, value]) => (
                    <div key={key} className="mb-2 flex items-center gap-2">
                      <input
                        className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        value={key}
                        readOnly
                        title="Scale value"
                      />
                      <input
                        className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        value={value}
                        onChange={e => updateScaleLabel(key, e.target.value)}
                        placeholder="Label text"
                      />
                      <button type="button" onClick={() => removeScaleLabel(key)} className="text-gray-400 hover:text-red-500">
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoring */}
              <div className={sectionClass}>
                <h3 className="text-sm font-semibold tracking-wider text-gray-900 uppercase">Scoring</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Scoring Method</label>
                    <input
                      className={inputClass}
                      value={form.scoringMethod}
                      onChange={e => updateField('scoringMethod', e.target.value)}
                      placeholder="sum"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Total Score Min</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={form.totalScoreRange?.min ?? ''}
                      onChange={e => updateField('totalScoreRange', {
                        min: Number(e.target.value),
                        max: form.totalScoreRange?.max ?? 0,
                      })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Total Score Max</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={form.totalScoreRange?.max ?? ''}
                      onChange={e => updateField('totalScoreRange', {
                        min: form.totalScoreRange?.min ?? 0,
                        max: Number(e.target.value),
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Cutoffs */}
              <div className={sectionClass}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-wider text-gray-900 uppercase">Clinical Cutoffs</h3>
                  <button type="button" onClick={addCutoff} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
                    <Plus className="h-3 w-3" />
                    Add Cutoff
                  </button>
                </div>
                {form.clinicalCutoffs.map((cutoff, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      value={cutoff.min}
                      onChange={e => updateCutoff(i, 'min', Number(e.target.value))}
                      placeholder="Min"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      value={cutoff.max}
                      onChange={e => updateCutoff(i, 'max', Number(e.target.value))}
                      placeholder="Max"
                    />
                    <input
                      className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      value={cutoff.label}
                      onChange={e => updateCutoff(i, 'label', e.target.value)}
                      placeholder="Label (e.g. Minimal)"
                    />
                    <input
                      className="w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      value={cutoff.severity ?? ''}
                      onChange={e => updateCutoff(i, 'severity', e.target.value)}
                      placeholder="Severity"
                    />
                    <button type="button" onClick={() => removeCutoff(i)} className="text-gray-400 hover:text-red-500">
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Subscales */}
              <div className={sectionClass}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-wider text-gray-900 uppercase">Subscales</h3>
                  <button type="button" onClick={addSubscale} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
                    <Plus className="h-3 w-3" />
                    Add Subscale
                  </button>
                </div>
                {form.subscales.map((subscale, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="w-40 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      value={subscale.name}
                      onChange={e => updateSubscaleName(i, e.target.value)}
                      placeholder="Subscale name"
                    />
                    <input
                      className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      value={subscale.items.join(', ')}
                      onChange={e => updateSubscaleItems(i, e.target.value)}
                      placeholder="Item numbers (e.g. 1, 2, 3)"
                    />
                    <button type="button" onClick={() => removeSubscale(i)} className="text-gray-400 hover:text-red-500">
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div className={sectionClass}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-wider text-gray-900 uppercase">
                    Items (
                    {form.items.length}
                    )
                  </h3>
                  <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
                    <Plus className="h-3 w-3" />
                    Add Item
                  </button>
                </div>
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {form.items.map((item, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">
                          Item
                          {item.itemNumber}
                        </span>
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500">
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <textarea
                          className={`${inputClass} resize-none`}
                          value={item.questionText}
                          onChange={e => updateItem(i, 'questionText', e.target.value)}
                          placeholder="Question text *"
                          rows={2}
                        />
                        <div className="grid grid-cols-4 gap-2">
                          <select
                            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            value={item.itemType}
                            onChange={e => updateItem(i, 'itemType', e.target.value)}
                          >
                            {ITEM_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                          <input
                            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            value={item.subscaleName ?? ''}
                            onChange={e => updateItem(i, 'subscaleName', e.target.value || null)}
                            placeholder="Subscale"
                          />
                          <label className="flex items-center gap-1.5 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={item.isReverseScored}
                              onChange={e => updateItem(i, 'isReverseScored', e.target.checked)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Reverse
                          </label>
                          <label className="flex items-center gap-1.5 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={item.isRequired}
                              onChange={e => updateItem(i, 'isRequired', e.target.checked)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Required
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
    </Modal>
  );
}
