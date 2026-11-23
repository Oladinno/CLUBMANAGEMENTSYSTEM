import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Search, Filter, Users, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export const ClubDirectory: React.FC = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [applyingClubId, setApplyingClubId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        const [cRes, catRes] = await Promise.all([
          api.get('/clubs'),
          api.get('/clubs/categories')
        ]);
        setClubs(cRes.data);
        setCategories(catRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDirectory();
  }, []);

  const handleApply = async (clubId: number) => {
    try {
      await api.post('/memberships/apply', {
        club_id: clubId,
        application_reason: reason || 'Excited to contribute to club activities and develop new skills.'
      });
      setSuccessMsg('Membership application submitted successfully! Pending executive approval.');
      setApplyingClubId(null);
      setReason('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit membership application');
    }
  };

  const filteredClubs = clubs.filter((c) => {
    const matchCat = selectedCat ? c.category_id === selectedCat : true;
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clubs & Student Organizations</h1>
        <p className="text-slate-500 text-sm mt-1">
          Explore approved student societies, leadership organizations, and technical chapters at the American University of Nigeria.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search organizations by name or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setSelectedCat(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCat === null
                ? 'bg-[#002147] text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCat === cat.id
                  ? 'bg-[#002147] text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Clubs Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading organizations...</div>
      ) : filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <div
              key={club.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={club.logo_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100'}
                    alt={club.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-xs"
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {club.category?.name || 'General'}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base leading-snug mt-1 group-hover:text-blue-700 transition">
                      {club.name}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {club.description}
                </p>

                <div className="space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{club.meeting_schedule || 'Meeting schedules announced weekly'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{club.member_count || 1} active student members</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                {applyingClubId === club.id ? (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Why would you like to join? (Optional)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApply(club.id)}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow"
                      >
                        Confirm Application
                      </button>
                      <button
                        onClick={() => setApplyingClubId(null)}
                        className="py-1.5 px-3 bg-slate-200 text-slate-700 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setApplyingClubId(club.id)}
                    className="w-full py-2.5 rounded-xl bg-[#002147] hover:bg-blue-900 text-white font-semibold text-xs shadow flex items-center justify-center space-x-2 transition"
                  >
                    <span>Apply for Membership</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">No organizations match your search filter.</div>
      )}
    </div>
  );
};
