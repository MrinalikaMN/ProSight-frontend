import React, { useState } from 'react';
import axios from 'axios';

export default function CreateTask({ projectId, onTaskAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'To Do',
    dueDate: '',
    priority: 'Medium',
    assignee: ''
  });
  const [statusMessage, setStatusMessage] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/projects/${projectId}/tasks`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusMessage('Task successfully added!');
      setFormData({ name: '', description: '', status: 'To Do', dueDate: '', priority: 'Medium', assignee: '' });
      if (onTaskAdded) onTaskAdded(response.data);
    } catch (err) {
      console.error("Failed to add task", err);
      setStatusMessage('Error adding task. Check console for details.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mt-6">
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Add New Task</h3>
      
      {statusMessage && (
        <div className={`mb-4 p-3 rounded-xl font-bold text-sm ${statusMessage.includes('Error') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Task Name</label>
            <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Description</label>
            <textarea rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Priority</label>
            <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Due Date</label>
            <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Assignee</label>
            <input type="text" placeholder="e.g. Frontend Developer" value={formData.assignee} onChange={(e) => setFormData({...formData, assignee: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="mt-2 flex justify-end">
          <button type="submit" className="px-6 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm">
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
}