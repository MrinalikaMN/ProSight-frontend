import React, { useState } from 'react';
import axios from 'axios';

export default function CreateProject() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Planning',
    health: 100,
    allocatedBudget: '',
    actualSpent: '',
    targetDate: '',
    completionDate: ''
  });
  const [statusMessage, setStatusMessage] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/projects`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusMessage('Project successfully created!');
      setFormData({
        name: '', description: '', status: 'Planning', health: 100, 
        allocatedBudget: '', actualSpent: '', targetDate: '', completionDate: ''
      });
    } catch (err) {
      console.error("Failed to create project", err);
      setStatusMessage('Error creating project. Check console for details.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Create New Project</h2>
        
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-xl font-bold ${statusMessage.includes('Error') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Project Name</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Description</label>
              <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Health (%)</label>
              <input type="number" min="0" max="100" value={formData.health} onChange={(e) => setFormData({...formData, health: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* New Analytics Fields */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Allocated Budget ($)</label>
              <input type="number" step="0.01" value={formData.allocatedBudget} onChange={(e) => setFormData({...formData, allocatedBudget: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Actual Spent ($)</label>
              <input type="number" step="0.01" value={formData.actualSpent} onChange={(e) => setFormData({...formData, actualSpent: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Target Date</label>
              <input type="date" value={formData.targetDate} onChange={(e) => setFormData({...formData, targetDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Completion Date</label>
              <input type="date" value={formData.completionDate} onChange={(e) => setFormData({...formData, completionDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button type="submit" className="px-8 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm">
              Save Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}