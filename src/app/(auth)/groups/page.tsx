'use client';

import { useState } from 'react';
import { GroupList } from '@/components/groups/GroupList';
import { GroupModal } from '@/components/groups/GroupModal';

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

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: "Men's Support Group",
      description: 'A supportive space for men to discuss challenges and growth',
      members: [
        { id: '2', name: 'Michael Chen', avatarUrl: 'https://i.pravatar.cc/150?img=3' },
        { id: '4', name: 'James Wilson', avatarUrl: 'https://i.pravatar.cc/150?img=5' },
        { id: '5', name: 'Robert Davis', avatarUrl: 'https://i.pravatar.cc/150?img=7' },
      ],
      createdAt: new Date(2025, 8, 1),
    },
    {
      id: '2',
      name: 'Anxiety Management',
      description: 'Learning coping strategies for anxiety and stress',
      members: [
        { id: '1', name: 'Emma Wilson', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
        { id: '3', name: 'Sarah Martinez' },
        { id: '6', name: 'Lisa Anderson', avatarUrl: 'https://i.pravatar.cc/150?img=9' },
        { id: '7', name: 'Jennifer Brown', avatarUrl: 'https://i.pravatar.cc/150?img=10' },
      ],
      createdAt: new Date(2025, 8, 15),
    },
    {
      id: '3',
      name: 'Young Adults Circle',
      description: 'Navigating life transitions and building resilience',
      members: [
        { id: '3', name: 'Sarah Martinez' },
        { id: '8', name: 'David Lee', avatarUrl: 'https://i.pravatar.cc/150?img=12' },
      ],
      createdAt: new Date(2025, 9, 1),
    },
  ]);

  // Mock available patients - in real app, fetch from API
  const availablePatients: GroupMember[] = [
    { id: '1', name: 'Emma Wilson', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'Michael Chen', avatarUrl: 'https://i.pravatar.cc/150?img=3' },
    { id: '3', name: 'Sarah Martinez' },
    { id: '4', name: 'James Wilson', avatarUrl: 'https://i.pravatar.cc/150?img=5' },
    { id: '5', name: 'Robert Davis', avatarUrl: 'https://i.pravatar.cc/150?img=7' },
    { id: '6', name: 'Lisa Anderson', avatarUrl: 'https://i.pravatar.cc/150?img=9' },
    { id: '7', name: 'Jennifer Brown', avatarUrl: 'https://i.pravatar.cc/150?img=10' },
    { id: '8', name: 'David Lee', avatarUrl: 'https://i.pravatar.cc/150?img=12' },
  ];

  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | undefined>();

  const handleAddClick = () => {
    setEditingGroup(undefined);
    setShowModal(true);
  };

  const handleEditClick = (group: Group) => {
    setEditingGroup(group);
    setShowModal(true);
  };

  const handleSave = async (groupData: Partial<Group>) => {
    if (editingGroup) {
      // Update existing group
      setGroups(
        groups.map((g) =>
          g.id === editingGroup.id ? { ...g, ...groupData } : g
        )
      );
    } else {
      // Create new group
      const newGroup: Group = {
        id: Date.now().toString(),
        name: groupData.name!,
        description: groupData.description,
        members: groupData.members || [],
        createdAt: new Date(),
      };
      setGroups([...groups, newGroup]);
    }

    // In real implementation, call API:
    // await fetch('/api/groups', { method: 'POST', body: JSON.stringify(groupData) });
  };

  const handleDelete = async (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId));
    // In real implementation: await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
  };

  return (
    <div className="p-8">
      <GroupList
        groups={groups}
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDelete}
      />

      <GroupModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        group={editingGroup}
        availablePatients={availablePatients}
      />
    </div>
  );
}
