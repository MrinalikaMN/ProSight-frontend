import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProjectDetails() {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Creating Project
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState('');

  // Edit Budget State
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editBudgetVal, setEditBudgetVal] = useState('');

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
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Failed to create project", err);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/projects/${id}`);
      const remaining = projects.filter(p => p.id !== id);
      setProjects(remaining);
      if (remaining.length > 0) {
        setCurrentProject(remaining[0]);
        fetchTasks(remaining[0].id);
      } else {
        setCurrentProject(null);
        setTasks([]);
      }
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  };

  const handleSaveBudget = async () => {
    try {
      const updated = { ...currentProject, budget: Number(editBudgetVal) };
      await axios.put(`${API_URL}/api/projects/${currentProject.id}`, updated);
      setCurrentProject(updated);
      setIsEditingBudget(false);
      fetchProjects();
    } catch (err) {
      console.error("Failed to update budget", err);
    }
  };

  if (loading) return <div className="text-slate-400 p-8">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto flex gap-6 font-sans p-6">
      {/* Sidebar with Projects & Add Button */}
      <div className="w-1/4 bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 h-[calc(100vh-120px)] flex flex-col">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-white font-bold text-lg">Projects</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-colors shadow-lg"
          >
            +
          </button>
        </div>
        
        <div className="space-y-2 overflow-y-auto flex-1">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => {
                setCurrentProject(proj);
                fetchTasks(proj.id);
                setIsEditingBudget(false);
              }}
              className={`p-3 rounded-xl cursor-pointer transition-colors flex justify-between items-center group ${
                currentProject?.id === proj.id
                  ? 'bg-indigo-600/20 border border-indigo-500/50 text-white font-semibold'
                  : 'hover:bg-slate-700/40 text-slate-300'
              }`}
            >
              <span className="truncate">{proj.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(proj.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 text-xs px-2 py-1 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Board View */}
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
                      setEditBudgetVal(currentProject.budget || 0);
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
                      value={editBudgetVal}
                      onChange={(e) => setEditBudgetVal(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white px-3 py-1 rounded-lg text-sm w-40"
                    />
                    <button
                      onClick={handleSaveBudget}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm font-semibold"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4">
                <h3 className="font-bold text-slate-200 text-sm mb-4">To Do ({tasks.filter(t => t.status === 'To Do').length})</h3>
                <div className="space-y-3">
                  {tasks.filter(t => t.status === 'To Do').map(task => (
                    <div key={task.id} className="bg-slate-800 border border-slate-700 p-3 rounded-xl">
                      <h4 className="font-bold text-white text-sm">{task.title || task.name}</h4>
                      <p className="text-xs text-slate-400">{task.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4">
                <h3 className="font-bold text-slate-200 text-sm mb-4">In Progress ({tasks.filter(t => t.status === 'In Progress').length})</h3>
                <div className="space-y-3">
                  {tasks.filter(t => t.status === 'In Progress').map(task => (
                    <div key={task.id} className="bg-slate-800 border border-slate-700 p-3 rounded-xl">
                      <h4 className="font-bold text-white text-sm">{task.title || task.name}</h4>
                      <p className="text-xs text-slate-400">{task.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4">
                <h3 className="font-bold text-slate-200 text-sm mb-4">Completed ({tasks.filter(t => t.status === 'Completed').length})</h3>
                <div className="space-y-3">
                  {tasks.filter(t => t.status === 'Completed').map(task => (
                    <div key={task.id} className="bg-slate-800 border border-slate-700 p-3 rounded-xl">
                      <h4 className="font-bold text-white text-sm">{task.title || task.name}</h4>
                      <p className="text-xs text-slate-400">{task.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 flex items-center justify-center h-full">Select or create a project.</div>
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
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
                  onClick={() => setIsCreateModalOpen(false)}
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