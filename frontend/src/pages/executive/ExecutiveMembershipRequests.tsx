import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react';
import { api } from '../../api/client';

interface Membership {
  id: number;
  user_id: number;
  club_id: number;
  status: string;
  role_in_club: string;
  joined_at: string | null;
  user?: { first_name: string; last_name: string; email: string };
  club?: { name: string };
}

interface Club {
  id: number;
  name: string;
}

export const ExecutiveMembershipRequests: React.FC = () => {
  const qc = useQueryClient();
  const [selectedClub, setSelectedClub] = useState<number | null>(null);
  const [remarks, setRemarks] = useState<Record<number, string>>({});

  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ['exec-clubs'],
    queryFn: async () => {
      const r = await api.get('/clubs');
      return r.data;
    },
  });

  const { data: memberships = [], isLoading } = useQuery<Membership[]>({
    queryKey: ['club-memberships', selectedClub],
    enabled: selectedClub !== null,
    queryFn: async () => {
      const r = await api.get(`/memberships/club/${selectedClub}?status=pending`);
      return r.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, remark }: { id: number; action: string; remark: string }) => {
      await api.put(`/memberships/${id}/review`, { action, remarks: remark });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-memberships', selectedClub] }),
  });

  const handleAction = (id: number, action: 'approve' | 'reject') => {
    reviewMutation.mutate({ id, action, remark: remarks[id] || '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Membership Requests</h1>
        <p className="text-slate-500 text-sm mt-1">Review and approve pending membership applications for your clubs.</p>
      </div>

      {/* Club Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Select Club</label>
        <div className="relative max-w-sm">
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            value={selectedClub ?? ''}
            onChange={e => setSelectedClub(Number(e.target.value) || null)}
          >
            <option value="">— Choose a club —</option>
            {clubs.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {selectedClub === null && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-10 text-center">
          <Users className="w-10 h-10 text-blue-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Select a club above to view pending membership requests.</p>
        </div>
      )}

      {selectedClub !== null && isLoading && (
        <div className="text-center py-16 text-slate-400">Loading requests…</div>
      )}

      {selectedClub !== null && !isLoading && memberships.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">No pending membership requests.</p>
        </div>
      )}

      {memberships.length > 0 && (
        <div className="space-y-3">
          {memberships.map(m => (
            <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm uppercase">
                    {m.user?.first_name?.[0]}{m.user?.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {m.user?.first_name} {m.user?.last_name}
                    </p>
                    <p className="text-xs text-slate-500">{m.user?.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Optional remarks…"
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={remarks[m.id] || ''}
                    onChange={e => setRemarks(r => ({ ...r, [m.id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(m.id, 'approve')}
                      disabled={reviewMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(m.id, 'reject')}
                      disabled={reviewMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
