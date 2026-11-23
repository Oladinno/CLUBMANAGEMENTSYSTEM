import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { FileCheck, Check, X, Clock, AlertCircle } from 'lucide-react';

export const AdminRegistrations: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    try {
      const res = await api.get('/clubs/applications/all');
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleReview = async (appId: number, status: 'approved' | 'rejected') => {
    const remarks = prompt(status === 'approved' ? 'Approval remarks (optional):' : 'Reason for rejection:');
    try {
      await api.put(`/clubs/applications/${appId}/review`, {
        status,
        admin_remarks: remarks || 'Reviewed by Student Affairs'
      });
      alert(`Application ${status} successfully!`);
      fetchApps();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to review application');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Club Registration Applications</h1>
        <p className="text-xs text-slate-500 mt-1">Review new student organization charters, constitutions, and founding rosters.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {applications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => (
              <div key={app.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="max-w-2xl space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-slate-900">{app.club_name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{app.description}</p>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p><b>Mission:</b> {app.mission}</p>
                    <p><b>Applicant:</b> {app.applicant?.first_name} {app.applicant?.last_name} ({app.contact_email})</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {app.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReview(app.id, 'approved')}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Charter</span>
                      </button>
                      <button
                        onClick={() => handleReview(app.id, 'rejected')}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-semibold transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm">
            No pending registration applications to review.
          </div>
        )}
      </div>
    </div>
  );
};
