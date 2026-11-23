import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Users, CheckCircle, XCircle, Clock, Award } from 'lucide-react';

export const StudentMyClubs: React.FC = () => {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/memberships/my');
        setMemberships(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleLeave = async (membershipId: number) => {
    if (!confirm('Are you sure you want to leave this club?')) return;
    try {
      await api.post(`/memberships/${membershipId}/leave`);
      setMemberships((prev) => prev.filter((m) => m.id !== membershipId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to leave club');
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: 'bg-emerald-100 text-emerald-800',
      pending: 'bg-amber-100 text-amber-800',
      rejected: 'bg-red-100 text-red-700',
      suspended: 'bg-orange-100 text-orange-800',
      left_club: 'bg-slate-100 text-slate-500',
    };
    return map[status] || 'bg-slate-100 text-slate-500';
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading your club memberships...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Club Memberships</h1>
        <p className="text-xs text-slate-500 mt-1">Track all your enrollment statuses, organizational roles, and join dates.</p>
      </div>

      {memberships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {memberships.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={m.club?.logo_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100'}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{m.club?.name}</h3>
                      <p className="text-xs text-slate-500">{m.club?.category?.name}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge(m.status)}`}>
                    {m.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div>
                    <p className="text-slate-400 font-medium">Role</p>
                    <p className="font-bold text-slate-800">{m.position || 'General Member'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Joined</p>
                    <p className="font-bold text-slate-800">
                      {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : 'Pending'}
                    </p>
                  </div>
                </div>

                {m.review_remarks && (
                  <p className="mt-3 text-xs italic text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    "{m.review_remarks}"
                  </p>
                )}
              </div>

              {m.status === 'approved' && (
                <div className="px-5 pb-4">
                  <button
                    onClick={() => handleLeave(m.id)}
                    className="w-full py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition"
                  >
                    Leave Club
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-16 text-center text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">You have not joined any clubs yet.</p>
          <p className="text-xs mt-1">Explore the Club Directory and submit your membership application.</p>
        </div>
      )}
    </div>
  );
};
