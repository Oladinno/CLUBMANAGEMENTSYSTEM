import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Bell, Check, CheckCheck } from 'lucide-react';

export const StudentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/students/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id: number) => {
    await api.put(`/students/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await api.put('/students/notifications/mark-all-read');
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const typeBadge: Record<string, string> = {
    event: 'bg-blue-50 text-blue-700 border-blue-200',
    membership: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    club: 'bg-purple-50 text-purple-700 border-purple-200',
    system: 'bg-slate-50 text-slate-600 border-slate-200',
    general: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  if (loading) return <div className="p-8 text-center text-slate-500">Loading notifications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-500 mt-1">{unread} unread • {notifications.length} total</p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-2xl border p-5 flex items-start justify-between gap-4 transition ${!n.is_read ? 'border-blue-200 shadow-sm' : 'border-slate-200'}`}
            >
              <div className="flex items-start space-x-3">
                {!n.is_read && <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                <div>
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded mb-1 ${typeBadge[n.notification_type] || typeBadge.general}`}>
                    {n.notification_type}
                  </span>
                  <h3 className={`text-sm font-bold ${n.is_read ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-16 text-center text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Your notification inbox is empty.</p>
          </div>
        )}
      </div>
    </div>
  );
};
