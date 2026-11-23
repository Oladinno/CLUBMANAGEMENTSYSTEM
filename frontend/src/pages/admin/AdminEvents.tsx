import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Users, CheckCircle, Clock, Search } from 'lucide-react';
import { api } from '../../api/client';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  check_in_open: boolean;
  max_capacity: number | null;
  club?: { name: string };
}

export const AdminEvents: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['admin-events'],
    queryFn: async () => (await api.get('/events')).data,
  });

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.club?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.event_date) >= now).length;
  const past = events.filter(e => new Date(e.event_date) < now).length;
  const checkInOpen = events.filter(e => e.check_in_open).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Event Monitoring</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor all campus events across all clubs.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Events', value: events.length, icon: Calendar, color: 'blue' },
          { label: 'Upcoming', value: upcoming, icon: Clock, color: 'amber' },
          { label: 'Check-in Open', value: checkInOpen, icon: CheckCircle, color: 'green' },
        ].map(stat => {
          const Icon = stat.icon;
          const colors: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-600',
            amber: 'bg-amber-100 text-amber-600',
            green: 'bg-green-100 text-green-600',
          };
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[stat.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-bold text-slate-800">All Events</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search events…"
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-56"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-slate-400">Loading events…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No events found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                  <th className="text-left px-6 py-3">Event</th>
                  <th className="text-left px-6 py-3">Club</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Location</th>
                  <th className="text-left px-6 py-3">Capacity</th>
                  <th className="text-left px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(event => {
                  const isPast = new Date(event.event_date) < now;
                  return (
                    <tr key={event.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{event.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                          {event.club?.name || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {new Date(event.event_date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{event.location || '—'}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {event.max_capacity ? event.max_capacity : <span className="text-slate-300">Unlimited</span>}
                      </td>
                      <td className="px-6 py-4">
                        {isPast ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Past</span>
                        ) : event.check_in_open ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                            <CheckCircle className="inline w-3 h-3 mr-1" />Live
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                            <Clock className="inline w-3 h-3 mr-1" />Upcoming
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
