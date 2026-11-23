import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Building2,
  Users,
  Calendar,
  FileCheck,
  Download,
  AlertTriangle,
  CheckCircle,
  FileText
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/dashboard-analytics');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const downloadReport = async (endpoint: string, filename: string) => {
    try {
      const res = await api.get(`/admin/reports/${endpoint}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download report. Please ensure you are logged in as Admin.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading Student Affairs master analytics...</div>;
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-[#002147] rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-blue-300">Office of Student Affairs</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Institutional Governance Dashboard</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Real-time compliance monitoring, organization approvals, and student co-curricular analytics.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => downloadReport('clubs/csv', 'aun_clubs.csv')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-[#002147] font-bold text-xs shadow hover:bg-blue-50 transition"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Clubs CSV</span>
          </button>
          <button
            onClick={() => downloadReport('attendance/csv', 'aun_attendance.csv')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs shadow hover:bg-blue-800 transition"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Export Attendance CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Clubs</span>
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{m.total_clubs}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">{m.active_clubs} active • {m.suspended_clubs} suspended</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Students</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{m.total_students}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">{m.total_memberships} active memberships</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Campus Events</span>
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{m.total_events}</p>
          <p className="text-xs text-blue-600 font-semibold mt-1">{m.upcoming_events} scheduled upcoming</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Registrations</span>
            <FileCheck className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{m.pending_applications}</p>
          <p className="text-xs text-amber-600 font-semibold mt-1">Requires administrative review</p>
        </div>
      </div>

      {/* Category Distribution and Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Club Distribution by Category</h2>
          <p className="text-xs text-slate-500 mb-5">Membership and organization distribution across recognized disciplines</p>
          <div className="space-y-4">
            {data?.category_distribution?.map((cat: any) => (
              <div key={cat.category} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{cat.category}</p>
                  <p className="text-xs text-slate-500">{cat.clubs_count} organizations</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-[#002147]">{cat.memberships_count}</span>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Members</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Audit Logs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-1">System Audit & Compliance Log</h2>
          <p className="text-xs text-slate-500 mb-5">Immutable record of governance decisions and administrative events</p>
          <div className="space-y-3">
            {data?.recent_logs?.map((log: any) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="text-blue-700 uppercase tracking-wide text-[11px]">{log.action}</span>
                  <span className="text-slate-400 font-normal">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-slate-600 mt-1">{log.details}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">By: {log.user_email}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
