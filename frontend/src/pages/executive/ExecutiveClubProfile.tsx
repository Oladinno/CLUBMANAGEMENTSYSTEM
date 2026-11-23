import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Edit2, Save, X, Users, Mail, Phone, MapPin } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../store/AuthContext';

interface Club {
  id: number;
  name: string;
  description: string;
  mission: string;
  objectives: string;
  meeting_schedule: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  category?: { name: string };
}

interface Executive {
  id: number;
  position: string;
  is_active: boolean;
  user?: { first_name: string; last_name: string; email: string };
}

export const ExecutiveClubProfile: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Club>>({});
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);

  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ['all-clubs'],
    queryFn: async () => (await api.get('/clubs')).data,
  });

  // Auto-select first club on load
  React.useEffect(() => {
    if (clubs.length > 0 && selectedClubId === null) {
      setSelectedClubId(clubs[0].id);
    }
  }, [clubs]);

  const club = clubs.find(c => c.id === selectedClubId);

  const { data: executives = [] } = useQuery<Executive[]>({
    queryKey: ['club-executives', selectedClubId],
    enabled: selectedClubId !== null,
    queryFn: async () => (await api.get(`/clubs/${selectedClubId}/executives`)).data,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Club>) => {
      await api.put(`/clubs/${selectedClubId}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-clubs'] });
      setEditing(false);
    },
  });

  const startEdit = () => {
    if (club) setForm({ ...club });
    setEditing(true);
  };

  const handleChange = (field: keyof Club, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => updateMutation.mutate(form);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Club Profile</h1>
          <p className="text-slate-500 text-sm mt-1">View and update your club's information.</p>
        </div>
        {clubs.length > 1 && (
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedClubId ?? ''}
            onChange={e => { setSelectedClubId(Number(e.target.value)); setEditing(false); }}
          >
            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {!club ? (
        <div className="text-center py-16 text-slate-400">No club data found.</div>
      ) : (
        <>
          {/* Club Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[#002147] to-blue-600" />
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                    {club.logo_url ? (
                      <img src={club.logo_url} alt="logo" className="w-12 h-12 object-cover rounded-xl" />
                    ) : (
                      <Building2 className="w-7 h-7 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{club.name}</h2>
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {club.category?.name}
                    </span>
                    <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full border ${
                      club.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {club.status}
                    </span>
                  </div>
                </div>
                {!editing ? (
                  <button
                    onClick={startEdit}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                  {editing ? (
                    <textarea
                      rows={3}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      value={form.description || ''}
                      onChange={e => handleChange('description', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed">{club.description || '—'}</p>
                  )}
                </div>

                {/* Mission */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Mission</label>
                  {editing ? (
                    <textarea
                      rows={2}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      value={form.mission || ''}
                      onChange={e => handleChange('mission', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed">{club.mission || '—'}</p>
                  )}
                </div>

                {/* Meeting Schedule */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    <MapPin className="inline w-3.5 h-3.5 mr-1" />Meeting Schedule
                  </label>
                  {editing ? (
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={form.meeting_schedule || ''}
                      onChange={e => handleChange('meeting_schedule', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-slate-700">{club.meeting_schedule || '—'}</p>
                  )}
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    <Mail className="inline w-3.5 h-3.5 mr-1" />Contact Email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={form.contact_email || ''}
                      onChange={e => handleChange('contact_email', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-slate-700">{club.contact_email || '—'}</p>
                  )}
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    <Phone className="inline w-3.5 h-3.5 mr-1" />Contact Phone
                  </label>
                  {editing ? (
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={form.contact_phone || ''}
                      onChange={e => handleChange('contact_phone', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-slate-700">{club.contact_phone || '—'}</p>
                  )}
                </div>

                {/* Logo URL */}
                {editing && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Logo URL</label>
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={form.logo_url || ''}
                      onChange={e => handleChange('logo_url', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {updateMutation.isError && (
                <p className="mt-4 text-red-600 text-sm font-medium">Failed to update. Please try again.</p>
              )}
            </div>
          </div>

          {/* Executive Roster */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-800">Executive Roster</h2>
            </div>
            {executives.length === 0 ? (
              <p className="text-sm text-slate-500">No executives found.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {executives.map(exec => (
                  <div key={exec.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-[#002147] flex items-center justify-center font-bold text-white text-xs uppercase">
                        {exec.user?.first_name?.[0]}{exec.user?.last_name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{exec.user?.first_name} {exec.user?.last_name}</p>
                        <p className="text-xs text-slate-500">{exec.user?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        {exec.position}
                      </span>
                      {exec.is_active && (
                        <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Active</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
