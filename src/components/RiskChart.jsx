import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RiskChart = ({ projectId = 1 }) => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modern color palette: Red for High, Amber for Medium, Emerald for Low
    const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#64748b']; 

    useEffect(() => {
        // Updated to use the Vite environment variable
        fetch(`${import.meta.env.VITE_API_URL}/api/risks/project/${projectId}`)
            .then(res => res.json())
            .then(data => {
                // Count the number of risks per impact level
                const impactCounts = data.reduce((acc, risk) => {
                    // Fallback to 'Unknown' if impact is null
                    const impact = risk.impact || 'Unknown'; 
                    acc[impact] = (acc[impact] || 0) + 1;
                    return acc;
                }, {});

                // Convert to the format Recharts needs: [{ name: 'High', value: 2 }, ...]
                const formattedData = Object.keys(impactCounts).map(key => ({
                    name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize
                    value: impactCounts[key]
                }));

                setChartData(formattedData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching risks for chart:", err);
                setLoading(false);
            });
    }, [projectId]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
                        📊
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Risk Distribution</h3>
                        <p className="text-xs text-slate-500">Active risks by impact level</p>
                    </div>
                </div>
            </div>

            <div className="h-64 w-full">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-slate-400 italic">
                        Loading chart data...
                    </div>
                ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        No active risks to display.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiskChart;