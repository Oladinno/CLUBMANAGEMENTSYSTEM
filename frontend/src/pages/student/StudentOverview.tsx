import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../store/AuthContext';
import {
  Users,
  Calendar,
  Award,
  Download,
  CheckCircle,
  ExternalLink,
  Clock,
  ChevronRight,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentOverview: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [checkinToken, setCheckinToken] = useState('');
  const [checkinMsg, setCheckinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/students/dashboard-stats');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDownloadTranscript = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/students/co-curricular-transcript/pdf', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AUN_Transcript_${user?.student_profile?.student_id || 'Student'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate PDF transcript. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinToken.trim()) return;
    setCheckinMsg(null);
    try {
      const res = await api.post('/events/check-in', { qr_code_token: checkinToken.trim() });
      setCheckinMsg({ type: 'success', text: res.data.message });
      setCheckinToken('');
      fetchStats();
    } catch (err: any) {
      setCheckinMsg({ type: 'error', text: err.response?.data?.detail || 'Invalid or inactive check-in token' });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading your student dashboard...</div>;
  }

  const stats = data?.stats || { total_clubs: 0, events_attended: 0, events_registered: 0, leadership_positions_count: 0 };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#002147] to-blue-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>American University of Nigeria • Student Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome, {user?.first_name} {user?.last_name}
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Student ID: <span className="font-semibold text-white">{data?.student_info?.student_id}</span> | Major: <span className="font-semibold text-white">{data?.student_info?.major || 'Software Engineering'}</span> ({data?.student_info?.school || 'SITC'})
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadTranscript}
            disabled={downloading}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-white text-[#002147] font-bold text-sm shadow hover:bg-blue-50 transition active:scale-95 disabled:opacity-75"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>{downloading ? 'Compiling PDF...' : 'Download Official Transcript'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Clubs Joined</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.total_clubs}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Events Attended</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.events_attended}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Registrations</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.events_registered}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Leadership Roles</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.leadership_positions_count}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick QR Check-in Box */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[#002147] mb-2 font-bold text-lg">
              <QrCode className="w-5 h-5 text-blue-600" />
              <h2>Event Check-In</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter the event check-in token or scan code displayed by club executives on campus.
            </p>

            <form onSubmit={handleManualCheckin} className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Enter event token or scan code"
                value={checkinToken}
                onChange={(e) => setCheckinToken(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider shadow transition"
              >
                Verify Attendance
              </button>
            </form>

            {checkinMsg && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs font-medium ${
                  checkinMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {checkinMsg.text}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Offline-resilient check-in queue active</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Recent Attendance Timeline */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Recent Attendance History</h2>
            <Link to="/student/attendance" className="text-xs font-semibold text-blue-600 hover:underline flex items-center">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {data?.recent_activities?.length > 0 ? (
            <div className="space-y-3">
              {data.recent_activities.map((act: any) => (
                <div key={act.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{act.title}</p>
                    <p className="text-xs text-slate-500">{act.club_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {act.method === 'qr_scan' ? 'QR Verified' : 'Manual'}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{new Date(act.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">
              No recent attendance recorded yet. Attend an event to start building your record!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
