import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Users, Search, GraduationCap, Mail } from 'lucide-react';

export const AdminStudents: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = users.filter((u) =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.student_id && u.student_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">University Student Directory</h1>
        <p className="text-xs text-slate-500 mt-1">Institutional records of enrolled students and assigned leadership privileges.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name, ID or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-4">Student Name</th>
              <th className="p-4">Student ID</th>
              <th className="p-4">Email</th>
              <th className="p-4">School & Major</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition">
                <td className="p-4 font-bold text-slate-900">
                  {u.first_name} {u.last_name}
                </td>
                <td className="p-4 font-mono text-slate-600 font-semibold">{u.student_id || 'N/A'}</td>
                <td className="p-4 text-slate-500">{u.email}</td>
                <td className="p-4 text-slate-600">{u.school ? `${u.school} - ${u.major}` : 'Administration'}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
