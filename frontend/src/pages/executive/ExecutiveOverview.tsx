import React, { useEffect, useState } from 'react';
import { api, openQrCode } from '../../api/client';
import { useAuth } from '../../store/AuthContext';
import {
  Users,
  Calendar,
  FileCheck,
  Check,
  X,
  QrCode,
  ArrowRightLeft,
  Clock,
  Sparkles
} from 'lucide-react';

export const ExecutiveOverview: React.FC = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [membershipRequests, setMembershipRequests] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExecData = async () => {
      try {
        const clubsRes = await api.get('/clubs');
        // Let's take the first club as the managed club for demonstration
        setClubs(clubsRes.data);
        if (clubsRes.data.length > 0) {
          const club = clubsRes.data[0];
          setSelectedClub(club);
          const reqRes = await api.get(`/memberships/club/${club.id}?status=pending`);
          setMembershipRequests(reqRes.data);
          const evRes = await api.get(`/events?club_id=${club.id}`);
          setEvents(evRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExecData();
  }, []);

  const handleReviewMembership = async (membershipId: number, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/memberships/${membershipId}/review`, {
        status,
        review_remarks: status === 'approved' ? 'Welcome to the club!' : 'Application not accepted at this time.',
        position: 'General Member'
      });
      setMembershipRequests((prev) => prev.filter((m) => m.id !== membershipId));
      alert(`Membership request ${status}!`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update membership status');
    }
  };

  const handleToggleCheckin = async (eventId: number, currentActive: boolean) => {
    try {
      const res = await api.post(`/events/${eventId}/toggle-checkin?active=${!currentActive}`);
      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, is_checkin_active: res.data.is_checkin_active, qr_code_token: res.data.qr_code_token } : ev))
      );
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to toggle checkin state');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading club management console...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[#002147] rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-blue-300">Club Executive Console</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">{selectedClub?.name || 'Club Leadership'}</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">{selectedClub?.description}</p>
        </div>
        <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/20 text-xs">
          <p className="text-blue-200">Executive In Charge</p>
          <p className="font-bold text-white text-sm">{user?.first_name} {user?.last_name} (President)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Members</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{selectedClub?.member_count || 2}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Requests</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{membershipRequests.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Events</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{events.length}</p>
          </div>
        </div>
      </div>

      {/* Membership Requests Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pending Membership Applications</h2>
            <p className="text-xs text-slate-500">Review student requests to join {selectedClub?.name}</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800">
            {membershipRequests.length} pending
          </span>
        </div>

        {membershipRequests.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {membershipRequests.map((req) => (
              <div key={req.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {req.student?.user?.first_name} {req.student?.user?.last_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    ID: {req.student?.student_id} | Major: {req.student?.major}
                  </p>
                  {req.application_reason && (
                    <p className="text-xs italic text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{req.application_reason}"
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleReviewMembership(req.id, 'approved')}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleReviewMembership(req.id, 'rejected')}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-semibold transition"
                  >
                    <X className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">
            All membership applications have been reviewed!
          </div>
        )}
      </div>

      {/* Event Attendance & Live QR Activation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Event Check-In & Attendance Management</h2>
            <p className="text-xs text-slate-500">Activate live QR check-ins for attendees during meetings</p>
          </div>
        </div>

        <div className="space-y-4">
          {events.map((ev) => (
            <div key={ev.id} className="p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {ev.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{ev.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Venue: {ev.venue} | Date: {new Date(ev.start_time).toLocaleDateString()}
                </p>
                <div className="flex items-center space-x-3 text-xs text-slate-600 mt-2">
                  <span>Registrations: <b>{ev.registrations_count || 0}</b></span>
                  <span>•</span>
                  <span>Checked In: <b>{ev.attendees_count || 0}</b></span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {ev.is_checkin_active && (
                  <button
                    type="button"
                    onClick={() => openQrCode(ev.id).catch((err) => alert(err.response?.data?.detail || 'Failed to load QR code'))}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Display QR</span>
                  </button>
                )}

                <button
                  onClick={() => handleToggleCheckin(ev.id, ev.is_checkin_active)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shadow transition ${
                    ev.is_checkin_active
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-[#002147] hover:bg-blue-900 text-white'
                  }`}
                >
                  {ev.is_checkin_active ? 'Close Check-In' : 'Activate Live Check-In'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
