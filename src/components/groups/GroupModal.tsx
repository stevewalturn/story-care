'use client';

import { useState } from 'react';
import { X, Plus, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface GroupMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface Group {
  id?: string;
  name: string;
  description?: string;
  members: GroupMember[];
}

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: Group) => void;
  group?: Group;
  availablePatients: GroupMember[];
}

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
    }
  );

  const handleAddMember = (patient: GroupMember) => {
    if (!formData.members.find((m) => m.id === patient.id)) {
      setFormData({
        ...formData,
        members: [...formData.members, patient],
      });
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setFormData({
      ...formData,
      members: formData.members.filter((m) => m.id !== memberId),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const availablePatientsFiltered = availablePatients.filter(
    (p) => !formData.members.find((m) => m.id === p.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {group ? 'Edit Group' : 'Create New Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Group Information</h3>

            <Input
              label="Group Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Men's Support Group"
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the group..."
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
              {formData.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{member.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {formData.members.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No members added yet
                </div>
              )}
            </div>

            {/* Add Members */}
            {availablePatientsFiltered.length > 0 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Available Patients
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availablePatientsFiltered.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleAddMember(patient)}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {patient.avatarUrl ? (
                          <img
                            src={patient.avatarUrl}
                            alt={patient.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                        <span className="text-sm text-gray-900">{patient.name}</span>
                      </div>
                      <Plus className="w-4 h-4 text-indigo-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
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
