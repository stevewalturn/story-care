'use client';

import { Plus, Trash2, User, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type GroupMember = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type Group = {
  id?: string;
  name: string;
  description?: string;
  members: GroupMember[];
};

type GroupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: Group) => void;
  group?: Group;
  availablePatients: GroupMember[];
};

export function GroupModal({
  isOpen,
  onClose,
  onSave,
  group,
  availablePatients,
}: GroupModalProps) {
  const [formData, setFormData] = useState<Group>(
    group || {
      name: '',
      description: '',
      members: [],
    },
  );

  const handleAddMember = (patient: GroupMember) => {
    if (!formData.members.find(m => m.id === patient.id)) {
      setFormData({
        ...formData,
        members: [...formData.members, patient],
      });
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setFormData({
      ...formData,
      members: formData.members.filter(m => m.id !== memberId),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const availablePatientsFiltered = availablePatients.filter(
    p => !formData.members.find(m => m.id === p.id),
  );

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {group ? 'Edit Group' : 'Create New Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Group Information</h3>

            <Input
              label="Group Name *"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Men's Support Group"
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the group..."
                className="h-20 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Members */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Group Members</h3>
            <p className="text-sm text-gray-600">
              Add patients to this therapy group
            </p>

            {/* Current Members */}
            <div className="space-y-2">
              {formData.members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    {member.avatarUrl
                      ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )
                      : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                            <User className="h-5 w-5 text-indigo-600" />
                          </div>
                        )}
                    <span className="font-medium text-gray-900">{member.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {formData.members.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  No members added yet
                </div>
              )}
            </div>

            {/* Add Members */}
            {availablePatientsFiltered.length > 0 && (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
                <p className="mb-3 text-sm font-medium text-gray-700">
                  Available Patients
                </p>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {availablePatientsFiltered.map(patient => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleAddMember(patient)}
                      className="flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {patient.avatarUrl
                          ? (
                              <img
                                src={patient.avatarUrl}
                                alt={patient.name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            )
                          : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                            )}
                        <span className="text-sm text-gray-900">{patient.name}</span>
                      </div>
                      <Plus className="h-4 w-4 text-indigo-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!formData.name || formData.members.length === 0}>
              {group ? 'Update Group' : 'Create Group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
