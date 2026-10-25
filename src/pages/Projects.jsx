import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState({ "To Do": [], "In Progress": [], "Completed": [] });
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectBudget, setNewProjectBudget] = useState("");
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ name: "", description: "", status: "To Do", priority: "Medium", dueDate: "", assignee: "", cost: "" });

  const userRole = localStorage.getItem("userRole");
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/projects`, getAuthHeaders());
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/users`, getAuthHeaders());
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      const res = await axios.get(`${API_URL}/api/projects/${projectId}/tasks`, getAuthHeaders());
      const grouped = { "To Do": [], "In Progress": [], "Completed": [] };
      res.data.forEach(task => {
        if (grouped[task.status]) {
          grouped[task.status].push(task);
        } else {
          grouped["To Do"].push(task);
        }
      });
      setTasks(grouped);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  const selectProject = (project) => {
    setSelectedProject(project);
    setSearchQuery(""); // Reset search when switching projects
    fetchTasks(project.id);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const projectPayload = { 
        name: newProjectName, 
        status: "Active", 
        budget: parseFloat(newProjectBudget) || 0 
      };
      await axios.post(`${API_URL}/api/projects`, projectPayload, getAuthHeaders());
      setNewProjectName("");
      setNewProjectBudget("");
      setIsProjectModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert("Unauthorized: Please ensure you are logged in as Admin and your token is valid.");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (userRole !== 'ROLE_ADMIN') return;
    try {
      await axios.delete(`${API_URL}/api/projects/${projectId}`, getAuthHeaders());
      if (selectedProject?.id === projectId) setSelectedProject(null);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const taskPayload = {
        ...newTask,
        cost: parseFloat(newTask.cost) || 0
      };
      await axios.post(`${API_URL}/api/projects/${selectedProject.id}/tasks`, taskPayload, getAuthHeaders());
      setNewTask({ name: "", description: "", status: "To Do", priority: "Medium", dueDate: "", assignee: "", cost: "" });
      setIsTaskModalOpen(false);
      fetchTasks(selectedProject.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (userRole !== 'ROLE_ADMIN' || !selectedProject) return;
    try {
      await axios.delete(`${API_URL}/api/projects/${selectedProject.id}/tasks/${taskId}`, getAuthHeaders());
      fetchTasks(selectedProject.id);
    } catch (err) {
      console.error(err);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination || !selectedProject) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumn = [...tasks[source.droppableId]];
    const destColumn = [...tasks[destination.droppableId]];
    const [movedTask] = sourceColumn.splice(source.index, 1);
    
    movedTask.status = destination.droppableId;
    destColumn.splice(destination.index, 0, movedTask);

    setTasks({
      ...tasks,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn
    });

    try {
      await axios.put(`${API_URL}/api/projects/${selectedProject.id}/tasks/${movedTask.id}`, movedTask, getAuthHeaders());
    } catch (err) {
      console.error("Failed to update task status", err);
      fetchTasks(selectedProject.id);
    }
  };

  const getFilteredTasks = (columnTasks) => {
    if (!searchQuery.trim()) return columnTasks;
    const query = searchQuery.toLowerCase();
    return columnTasks.filter(task => 
      task.name.toLowerCase().includes(query) || 
      (task.description && task.description.toLowerCase().includes(query))
    );
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'Critical': return 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-300 dark:border-red-800';
      case 'Medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Low': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 transition-colors duration-300">
      
      {/* Sidebar: Projects List */}
      <div className="w-full md:w-1/4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 h-fit">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Projects</h2>
          {userRole === 'ROLE_ADMIN' && (
            <button onClick={() => setIsProjectModalOpen(true)} className="p-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            </button>
          )}
        </div>
        <div className="space-y-2">
          {projects.map(p => (
            <div key={p.id} onClick={() => selectProject(p)} className={`p-3 rounded-xl cursor-pointer flex justify-between items-center transition-colors border ${selectedProject?.id === p.id ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <span className={`font-semibold ${selectedProject?.id === p.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{p.name}</span>
              {userRole === 'ROLE_ADMIN' && (
                <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} className="text-slate-400 hover:text-rose-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              )}
            </div>
          ))}
          {projects.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No projects found.</p>}
        </div>
      </div>

      {/* Main Content: Kanban Board */}
      <div className="w-full md:w-3/4">
        {!selectedProject ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center h-full flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Select a Project</h3>
            <p className="text-slate-500 dark:text-slate-400">Choose a project from the sidebar to view its Kanban board.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">{selectedProject.name}</h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  Budget: <span className="text-emerald-600 dark:text-emerald-400 font-bold">${selectedProject.budget || '0.00'}</span>
                </p>
              </div>
              <div className="flex w-full lg:w-auto items-center gap-3">
                <div className="relative flex-grow">
                  <input 
                    type="text" 
                    placeholder="Search tasks..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200 transition-shadow"
                  />
                  <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <button onClick={() => setIsTaskModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  New Task
                </button>
              </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {Object.keys(tasks).map(column => {
                  const filteredTasks = getFilteredTasks(tasks[column]);
                  return (
                    <Droppable droppableId={column} key={column}>
                      {(provided, snapshot) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className={`bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl border ${snapshot.isDraggingOver ? 'border-indigo-400 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-700/50'} min-h-[500px] transition-colors`}>
                          <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 px-2 flex justify-between items-center">
                            {column}
                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs py-1 px-2.5 rounded-full">{filteredTasks.length}</span>
                          </h3>
                          <div className="space-y-3">
                            {filteredTasks.map((task, index) => (
                              <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`bg-white dark:bg-slate-800 p-4 rounded-xl border ${snapshot.isDragging ? 'border-indigo-500 shadow-lg' : 'border-slate-200 dark:border-slate-700 shadow-sm'} group`}>
                                    
                                    <div className="flex justify-between items-start mb-2">
                                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                      {userRole === 'ROLE_ADMIN' && (
                                        <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                        </button>
                                      )}
                                    </div>
                                    
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{task.name}</h4>
                                    {task.description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{task.description}</p>}
                                    
                                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded">
                                        ${task.cost || "0.00"}
                                      </div>
                                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                        {task.dueDate || "No Date"}
                                      </div>
                                      {task.assignee && (
                                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded ml-auto">
                                          <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                          <span className="truncate max-w-[80px]">{task.assignee}</span>
                                        </div>
                                      )}
                                    </div>

                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </DragDropContext>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Create New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Project Name</label>
                  <input required type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Total Budget ($)</label>
                  <input type="number" step="0.01" value={newProjectBudget} onChange={(e) => setNewProjectBudget(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm">Create</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Add Task to {selectedProject?.name}</h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Task Name</label>
                  <input required type="text" value={newTask.name} onChange={(e) => setNewTask({...newTask, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Description</label>
                  <textarea value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} rows="2" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Status</label>
                    <select value={newTask.status} onChange={(e) => setNewTask({...newTask, status: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Priority</label>
                    <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Due Date</label>
                    <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Task Cost ($)</label>
                    <input type="number" step="0.01" placeholder="0.00" value={newTask.cost} onChange={(e) => setNewTask({...newTask, cost: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Assignee</label>
                  <input type="text" placeholder="e.g. Frontend Developer" value={newTask.assignee} onChange={(e) => setNewTask({...newTask, assignee: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm">Save Task</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}