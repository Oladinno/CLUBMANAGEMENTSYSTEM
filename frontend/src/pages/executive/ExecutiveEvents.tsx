import React, { useEffect, useState } from 'react';
import { api, openQrCode } from '../../api/client';
import { Calendar, Plus, Edit, QrCode, Users, Trash2 } from 'lucide-react';

export const ExecutiveEvents: React.FC = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [myClubId, setMyClubId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'General',
    venue: '',
    start_time: '',
    end_time: '',
    capacity: '',
    target_audience: 'All Students',
    registration_required: true,
    status: 'published'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clubsRes = await api.get('/clubs');
        setClubs(clubsRes.data);
        if (clubsRes.data.length > 0) {
          const id = clubsRes.data[0].id;
          setMyClubId(id);
          const evRes = await api.get(`/events?club_id=${id}`);
          setEvents(evRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myClubId) return;
    try {
      const payload = {
        ...form,
        club_id: myClubId,
        capacity: form.capacity ? Number(form.capacity) : null,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      };
      const res = await api.post('/events', payload);
      setEvents((prev) => [...prev, res.data]);
      setShowForm(false);
      setForm({ title: '', description: '', category: 'General', venue: '', start_time: '', end_time: '', capacity: '', target_audience: 'All Students', registration_required: true, status: 'published' });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create event');
    }
  };

  const handleToggleCheckin = async (eventId: number, currentActive: boolean) => {
    try {
      const res = await api.post(`/events/${eventId}/toggle-checkin?active=${!currentActive}`);
      setEvents((prev) => prev.map((ev) => ev.id === eventId ? { ...ev, is_checkin_active: res.data.is_checkin_active } : ev));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to toggle check-in');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading events management...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Events Management</h1>
          <p className="text-xs text-slate-500 mt-1">Create, publish, and manage attendance for your club events.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#002147] hover:bg-blue-900 text-white font-bold text-xs shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>

      {/* Create Event Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-5">New Event Details</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Event Title', key: 'title', type: 'text', required: true },
                { label: 'Venue', key: 'venue', type: 'text', required: true },
                { label: 'Start Date & Time', key: 'start_time', type: 'datetime-local', required: true },
                { label: 'End Date & Time', key: 'end_time', type: 'datetime-local', required: true },
                { label: 'Capacity (optional)', key: 'capacity', type: 'number', required: false },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    required={field.required}
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {['General', 'Workshop', 'Seminar', 'Community Service', 'Hackathon', 'Social', 'Competition'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Description</label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#002147] hover:bg-blue-900 text-white font-bold text-xs shadow transition">
                Publish Event
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {events.map((ev) => (
          <div key={ev.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">{ev.category}</span>
              <h3 className="font-bold text-slate-900 mt-1">{ev.title}</h3>
              <p className="text-xs text-slate-500">
                {new Date(ev.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} • {ev.venue}
              </p>
              <div className="flex space-x-4 text-xs mt-2 text-slate-600">
                <span>Registered: <b>{ev.registrations_count || 0}</b></span>
                <span>Attended: <b>{ev.attendees_count || 0}</b></span>
                <span>Capacity: <b>{ev.capacity || 'Open'}</b></span>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              {ev.is_checkin_active && (
                <button
                  type="button"
                  onClick={() => openQrCode(ev.id).catch((err) => alert(err.response?.data?.detail || 'Failed to load QR code'))}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  <QrCode className="w-4 h-4" />
                  <span>QR Code</span>
                </button>
              )}
              <button
                onClick={() => handleToggleCheckin(ev.id, ev.is_checkin_active)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  ev.is_checkin_active
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-[#002147] hover:bg-blue-900 text-white'
                }`}
              >
                {ev.is_checkin_active ? 'Close Check-In' : 'Open Check-In'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
