import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { ArrowRightLeft, Check, X, ShieldAlert } from 'lucide-react';

export const AdminLeadership: React.FC = () => {
  const [transitions, setTransitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransitions = async () => {
    try {
      const res = await api.get('/leadership/all');
      setTransitions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransitions();
  }, []);

  const handleReview = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/leadership/${id}/review`, {
        status,
        approval_notes: status === 'approved' ? 'Leadership credentials transferred.' : 'Handover rejected.'
      });
      alert(`Handover ${status}!`);
      fetchTransitions();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to review handover');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Leadership Handover Workflow</h1>
        <p className="text-xs text-slate-500 mt-1">Review and authorize organizational executive succession and permission transfers.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {transitions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {transitions.map((t) => (
              <div key={t.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-base">{t.position}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Outgoing Executive: <b>{t.outgoing_executive?.first_name} {t.outgoing_executive?.last_name}</b> → Incoming: <b>{t.incoming_executive?.first_name} {t.incoming_executive?.last_name}</b>
                  </p>
                  {t.handover_notes && (
                    <p className="text-xs italic text-slate-500 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      Notes: {t.handover_notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {t.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReview(t.id, 'approved')}
                        className="flex items-center space-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Authorize Handover</span>
                      </button>
                      <button
                        onClick={() => handleReview(t.id, 'rejected')}
                        className="flex items-center space-x-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-semibold transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm">
            No active leadership handover petitions pending authorization.
          </div>
        )}
      </div>
    </div>
  );
};
