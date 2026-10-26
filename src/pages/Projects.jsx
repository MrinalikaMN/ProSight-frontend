import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState('');

  // Edit Budget State
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/projects`);
      setProjects(res.data);
      if (res.data.length > 0) {
        setCurrentProject(res.data[0]);
        fetchTasks(res.data[0].id);
        setNewBudget(res.data[0].budget || 0);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching projects", err);
      setLoading(false);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      const res = await axios.get(`${API_URL}/api/projects/${projectId}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks", err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/projects`, {
        name: newProjectName,
        budget: Number(newProjectBudget),
        status: 'planning'
      });
      setProjects([...projects, res.data]);
      setCurrentProject(res.data);
      fetchTasks(res.data.id);
      setNewProjectName('');
      setNewProjectBudget('');
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create project", err);
    }
  };

  const handleSelectProject = (proj) => {
    setCurrentProject(proj);
    setNewBudget(proj.budget || 0);
    setIsEditingBudget(false);
    fetchTasks(proj.id);
  };

  const handleSaveBudget = async () => {
    try {
      const updatedProj = { ...currentProject, budget: Number(newBudget) };
      await axios.put(`${API_URL}/api/projects/${currentProject.id}`, updatedProj);
      setCurrentProject(updatedProj);
      setIsEditingBudget(false);
      fetchProjects();
    } catch (err) {
      console.error("Failed to update budget", err);
    }
  };

  if (loading) {
    return <div className="text-slate-400 p-8">Loading Projects...</div>;
  }

  const todoTasks = tasks.filter(t => t.status === 'To Do');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  return (
    <div className="max-w-7xl mx-auto flex gap-6 font-sans p-6">
      {/* Sidebar Projects List */}
      <div className="w-1/4 bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 h-[calc(100vh-120px)] flex flex-col">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-white font-bold text-lg">Projects</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 shadow-lg"
          >
            + New Project
          </button>
        </div>
        
        <div className="space-y-2 overflow-y-auto flex-1">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => handleSelectProject(proj)}
              className={`p-3 rounded-xl cursor-pointer transition-colors flex justify-between items-center ${
                currentProject?.id === proj.id
                  ? 'bg-indigo-600/20 border border-indigo-500/50 text-white font-semibold'
                  : 'hover:bg-slate-700/40 text-slate-300'
              }`}
            >
              <span className="truncate">{proj.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Project Board View */}
      <div className="flex-1 bg-slate-800/30 border border-slate-700/60 rounded-2xl p-6 h-[calc(100vh-120px)] overflow-y-auto">
        {currentProject ? (
          <div>
            <div className="flex justify-between items-start mb-6 border-b border-slate-700/60 pb-6">
              <div>
                <div className="flex items-center gap-4 mb-1">
                  <h1 className="text-2xl font-black text-white">{currentProject.name}</h1>
                  <button
                    onClick={() => {
                      setIsEditingBudget(!isEditingBudget);
                      setNewBudget(currentProject.budget || 0);
                    }}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded-lg transition-colors font-medium"
                  >
                    {isEditingBudget ? 'Cancel' : 'Edit Budget'}
                  </button>
                </div>

                {isEditingBudget ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white px-3 py-1 rounded-lg text-sm w-40"
                      placeholder="Enter budget"
                    />
                    <button
                      onClick={handleSaveBudget}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-400 font-medium">
                    Budget: <span className="text-emerald-400 font-bold">${Number(currentProject.budget || 0).toLocaleString()}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-200 text-sm tracking-wide">To Do</h3>
                  <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-bold">{todoTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {todoTasks.map(task => (
                    <div key={task.id} className="bg-slate-800 border border-slate-700/80 p-3.5 rounded-xl shadow-sm">
                      <h4 className="font-bold text-white text-sm mb-1">{task.title || task.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">{task.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-200 text-sm tracking-wide">In Progress</h3>
                  <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full font-bold">{inProgressTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {inProgressTasks.map(task => (
                    <div key={task.id} className="bg-slate-800 border border-slate-700/80 p-3.5 rounded-xl shadow-sm">
                      <h4 className="font-bold text-white text-sm mb-1">{task.title || task.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">{task.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-200 text-sm tracking-wide">Completed</h3>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">{completedTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {completedTasks.map(task => (
                    <div key={task.id} className="bg-slate-800 border border-slate-700/80 p-3.5 rounded-xl shadow-sm">
                      <h4 className="font-bold text-white text-sm mb-1">{task.title || task.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">{task.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 flex items-center justify-center h-full">Select a project from the sidebar.</div>
        )}
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-96">
            <h3 className="text-white font-bold text-lg mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm"
                  placeholder="e.g. E-Commerce Redesign"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Budget ($)</label>
                <input
                  type="number"
                  required
                  value={newProjectBudget}
                  onChange={(e) => setNewProjectBudget(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm"
                  placeholder="e.g. 10000"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}