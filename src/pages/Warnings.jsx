import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Warnings() {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  useEffect(() => {
    const generateWarnings = async () => {
      try {
        const projectsRes = await axios.get(`${API_URL}/api/projects`);
        const projects = projectsRes.data;
        let generatedAlerts = [];

        for (let p of projects) {
          const tasksRes = await axios.get(`${API_URL}/api/projects/${p.id}/tasks`);
          const tasks = tasksRes.data;
          
          if (tasks.length === 0) {
            generatedAlerts.push({
              id: `empty-${p.id}`,
              project: p.name,
              severity: 'Info',
              message: 'Project has no tasks assigned. Add tasks to begin tracking progress.',
              color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
            });
            continue;
          }

          const completed = tasks.filter(t => t.status === 'Completed').length;
          const completionRate = (completed / tasks.length) * 100;

          if (completionRate < 30) {
            generatedAlerts.push({
              id: `crit-${p.id}`,
              project: p.name,
              severity: 'Critical',
              message: `Severe delay: Only ${Math.round(completionRate)}% of tasks completed. Immediate intervention required.`,
              color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
            });
          } else if (completionRate < 70) {
            generatedAlerts.push({
              id: `warn-${p.id}`,
              project: p.name,
              severity: 'Warning',
              message: `Falling behind: ${Math.round(completionRate)}% completion rate. Monitor team velocity closely.`,
              color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
            });
          }
        }

        setWarnings(generatedAlerts);
        setLoading(false);
      } catch (error) {
        console.error("Failed to generate warnings", error);
        setLoading(false);
      }
    };

    generateWarnings();
  }, []);

  if (loading) {
    return <div className="text-slate-500 p-6">Running Risk Analysis...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto font-sans transition-colors duration-300">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">System Warnings</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Automated risk detection and project health flags.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {warnings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">All Systems Nominal</h3>
            <p className="text-slate-500 dark:text-slate-400">All active projects are operating above the 70% health threshold.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {warnings.map((alert) => (
              <div key={alert.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className={`mt-1 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border ${alert.color}`}>
                  {alert.severity}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{alert.project}</h4>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{alert.message}</p>
                </div>
                <div className="ml-auto pl-4">
                  <Link to="/projects" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                    View Board &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}