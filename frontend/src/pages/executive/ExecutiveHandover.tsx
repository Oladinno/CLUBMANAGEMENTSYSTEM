import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Plus, ChevronDown, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../store/AuthContext';

interface Club { id: number; name: string; }

interface Transition {
  id: number;
  position: string;
  status: string;
  notes: string;
  created_at: string;
  outgoing_user?: { first_name: string; last_name: string; email: string };
  incoming_user?: { first_name: string; last_name: string; email: string };
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
};

export const ExecutiveHandover: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ incoming_user_email: '', position: '', notes: '' });
  const [formError, setFormError] = useState('');

  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ['exec-clubs-handover'],
    queryFn: async () => (await api.get('/clubs')).data,
  });

  React.useEffect(() => {
    if (clubs.length > 0 && selectedClubId === null) setSelectedClubId(clubs[0].id);
  }, [clubs]);

  const { data: transitions = [], isLoading } = useQuery<Transition[]>({
    queryKey: ['leadership-transitions', selectedClubId],
    enabled: selectedClubId !== null,
    queryFn: async () => (await api.get(`/leadership/club/${selectedClubId}`)).data,
  });

  // Look up incoming user ID by email
  const initiateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      // First find user by email
      const usersRes = await api.get('/admin/users');
      const incoming = usersRes.data.find((u: any) => u.email === data.incoming_user_email);
      if (!incoming) throw new Error('User not found with that email.');
      await api.post('/leadership/initiate', {
        club_id: selectedClubId,
        incoming_user_id: incoming.id,
        position: data.position,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leadership-transitions', selectedClubId] });
      setShowForm(false);
      setForm({ incoming_user_email: '', position: '', notes: '' });
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err?.message || err?.response?.data?.detail || 'Failed to initiate handover.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.incoming_user_email || !form.position) {
      setFormError('Incoming user email and position are required.');
      return;
    }
    initiateMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leadership Handover</h1>
          <p className="text-slate-500 text-sm mt-1">Initiate leadership transitions for your club positions.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#002147] text-white text-sm font-semibold rounded-xl hover:bg-blue-900 transition shadow"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Initiate Handover'}
        </button>
      </div>

      {/* Club Selector */}
      {clubs.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Club</label>
          <div className="relative max-w-sm">
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              value={selectedClubId ?? ''}
              onChange={e => setSelectedClubId(Number(e.target.value) || null)}
            >
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Initiate Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" /> New Leadership Transition
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Incoming Leader's Email *</label>
              <input
                type="email"
                required
                placeholder="student@aun.edu.ng"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.incoming_user_email}
                onChange={e => setForm(f => ({ ...f, incoming_user_email: e.target.value }))}
              />
              <p className="text-xs text-slate-400 mt-1">The email of the student taking over this position.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Position *</label>
              <select
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none bg-white"
                value={form.position}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
              >
                <option value="">— Select position —</option>
                <option>President</option>
                <option>Vice President</option>
                <option>Secretary</option>
                <option>Treasurer</option>
                <option>Events Coordinator</option>
                <option>PRO</option>
                <option>Financial Secretary</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Transition Notes</label>
              <textarea
                rows={3}
                placeholder="Any notes about this handover…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            {formError && <p className="text-red-600 text-sm font-medium">{formError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={initiateMutation.isPending}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {initiateMutation.isPending ? 'Submitting…' : 'Submit Handover Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Transition History</h2>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-slate-400">Loading…</div>
        ) : transitions.length === 0 ? (
          <div className="p-10 text-center">
            <ArrowRightLeft className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No leadership transitions recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transitions.map(t => (
              <div key={t.id} className="p-5 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800">{t.position}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[t.status] || STATUS_STYLES.pending}`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> From: {t.outgoing_user?.first_name} {t.outgoing_user?.last_name}
                      </span>
                      <span>→</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> To: {t.incoming_user?.first_name} {t.incoming_user?.last_name}
                      </span>
                    </div>
                    {t.notes && <p className="text-xs text-slate-500 italic">"{t.notes}"</p>}
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
