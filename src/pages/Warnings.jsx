import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Warnings() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [newWarning, setNewWarning] = useState({ message: '', severity: 'Medium' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchWarnings(selectedProjectId);
    } else {
      setWarnings([]);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/projects`, getAuthHeaders());
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  const fetchWarnings = async (projectId) => {
    try {
      const res = await axios.get(`${API_URL}/api/projects/${projectId}/warnings`, getAuthHeaders());
      setWarnings(res.data);
    } catch (err) {
      console.error("Failed to fetch warnings", err);
    }
  };

  const handleCreateWarning = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return alert("Please select a project first.");
    
    try {
      await axios.post(`${API_URL}/api/projects/${selectedProjectId}/warnings`, newWarning, getAuthHeaders());
      setNewWarning({ message: '', severity: 'Medium' });
      fetchWarnings(selectedProjectId);
    } catch (err) {
      console.error("Failed to create warning", err);
    }
  };

  const handleDeleteWarning = async (warningId) => {
    try {
      await axios.delete(`${API_URL}/api/projects/${selectedProjectId}/warnings/${warningId}`, getAuthHeaders());
      fetchWarnings(selectedProjectId);
    } catch (err) {
      console.error("Failed to delete warning", err);
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'High': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'Medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Low': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Risk Analysis</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Project Context</label>
          <select 
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">-- Choose a Project --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedProjectId && (
          <form onSubmit={handleCreateWarning} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Warning Message</label>
              <input 
                required 
                type="text" 
                value={newWarning.message} 
                onChange={(e) => setNewWarning({...newWarning, message: e.target.value})} 
                placeholder="Describe the identified risk or warning..."
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Severity</label>
              <select 
                value={newWarning.severity} 
                onChange={(e) => setNewWarning({...newWarning, severity: e.target.value})}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <button type="submit" className="w-full md:w-auto px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm">
              Log Warning
            </button>
          </form>
        )}
      </div>

      {selectedProjectId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warnings.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400">No active warnings logged for this project. System healthy.</p>
            </div>
          ) : (
            warnings.map(warning => (
              <div key={warning.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative group flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded border ${getSeverityStyle(warning.severity)}`}>
                      {warning.severity}
                    </span>
                    <button onClick={() => handleDeleteWarning(warning.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 font-medium mb-4">{warning.message}</p>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Logged on {new Date(warning.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}