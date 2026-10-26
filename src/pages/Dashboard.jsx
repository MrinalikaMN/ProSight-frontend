import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

// Custom Enterprise Tooltip with Budget & Velocity Metrics
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const metrics = {
      "Completed": { budgetUsed: "$2,750", avgTime: "3.2 Days", health: "Optimal Execution" },
      "In Progress": { budgetUsed: "$3,900", avgTime: "5.1 Days Active", health: "Monitoring Risk" },
      "To Do": { budgetUsed: "$4,150 Projected", avgTime: "Queued", health: "Pending Allocation" }
    };
    
    const current = metrics[data.name] || { budgetUsed: "$0", avgTime: "N/A", health: "Stable" };

    return (
      <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-white text-xs space-y-1.5 backdrop-blur-md">
        <p className="font-bold text-sm text-indigo-400">{data.name}: {data.value} Tasks</p>
        <p><span className="text-slate-400">Budget Impact:</span> <span className="font-medium text-slate-200">{current.budgetUsed}</span></p>
        <p><span className="text-slate-400">Timeline Velocity:</span> <span className="font-medium text-slate-200">{current.avgTime}</span></p>
        <p><span className="text-slate-400">Status Outlook:</span> <span className="text-emerald-400 font-semibold">{current.health}</span></p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState({ totalProjects: 0, totalTasks: 0, teamSize: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const username = localStorage.getItem("username") || "User";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectsRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/api/projects`),
          axios.get(`${API_URL}/api/auth/users`)
        ]);

        const projects = projectsRes.data;
        const users = usersRes.data;

        let allTasks = [];
        for (let p of projects) {
          const tasksRes = await axios.get(`${API_URL}/api/projects/${p.id}/tasks`);
          allTasks = [...allTasks, ...tasksRes.data];
        }

        let todo = 0, inProgress = 0, completed = 0;
        allTasks.forEach(t => {
          if (t.status === 'To Do') todo++;
          else if (t.status === 'In Progress') inProgress++;
          else if (t.status === 'Completed') completed++;
        });

        // Modern Enterprise Color Palette
        setChartData([
          { name: 'Completed', value: completed, color: '#10B981' }, // Emerald
          { name: 'In Progress', value: inProgress, color: '#F59E0B' }, // Amber
          { name: 'To Do', value: todo, color: '#6366F1' } // Indigo
        ]);

        setStats({
          totalProjects: projects.length,
          totalTasks: allTasks.length,
          teamSize: users.length
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="text-slate-500 font-sans p-6">Loading Dashboard Analytics...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto font-sans transition-colors duration-300">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Welcome back, {username}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Here is what is happening across your projects today.</p>
        </div>
        <Link to="/projects" className="hidden md:flex bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors shadow-sm items-center gap-2">
          Go to Projects
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
        </Link>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Projects</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalProjects}</h3>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tasks</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalTasks}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Team Members</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.teamSize}</h3>
          </div>
        </div>
      </div>

      {/* Task Execution Chart */}
      <div className="w-full md:w-1/2 bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Task Execution Velocity</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-sm">Distribution of all tasks across the organization.</p>
        
        <div className="h-64 w-full">
          {stats.totalTasks === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium">
              No tasks available to visualize.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={75}
                  outerRadius={95}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}