/**
 * Org Admin Therapists Page
 * Manage therapist accounts in the organization
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Therapist {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  patientCount?: number;
  createdAt: string;
}

export default function TherapistsPage() {
  const { user } = useAuth();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchTherapists();
    }
  }, [user]);

  const fetchTherapists = async () => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/therapists', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTherapists(data.therapists || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTherapists = therapists.filter(
    (therapist) =>
      therapist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      therapist.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Therapists</h1>
          <p className="mt-2 text-gray-600">
            Manage therapist accounts in your organization
          </p>
        </div>
        <Button variant="primary">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Therapist
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search therapists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Therapists Grid */}
      {filteredTherapists.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery ? 'No therapists found' : 'No therapists in your organization'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTherapists.map((therapist) => (
            <div
              key={therapist.id}
              className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                  <User className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {therapist.name}
                  </h3>
                  <p className="text-sm text-gray-500">{therapist.email}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Patients</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {therapist.patientCount || 0}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    therapist.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {therapist.status}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="secondary" className="flex-1 text-sm">
                  View Profile
                </Button>
                <Button variant="secondary" className="text-sm">
                  •••
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
