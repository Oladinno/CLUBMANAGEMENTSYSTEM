import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { BarChart2, Download, TrendingUp, Calendar, Users, Award } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/admin/dashboard-analytics');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const downloadCSV = async (endpoint: string, filename: string) => {
    setDownloading(endpoint);
    try {
      const res = await api.get(`/admin/reports/${endpoint}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download report.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading analytics...</div>;

  const m = data?.metrics || {};

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Analytics & Institutional Reports</h1>
          <p className="text-xs text-slate-500 mt-1">Student Affairs data insights, compliance snapshots, and CSV exports.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => downloadCSV('clubs/csv', 'aun_clubs_report.csv')}
            disabled={!!downloading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#002147] text-white font-bold text-xs shadow hover:bg-blue-900 transition disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'clubs/csv' ? 'Exporting...' : 'Export Clubs CSV'}</span>
          </button>
          <button
            onClick={() => downloadCSV('attendance/csv', 'aun_attendance_report.csv')}
            disabled={!!downloading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs shadow hover:bg-blue-800 transition disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'attendance/csv' ? 'Exporting...' : 'Export Attendance CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clubs', value: m.total_clubs, icon: Users, color: 'blue' },
          { label: 'Active Clubs', value: m.active_clubs, icon: TrendingUp, color: 'emerald' },
          { label: 'Total Events', value: m.total_events, icon: Calendar, color: 'indigo' },
          { label: 'Total Memberships', value: m.total_memberships, icon: Award, color: 'amber' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2 text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-3xl font-black text-slate-900">{item.value ?? '—'}</p>
            </div>
          );
        })}
      </div>

      {/* Category breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">Membership by Category</h2>
        <div className="space-y-3">
          {data?.category_distribution?.map((cat: any) => {
            const pct = m.total_memberships > 0 ? Math.round((cat.memberships_count / m.total_memberships) * 100) : 0;
            return (
              <div key={cat.category}>
                <div className="flex justify-between text-xs text-slate-700 mb-1">
                  <span className="font-semibold">{cat.category}</span>
                  <span className="font-bold">{cat.memberships_count} members ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-[#002147] h-2.5 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit log */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">Recent Audit Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="pb-3">Action</th>
                <th className="pb-3">Entity</th>
                <th className="pb-3">Details</th>
                <th className="pb-3">By</th>
                <th className="pb-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recent_logs?.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 font-bold text-blue-700">{log.action}</td>
                  <td className="py-3 text-slate-600">{log.entity_type}</td>
                  <td className="py-3 text-slate-500 max-w-xs truncate">{log.details}</td>
                  <td className="py-3 text-slate-500">{log.user_email}</td>
                  <td className="py-3 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
