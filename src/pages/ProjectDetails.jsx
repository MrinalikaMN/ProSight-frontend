import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

export default function ProjectDetails() {
  const { id } = useParams(); // Gets the project ID from the URL
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectAndTasks = async () => {
      try {
        const [projectRes, tasksRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/projects/${id}`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/tasks/project/${id}`)
        ]);
        setProject(projectRes.data);
        setTasks(tasksRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load project details", error);
        setLoading(false);
      }
    };

    fetchProjectAndTasks();
  }, [id]);

  if (loading) return <div className="text-slate-500 font-sans p-8">Loading project data...</div>;
  if (!project) return <div className="text-red-500 font-sans p-8">Project not found.</div>;

  return (
    <div className="max-w-5xl mx-auto font-sans">
      {/* Navigation & Header */}
      <div className="mb-8">
        <Link to="/projects" className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold mb-4 inline-block">
          ← Back to Portfolio
        </Link>
        <div className="flex justify-between items-start mt-2">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{project.name}</h1>
            <p className="text-slate-500 font-medium text-lg">{project.description}</p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${project.health >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {project.status || 'Active'}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-1">Total Budget</p>
          <h3 className="text-2xl font-bold text-slate-800">${(project.budget || 0).toLocaleString()}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-1">System Health</p>
          <h3 className="text-2xl font-bold text-slate-800">{project.health}/100</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-1">Total Tasks</p>
          <h3 className="text-2xl font-bold text-slate-800">{tasks.length}</h3>
        </div>
      </div>

      {/* Task List */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Project Tasks</h2>
        {tasks.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">No tasks assigned to this project yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-sm font-semibold text-slate-600">Task Name</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Assigned Team</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Expected (Days)</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Actual (Days)</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const isDelayed = task.actualDays > task.expectedDays;
                  return (
                    <tr key={task.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">{task.name}</td>
                      <td className="p-4 text-slate-600 font-medium">{task.assignedTeam}</td>
                      <td className="p-4 text-slate-600">{task.expectedDays}</td>
                      <td className={`p-4 font-bold ${isDelayed ? 'text-red-600' : 'text-emerald-600'}`}>
                        {task.actualDays}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${isDelayed ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isDelayed ? 'Delayed' : 'On Track'}
                        </span>
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
}