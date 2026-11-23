import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Calendar, MapPin, Users, Clock, CheckCircle2, QrCode } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export const EventsDirectory: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState<number[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleRegister = async (eventId: number) => {
    try {
      await api.post(`/events/${eventId}/register`);
      setRegisteredEvents((prev) => [...prev, eventId]);
      setSuccessMsg('You have successfully registered for this event!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to register for event');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Campus Events Calendar</h1>
        <p className="text-slate-500 text-sm mt-1">
          Explore upcoming workshops, hackathons, outreach campaigns, and cultural events across AUN.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading events...</div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((ev) => {
            const isReg = registeredEvents.includes(ev.id);
            return (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                    <img
                      src={ev.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-[#002147]/90 backdrop-blur-xs text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                      {ev.category}
                    </div>
                    {ev.is_checkin_active && (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow">
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Live Check-In</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      {ev.club?.name || 'AUN Club Event'}
                    </p>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{ev.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {ev.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{new Date(ev.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{ev.venue}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Capacity: {ev.capacity || 'Open'} • {ev.registrations_count || 0} registered</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Target: <b>{ev.target_audience}</b>
                  </span>
                  <button
                    onClick={() => handleRegister(ev.id)}
                    disabled={isReg}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow transition ${
                      isReg
                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                        : 'bg-[#002147] hover:bg-blue-900 text-white'
                    }`}
                  >
                    {isReg ? 'Registered ✓' : 'Register for Event'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">No events currently scheduled.</div>
      )}
    </div>
  );
};
