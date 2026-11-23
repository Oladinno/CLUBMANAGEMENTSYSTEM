import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Award, QrCode, Calendar, MapPin, Clock } from 'lucide-react';

export const StudentAttendance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinToken, setCheckinToken] = useState('');
  const [checkinMsg, setCheckinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/students/attendance-history');
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinToken.trim()) return;
    setCheckinMsg(null);
    try {
      const res = await api.post('/events/check-in', { qr_code_token: checkinToken.trim() });
      setCheckinMsg({ type: 'success', text: res.data.message });
      setCheckinToken('');
      fetchHistory();
    } catch (err: any) {
      setCheckinMsg({ type: 'error', text: err.response?.data?.detail || 'Invalid or inactive check-in token.' });
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading attendance records...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Event Attendance History</h1>
        <p className="text-xs text-slate-500 mt-1">Your complete verified attendance log across all AUN campus events.</p>
      </div>

      {/* QR check-in widget */}
      <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-xs">
        <div className="flex items-center space-x-2 mb-3">
          <QrCode className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900">Live Event Check-In</h2>
        </div>
        <form onSubmit={handleCheckin} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter event QR token (or scan code at venue)"
            value={checkinToken}
            onChange={(e) => setCheckinToken(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow transition"
          >
            Verify Attendance
          </button>
        </form>
        {checkinMsg && (
          <div className={`mt-3 p-3 rounded-xl text-xs font-medium ${
            checkinMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {checkinMsg.text}
          </div>
        )}
      </div>

      {/* Attendance table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Attendance Record ({records.length} events)</h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {records.filter(r => r.method === 'qr_scan').length} QR Verified
          </span>
        </div>
        {records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Event</th>
                  <th className="p-4">Club</th>
                  <th className="p-4">Event Date</th>
                  <th className="p-4">Checked In At</th>
                  <th className="p-4">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-bold text-slate-900">{r.event_title}</td>
                    <td className="p-4 text-slate-600">{r.club_name}</td>
                    <td className="p-4 text-slate-500">{new Date(r.event_date).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-500">{new Date(r.checked_in_at).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.method === 'qr_scan' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {r.method === 'qr_scan' ? 'QR Scan' : 'Manual'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-400">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No attendance records yet.</p>
            <p className="text-xs mt-1">Attend events and use QR check-in to build your record.</p>
          </div>
        )}
      </div>
    </div>
  );
};
