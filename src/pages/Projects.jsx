import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to fetch real projects from your live Railway database
    axios.get(`${import.meta.env.VITE_API_URL}/api/projects`)
      .then(response => {
        setProjects(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.warn("Real endpoint not ready yet. Loading UI placeholders...");
        // Temporary fallback data so you can see the UI design immediately
        setProjects([
          { id: 1, name: 'Project Phoenix', status: 'At Risk', health: 72, activeRisks: 3 },
          { id: 2, name: 'Project Alpha', status: 'Healthy', health: 91, activeRisks: 1 },
          { id: 3, name: 'Project Nova', status: 'Critical', health: 48, activeRisks: 6 }
        ]);
        setLoading(false);
      });
  }, []);

  const getHealthColor = (health) => {
    if (health >= 80) return 'bg-emerald-500';
    if (health >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-6xl mx-auto font-sans">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Project Portfolio</h1>
          <p className="text-slate-500 font-medium">Enterprise Health Overview</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + New Project
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading portfolio data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  project.status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' :
                  project.status === 'At Risk' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {project.status}
                </span>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500 font-medium">System Health</span>
                  <span className="font-bold text-slate-700">{project.health}/100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`${getHealthColor(project.health)} h-2 rounded-full transition-all duration-500`} 
                    style={{ width: `${project.health}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="text-sm">
                  <span className="font-bold text-slate-700">{project.activeRisks}</span>
                  <span className="text-slate-500 ml-1">Active Risks</span>
                </div>
                {/* This links back to your main dashboard for this specific project */}
                <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold">
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}