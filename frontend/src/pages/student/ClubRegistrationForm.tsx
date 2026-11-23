import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../api/client';

interface Category {
  id: number;
  name: string;
  description: string;
}

export const ClubRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: '',
    category_id: '',
    description: '',
    mission: '',
    objectives: '',
    meeting_schedule: '',
    contact_email: '',
    contact_phone: '',
    founding_members: '',
    proposed_president_email: '',
    notes: '',
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/clubs/categories')).data,
  });

  const handleChange = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/clubs/applications/register', {
        club_name: form.name,
        category_id: parseInt(form.category_id),
        description: form.description,
        mission: form.mission,
        objectives: form.objectives,
        meeting_schedule: form.meeting_schedule,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        founding_members: form.founding_members,
        proposed_president_email: form.proposed_president_email,
        notes: form.notes,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Register a New Club</h1>
        </div>
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Application Submitted!</h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            Your club registration request has been submitted to Student Affairs for review.
            You will receive a notification once it's processed.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/clubs')}
              className="px-5 py-2.5 bg-[#002147] text-white font-semibold text-sm rounded-xl hover:bg-blue-900 transition"
            >
              Browse Clubs
            </button>
            <button
              onClick={() => { setSuccess(false); setStep(1); setForm({ name: '', category_id: '', description: '', mission: '', objectives: '', meeting_schedule: '', contact_email: '', contact_phone: '', founding_members: '', proposed_president_email: '', notes: '' }); }}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-200 transition"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Register a New Club</h1>
        <p className="text-slate-500 text-sm mt-1">Complete the application to propose a new student organization.</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {['Basic Info', 'Club Details', 'Leadership'].map((label, i) => {
          const s = i + 1;
          const isActive = step === s;
          const isDone = step > s;
          return (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                isActive ? 'bg-[#002147] text-white' : isDone ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
              }`}>
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">{s}</span>
                {label}
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-bold text-slate-800 mb-4">Basic Information</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Club Name *</label>
                <input
                  required
                  placeholder="e.g. AUN Chess Club"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category *</label>
                <select
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none bg-white"
                  value={form.category_id}
                  onChange={e => handleChange('category_id', e.target.value)}
                >
                  <option value="">— Select a category —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Brief overview of the club…"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    placeholder="club@aun.edu.ng"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={form.contact_email}
                    onChange={e => handleChange('contact_email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Phone</label>
                  <input
                    placeholder="+234 XXX XXX XXXX"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={form.contact_phone}
                    onChange={e => handleChange('contact_phone', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { if (form.name && form.category_id && form.description) setStep(2); else setError('Please complete all required fields.'); }}
                  className="px-6 py-2.5 bg-[#002147] text-white text-sm font-semibold rounded-xl hover:bg-blue-900 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Club Details */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-bold text-slate-800 mb-4">Club Details</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mission Statement</label>
                <textarea
                  rows={3}
                  placeholder="What is the core mission of this club?"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  value={form.mission}
                  onChange={e => handleChange('mission', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Objectives</label>
                <textarea
                  rows={3}
                  placeholder="List the club's key objectives and activities…"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  value={form.objectives}
                  onChange={e => handleChange('objectives', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Schedule</label>
                <input
                  placeholder="e.g. Every Tuesday 5–7pm, Room 211"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.meeting_schedule}
                  onChange={e => handleChange('meeting_schedule', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Founding Members</label>
                <textarea
                  rows={2}
                  placeholder="List names and student IDs of founding members…"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  value={form.founding_members}
                  onChange={e => handleChange('founding_members', e.target.value)}
                />
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => { setStep(1); setError(''); }} className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition">← Back</button>
                <button type="button" onClick={() => setStep(3)} className="px-6 py-2.5 bg-[#002147] text-white text-sm font-semibold rounded-xl hover:bg-blue-900 transition">Next →</button>
              </div>
            </div>
          )}

          {/* Step 3: Leadership */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-bold text-slate-800 mb-4">Proposed Leadership</h2>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                <strong>Note:</strong> The proposed president must already have an account in the AUN Clubs Portal. They will be automatically assigned the President role upon approval.
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Proposed President's Email *</label>
                <input
                  required
                  type="email"
                  placeholder="president@aun.edu.ng"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.proposed_president_email}
                  onChange={e => handleChange('proposed_president_email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Additional Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any additional information for Student Affairs…"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  value={form.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                />
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => { setStep(2); setError(''); }} className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition">← Back</button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50 shadow"
                >
                  {loading ? 'Submitting…' : '✓ Submit Application'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
