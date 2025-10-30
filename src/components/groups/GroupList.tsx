'use client';

import { Edit2, Plus, Search, Trash2, User, Users as UsersIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type GroupMember = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type Group = {
  id: string;
  name: string;
  description?: string;
  members: GroupMember[];
  createdAt: Date;
};

type GroupListProps = {
  groups: Group[];
  onAddClick: () => void;
  onEditClick: (group: Group) => void;
  onDeleteClick: (groupId: string) => void;
};

export function GroupList({
  groups,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: GroupListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
    || (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Therapy Groups</h1>
          <p className="text-sm text-gray-600">
            Manage group therapy sessions and participants
          </p>
        </div>
        <Button variant="primary" onClick={onAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search groups..."
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Group Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.map(group => (
          <div
            key={group.id}
            className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                  <UsersIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-600">
                    {group.members.length}
                    {' '}
                    members
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditClick(group)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete group "${group.name}"?`)) {
                      onDeleteClick(group.id);
                    }
                  }}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Description */}
            {group.description && (
              <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                {group.description}
              </p>
            )}

            {/* Members Preview */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-700 uppercase">Members</p>
              <div className="flex -space-x-2">
                {group.members.slice(0, 5).map(member => (
                  member.avatarUrl
                    ? (
                        <img
                          key={member.id}
                          src={member.avatarUrl}
                          alt={member.name}
                          className="h-8 w-8 rounded-full border-2 border-white object-cover"
                          title={member.name}
                        />
                      )
                    : (
                        <div
                          key={member.id}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200"
                          title={member.name}
                        >
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      )
                ))}
                {group.members.length > 5 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-300">
                    <span className="text-xs font-medium text-gray-700">
                      +
                      {group.members.length - 5}
                    </span>
                  </div>
                )}
              </div>

              {/* Member Names */}
              <div className="text-xs text-gray-600">
                {group.members.length > 0
                  ? (
                      <span className="line-clamp-2">
                        {group.members.map(m => m.name).join(', ')}
                      </span>
                    )
                  : (
                      <span className="text-gray-400">No members yet</span>
                    )}
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <UsersIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <p className="mb-4 text-gray-600">
              {searchQuery ? 'No groups found' : 'No therapy groups yet'}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={onAddClick}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Group
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
