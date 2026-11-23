import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, Users, Clock, UserPlus, ChevronDown } from 'lucide-react';
import { api } from '../../api/client';

interface Event {
  id: number;
  title: string;
  event_date: string;
  location: string;
  check_in_open: boolean;
  club?: { name: string };
}

interface Attendee {
  id: number;
  check_in_time: string;
  check_in_method: string;
  user?: { first_name: string; last_name: string; email: string };
  student?: { student_id: string };
}

export const ExecutiveAttendance: React.FC = () => {
  const qc = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualSuccess, setManualSuccess] = useState('');
  const [manualError, setManualError] = useState('');

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['exec-events'],
    queryFn: async () => (await api.get('/events')).data,
  });

  const { data: attendees = [], isLoading } = useQuery<Attendee[]>({
    queryKey: ['event-attendees', selectedEventId],
    enabled: selectedEventId !== null,
    queryFn: async () => (await api.get(`/events/${selectedEventId}/attendees`)).data,
  });

  const manualMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await api.post(`/events/${selectedEventId}/manual-attendance`, { student_id: studentId });
    },
    onSuccess: () => {
      setManualSuccess('Attendance recorded successfully!');
      setManualStudentId('');
      setManualError('');
      qc.invalidateQueries({ queryKey: ['event-attendees', selectedEventId] });
      setTimeout(() => setManualSuccess(''), 3000);
    },
    onError: (err: any) => {
      setManualError(err?.response?.data?.detail || 'Failed to record attendance.');
    },
  });

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">QR Attendance Live</h1>
        <p className="text-slate-500 text-sm mt-1">View real-time event attendance and record manual check-ins.</p>
      </div>

      {/* Event Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Select Event</label>
        <div className="relative max-w-sm">
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            value={selectedEventId ?? ''}
            onChange={e => setSelectedEventId(Number(e.target.value) || null)}
          >
            <option value="">— Choose an event —</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>
                {e.title} — {new Date(e.event_date).toLocaleDateString()}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {selectedEvent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Attendees</p>
              <p className="text-2xl font-bold text-slate-800">{attendees.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">QR Check-ins</p>
              <p className="text-2xl font-bold text-slate-800">
                {attendees.filter(a => a.check_in_method === 'qr').length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedEvent.check_in_open ? 'bg-green-100' : 'bg-slate-100'}`}>
              <Clock className={`w-5 h-5 ${selectedEvent.check_in_open ? 'text-green-600' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Check-in Status</p>
              <p className={`text-sm font-bold ${selectedEvent.check_in_open ? 'text-green-600' : 'text-slate-500'}`}>
                {selectedEvent.check_in_open ? 'Open' : 'Closed'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Attendance */}
      {selectedEvent && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800">Manual Attendance</h2>
          </div>
          <div className="flex gap-3 max-w-md">
            <input
              type="text"
              placeholder="Enter Student ID (e.g. AUN/123456/22)"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={manualStudentId}
              onChange={e => setManualStudentId(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && manualStudentId.trim()) manualMutation.mutate(manualStudentId.trim()); }}
            />
            <button
              onClick={() => manualStudentId.trim() && manualMutation.mutate(manualStudentId.trim())}
              disabled={manualMutation.isPending || !manualStudentId.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              Record
            </button>
          </div>
          {manualSuccess && <p className="mt-2 text-green-600 text-sm font-medium">{manualSuccess}</p>}
          {manualError && <p className="mt-2 text-red-600 text-sm font-medium">{manualError}</p>}
        </div>
      )}

      {/* Attendees Table */}
      {selectedEventId !== null && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Attendees List</h2>
            {isLoading && <span className="text-xs text-slate-400">Loading…</span>}
          </div>
          {!isLoading && attendees.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <QrCode className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No attendees yet. Share the QR code at the event!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                    <th className="text-left px-6 py-3">#</th>
                    <th className="text-left px-6 py-3">Student</th>
                    <th className="text-left px-6 py-3">Student ID</th>
                    <th className="text-left px-6 py-3">Check-in Time</th>
                    <th className="text-left px-6 py-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendees.map((a, i) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3 text-slate-400">{i + 1}</td>
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-800">{a.user?.first_name} {a.user?.last_name}</p>
                        <p className="text-xs text-slate-500">{a.user?.email}</p>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-600">{a.student?.student_id || '—'}</td>
                      <td className="px-6 py-3 text-slate-600">
                        {new Date(a.check_in_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          a.check_in_method === 'qr' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {a.check_in_method === 'qr' ? <QrCode className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                          {a.check_in_method === 'qr' ? 'QR Code' : 'Manual'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
