import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Building2, Plus, Shield, Ban, CheckCircle, Search, Edit } from 'lucide-react';

export const AdminClubs: React.FC = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchClubs = async () => {
    try {
      const res = await api.get('/clubs');
      setClubs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleToggleStatus = async (clubId: number, currentSuspended: boolean) => {
    const reason = !currentSuspended ? prompt('Enter reason for suspension:') : '';
    if (!currentSuspended && !reason) return;

    try {
      await api.put(`/admin/clubs/${clubId}/status`, null, {
        params: {
          is_active: currentSuspended,
          is_suspended: !currentSuspended,
          suspension_reason: reason || null
        }
      });
      fetchClubs();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update club status');
    }
  };

  const filtered = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Governance & Oversight</h1>
          <p className="text-xs text-slate-500 mt-1">Monitor, suspend, or reactivate university-recognized student clubs.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter organizations by title or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4">Organization Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Meeting Schedule</th>
                <th className="p-4">Members</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((club) => (
                <tr key={club.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-slate-900 flex items-center space-x-3">
                    <img
                      src={club.logo_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100'}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <span>{club.name}</span>
                  </td>
                  <td className="p-4 text-slate-600">{club.category?.name || 'General'}</td>
                  <td className="p-4 text-slate-500">{club.meeting_schedule || 'TBA'}</td>
                  <td className="p-4 font-semibold text-slate-800">{club.member_count}</td>
                  <td className="p-4">
                    {club.is_suspended ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                        Suspended
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(club.id, club.is_suspended)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                        club.is_suspended
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow'
                          : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                      }`}
                    >
                      {club.is_suspended ? 'Reactivate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
