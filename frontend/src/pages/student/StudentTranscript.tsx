import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { GraduationCap, Download, Award, Users, Calendar } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export const StudentTranscript: React.FC = () => {
  const { user } = useAuth();
  const [transcript, setTranscript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/students/co-curricular-transcript');
        setTranscript(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/students/co-curricular-transcript/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AUN_Transcript_${transcript?.student?.student_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate transcript PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Generating your co-curricular transcript...</div>;

  const t = transcript || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002147] to-blue-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-blue-300">Office of Student Affairs | Official Record</span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Co-Curricular Participation Transcript</h1>
          <p className="text-blue-100 text-sm mt-1">
            {t.student?.full_name} • {t.student?.student_id} • {t.student?.school}
          </p>
        </div>
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-white text-[#002147] font-bold text-sm shadow hover:bg-blue-50 transition disabled:opacity-70"
        >
          <Download className="w-4 h-4 text-blue-700" />
          <span>{downloading ? 'Generating Official PDF...' : 'Download Official PDF'}</span>
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
          <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-black text-slate-900">{t.total_clubs_joined ?? 0}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Clubs Enrolled</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
          <Calendar className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <p className="text-2xl font-black text-slate-900">{t.total_events_attended ?? 0}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Events Attended</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
          <Award className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-slate-900">{t.leadership_roles?.length ?? 0}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Leadership Roles</p>
        </div>
      </div>

      {/* Leadership Roles */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Executive & Leadership Positions</h2>
        </div>
        {t.leadership_roles?.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Organization</th>
                <th className="p-4">Position</th>
                <th className="p-4">Term</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {t.leadership_roles.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{r.club_name}</td>
                  <td className="p-4 text-slate-700">{r.position}</td>
                  <td className="p-4 text-slate-500">{new Date(r.appointed_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {r.is_active ? 'Active' : 'Completed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">No leadership positions held yet.</div>
        )}
      </div>

      {/* Club Memberships */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Club & Organization Memberships</h2>
        </div>
        {t.club_memberships?.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Organization</th>
                <th className="p-4">Category</th>
                <th className="p-4">Role</th>
                <th className="p-4">Date Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {t.club_memberships.map((m: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{m.club_name}</td>
                  <td className="p-4 text-slate-500">{m.category}</td>
                  <td className="p-4 text-slate-700">{m.position}</td>
                  <td className="p-4 text-slate-500">{m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">No approved memberships yet.</div>
        )}
      </div>

      {/* Events Attended */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Verified Event Attendance History</h2>
        </div>
        {t.events_attended?.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Event Title</th>
                <th className="p-4">Organising Club</th>
                <th className="p-4">Category</th>
                <th className="p-4">Date</th>
                <th className="p-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {t.events_attended.map((a: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{a.event_title}</td>
                  <td className="p-4 text-slate-600">{a.club_name}</td>
                  <td className="p-4 text-slate-500">{a.category}</td>
                  <td className="p-4 text-slate-500">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {a.method === 'qr_scan' ? 'QR Verified' : 'Manual Verified'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">No verified event attendance recorded yet.</div>
        )}
      </div>
    </div>
  );
};
