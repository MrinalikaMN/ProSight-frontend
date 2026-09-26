import { useState } from 'react';
import axios from 'axios';

export default function AddRiskForm({ onRiskAdded }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState('High');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: title,
        description: description,
        impact: impact,
        project: { id: 1 }
      };
      
      // Updated to use the Vite environment variable
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/risks`, payload);
      
      if (typeof onRiskAdded === 'function') {
        onRiskAdded(response.data);
      }
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error("Failed to submit risk:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-slate-200 mb-8 max-w-lg">
      <h3 className="text-xl font-bold text-slate-800 mb-4">Report a New Risk</h3>
      <div className="space-y-4">
        <input 
          type="text" 
          placeholder="Risk Title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required 
          className="w-full p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea 
          placeholder="Description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          required 
          className="w-full p-2.5 border border-slate-300 rounded-md h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select 
          value={impact} 
          onChange={(e) => setImpact(e.target.value)} 
          className="w-full p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="Low">Low Impact</option>
          <option value="Medium">Medium Impact</option>
          <option value="High">High Impact</option>
        </select>
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Risk
        </button>
      </div>
    </form>
  );
}