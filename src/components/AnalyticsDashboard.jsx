import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/analytics/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-10 text-slate-500 font-bold">Loading analytics engine...</div>;
  if (!metrics) return <div className="text-center p-10 text-rose-500 font-bold">Failed to load analytics data.</div>;

  // Prepare Donut Chart Data
  const donutData = [
    { name: 'To Do / Planning', value: metrics.planningCount, color: '#94a3b8' }, // Slate
    { name: 'In Progress', value: metrics.inProgressCount, color: '#fbbf24' },    // Amber
    { name: 'Completed', value: metrics.completedCount, color: '#34d399' }        // Emerald
  ].filter(item => item.value > 0); // Hide segments with 0 projects

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Performance & Financial Analytics</h2>
        
        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Projects</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white mt-2">{metrics.totalProjects}</p>
          </div>
          <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
            <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">Allocated Budget</p>
            <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300 mt-2">{formatCurrency(metrics.totalAllocated)}</p>
          </div>
          <div className="p-5 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800/30">
            <p className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wide">Actual Spent</p>
            <p className="text-3xl font-black text-rose-700 dark:text-rose-300 mt-2">{formatCurrency(metrics.totalSpent)}</p>
          </div>
          <div className={`p-5 rounded-xl border ${metrics.costSavings >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30'}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${metrics.costSavings >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
              {metrics.costSavings >= 0 ? 'Cost Savings' : 'Budget Overrun'}
            </p>
            <p className={`text-3xl font-black mt-2 ${metrics.costSavings >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
              {formatCurrency(Math.abs(metrics.costSavings))}
            </p>
          </div>
        </div>

        {/* Recharts Donut Graph */}
        <div className="h-96 w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 text-center uppercase tracking-wider">Project Status Distribution</h3>
          {donutData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 font-medium">No active project data to chart.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={130}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                  itemStyle={{ fontWeight: 'bold', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        
      </div>
    </div>
  );
}