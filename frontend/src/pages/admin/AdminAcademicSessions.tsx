import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Calendar, CheckCircle } from 'lucide-react';
import { api } from '../../api/client';

interface AcademicSession {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export const AdminAcademicSessions: React.FC = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '' });
  const [formError, setFormError] = useState('');

  const { data: sessions = [], isLoading } = useQuery<AcademicSession[]>({
    queryKey: ['academic-sessions'],
    queryFn: async () => (await api.get('/admin/academic-sessions')).data,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      await api.post('/admin/academic-sessions', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic-sessions'] });
      setShowForm(false);
      setForm({ name: '', start_date: '', end_date: '' });
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail || 'Failed to create session.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.start_date || !form.end_date) {
      setFormError('All fields are required.');
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Academic Sessions</h1>
          <p className="text-slate-500 text-sm mt-1">Manage academic calendar sessions for the institution.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#002147] text-white text-sm font-semibold rounded-xl hover:bg-blue-900 transition shadow"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'New Session'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Sessions', value: sessions.length, icon: BookOpen, color: 'blue' },
          { label: 'Current Session', value: sessions.find(s => s.is_current)?.name || 'None', icon: CheckCircle, color: 'green', isText: true },
          { label: 'Completed', value: sessions.filter(s => !s.is_current).length, icon: Calendar, color: 'slate' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          const colors: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            slate: 'bg-slate-100 text-slate-500',
          };
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[stat.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                {stat.isText ? (
                  <p className="text-sm font-bold text-slate-800 max-w-[160px] truncate">{stat.value}</p>
                ) : (
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" /> New Academic Session
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Session Name *</label>
                <input
                  required
                  placeholder="e.g. 2024/2025 First Semester"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Date *</label>
                <input
                  type="date"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">End Date *</label>
                <input
                  type="date"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
            {formError && <p className="text-red-600 text-sm font-medium">{formError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating…' : 'Create Session'}
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

      {/* Sessions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Session History</h2>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-slate-400">Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div className="p-10 text-center">
            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No academic sessions created yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                  <th className="text-left px-6 py-3">Session</th>
                  <th className="text-left px-6 py-3">Start Date</th>
                  <th className="text-left px-6 py-3">End Date</th>
                  <th className="text-left px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map(session => (
                  <tr key={session.id} className={`hover:bg-slate-50 transition ${session.is_current ? 'bg-blue-50/40' : ''}`}>
                    <td className="px-6 py-4 font-semibold text-slate-800">{session.name}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(session.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(session.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {session.is_current ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                          <CheckCircle className="w-3 h-3" /> Current
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
