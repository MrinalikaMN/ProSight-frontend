export default function TaskModal({ isOpen, onClose, projectId, projectName, onTaskAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'To Do',
    dueDate: '',
    priority: 'Medium',
    assignee: ''
  });

  if (!isOpen) return null;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/projects/${projectId}/tasks`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onTaskAdded) onTaskAdded(response.data);
      setFormData({ name: '', description: '', status: 'To Do', dueDate: '', priority: 'Medium', assignee: '' });
      onClose();
    } catch (err) {
      console.error("Failed to add task", err);
      alert("Error adding task. Check console for details.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e2d] border border-slate-800 rounded-xl w-full max-w-lg p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-6">
          Add Task to {projectName || 'Project'}
        </h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Task Name</label>
            <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#151521] border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Description</label>
            <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-[#151521] border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-[#151521] border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors">
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full bg-[#151521] border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Due Date</label>
              <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full bg-[#151521] border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Assignee</label>
              <input type="text" placeholder="e.g. Frontend Developer" value={formData.assignee} onChange={(e) => setFormData({...formData, assignee: e.target.value})} className="w-full bg-[#151521] border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors" />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}