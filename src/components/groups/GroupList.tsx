'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Users as UsersIcon, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface GroupMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  members: GroupMember[];
  createdAt: Date;
}

interface GroupListProps {
  groups: Group[];
  onAddClick: () => void;
  onEditClick: (group: Group) => void;
  onDeleteClick: (groupId: string) => void;
}

export function GroupList({
  groups,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: GroupListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Therapy Groups</h1>
          <p className="text-sm text-gray-600">
            Manage group therapy sessions and participants
          </p>
        </div>
        <Button variant="primary" onClick={onAddClick}>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search groups..."
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Group Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                  <p className="text-sm text-gray-600">{group.members.length} members</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditClick(group)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete group "${group.name}"?`)) {
                      onDeleteClick(group.id);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description */}
            {group.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {group.description}
              </p>
            )}

            {/* Members Preview */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-700 uppercase">Members</p>
              <div className="flex -space-x-2">
                {group.members.slice(0, 5).map((member) => (
                  member.avatarUrl ? (
                    <img
                      key={member.id}
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      title={member.name}
                    />
                  ) : (
                    <div
                      key={member.id}
                      className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center"
                      title={member.name}
                    >
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )
                ))}
                {group.members.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700">
                      +{group.members.length - 5}
                    </span>
                  </div>
                )}
              </div>

              {/* Member Names */}
              <div className="text-xs text-gray-600">
                {group.members.length > 0 ? (
                  <span className="line-clamp-2">
                    {group.members.map(m => m.name).join(', ')}
                  </span>
                ) : (
                  <span className="text-gray-400">No members yet</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <div className="col-span-full text-center py-16">
            <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'No groups found' : 'No therapy groups yet'}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={onAddClick}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Group
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
