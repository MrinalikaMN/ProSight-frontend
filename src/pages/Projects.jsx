import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Project Modal State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState('');

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskStatusTarget, setTaskStatusTarget] = useState('To Do');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCost, setTaskCost] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskDeadline, setTaskDeadline] = useState('');

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
      setIsProjectModalOpen(false);
    } catch (err) {
      console.error("Failed to create project", err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/projects/${currentProject.id}/tasks`, {
        title: taskTitle,
        description: taskDesc,
        cost: Number(taskCost),
        priority: taskPriority,
        status: taskStatusTarget,
        deadline: taskDeadline
      });
      fetchTasks(currentProject.id);
      setTaskTitle('');
      setTaskDesc('');
      setTaskCost('');
      setTaskPriority('MEDIUM');
      setTaskDeadline('');
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/api/tasks/${taskId}`);
      fetchTasks(currentProject.id);
    } catch (err) {
      console.error("Failed to delete task", err);
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
            onClick={() => setIsProjectModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-lg"
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

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* To Do */}
              <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-200 text-sm tracking-wide">To Do ({todoTasks.length})</h3>
                  <button
                    onClick={() => { setTaskStatusTarget('To Do'); setIsTaskModalOpen(true); }}
                    className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs px-2 py-1 rounded-lg font-bold transition-colors"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {todoTasks.map(task => (
                    <div key={task.id} className="bg-slate-800 border border-slate-700/80 p-3.5 rounded-xl relative group">
                      <button onClick={() => handleDeleteTask(task.id)} className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 text-xs">✕</button>
                      <h4 className="font-bold text-white text-sm mb-1">{task.title || task.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">{task.description}</p>
                      {task.deadline && <p className="text-xs text-indigo-300 mb-2">Due: {task.deadline}</p>}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-indigo-400 font-semibold">{task.priority}</span>
                        <span className="text-emerald-400 font-medium">${task.cost || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* In Progress */}
              <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-200 text-sm tracking-wide">In Progress ({inProgressTasks.length})</h3>
                  <button
                    onClick={() => { setTaskStatusTarget('In Progress'); setIsTaskModalOpen(true); }}
                    className="bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white text-xs px-2 py-1 rounded-lg font-bold transition-colors"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {inProgressTasks.map(task => (
                    <div key={task.id} className="bg-slate-800 border border-slate-700/80 p-3.5 rounded-xl relative group">
                      <button onClick={() => handleDeleteTask(task.id)} className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 text-xs">✕</button>
                      <h4 className="font-bold text-white text-sm mb-1">{task.title || task.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">{task.description}</p>
                      {task.deadline && <p className="text-xs text-amber-300 mb-2">Due: {task.deadline}</p>}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-amber-400 font-semibold">{task.priority}</span>
                        <span className="text-emerald-400 font-medium">${task.cost || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completed */}
              <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-200 text-sm tracking-wide">Completed ({completedTasks.length})</h3>
                  <button
                    onClick={() => { setTaskStatusTarget('Completed'); setIsTaskModalOpen(true); }}
                    className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs px-2 py-1 rounded-lg font-bold transition-colors"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {completedTasks.map(task => (
                    <div key={task.id} className="bg-slate-800 border border-slate-700/80 p-3.5 rounded-xl relative group">
                      <button onClick={() => handleDeleteTask(task.id)} className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 text-xs">✕</button>
                      <h4 className="font-bold text-white text-sm mb-1">{task.title || task.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">{task.description}</p>
                      {task.deadline && <p className="text-xs text-emerald-300 mb-2">Due: {task.deadline}</p>}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-500 font-semibold">{task.priority}</span>
                        <span className="text-emerald-400 font-medium">${task.cost || 0}</span>
                      </div>
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
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-96">
            <h3 className="text-white font-bold text-lg mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Project Name</label>
                <input type="text" required value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm" placeholder="e.g. E-Commerce Redesign" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Budget ($)</label>
                <input type="number" required value={newProjectBudget} onChange={(e) => setNewProjectBudget(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm" placeholder="10000" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-white font-bold text-lg mb-4">Add Task to {taskStatusTarget}</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Task Title</label>
                <input type="text" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm" placeholder="e.g. Setup Database" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Description</label>
                <input type="text" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm" placeholder="Brief details" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Cost ($)</label>
                <input type="number" required value={taskCost} onChange={(e) => setTaskCost(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm" placeholder="500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Deadline Date</label>
                <input type="date" required value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Priority</label>
                <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm">
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}