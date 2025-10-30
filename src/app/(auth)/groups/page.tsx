'use client';

import { useEffect, useState } from 'react';
import { GroupList } from '@/components/groups/GroupList';
import { GroupModal } from '@/components/groups/GroupModal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/AuthenticatedFetch';

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

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [availablePatients, setAvailablePatients] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | undefined>();

  useEffect(() => {
    fetchGroups();
    fetchPatients();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/groups?therapistId=${user?.uid}`, user);
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }

      const data = await response.json();
      setGroups(data.groups.map((g: any) => ({
        ...g,
        createdAt: new Date(g.createdAt),
      })));
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await authenticatedFetch('/api/patients', user);
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();
      setAvailablePatients(data.patients || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const handleAddClick = () => {
    setEditingGroup(undefined);
    setShowModal(true);
  };

  const handleEditClick = (group: Group) => {
    setEditingGroup(group);
    setShowModal(true);
  };

  const handleSave = async (groupData: Partial<Group>) => {
    try {
      if (editingGroup) {
        // Update existing group
        const response = await authenticatedPut(`/api/groups/${editingGroup.id}`, user, {
          name: groupData.name,
          description: groupData.description,
          memberIds: groupData.members?.map(m => m.id),
        });

        if (!response.ok) {
          throw new Error('Failed to update group');
        }
      } else {
        // Create new group
        const response = await authenticatedPost('/api/groups', user, {
          name: groupData.name,
          description: groupData.description,
          memberIds: groupData.members?.map(m => m.id),
          therapistId: user?.uid,
        });

        if (!response.ok) {
          throw new Error('Failed to create group');
        }
      }

      // Refresh groups list
      await fetchGroups();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save group:', error);
      alert('Failed to save group. Please try again.');
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) {
      return;
    }

    try {
      const response = await authenticatedDelete(`/api/groups/${groupId}`, user);

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      // Refresh groups list
      await fetchGroups();
    } catch (error) {
      console.error('Failed to delete group:', error);
      alert('Failed to delete group. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

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
