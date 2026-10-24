import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/users`);
        setTeam(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching team", error);
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading Team Directory...</div>;

  return (
    <div className="max-w-7xl mx-auto font-sans transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Team Directory</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Organization members and role assignments.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {team.map(member => (
          <div key={member.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-xl border border-indigo-200 dark:border-indigo-800">
              {member.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{member.username}</h3>
              <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${member.role === 'ADMIN' ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'}`}>
                {member.role || 'MEMBER'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}