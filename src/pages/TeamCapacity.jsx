import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function TeamCapacity() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAndCalculateCapacity();
  }, []);

  const fetchAndCalculateCapacity = async () => {
    try {
      // Fetch all tasks from the database
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/tasks`);
      const tasks = response.data;

      // Group tasks by assignedTeam
      const teamData = {};
      
      tasks.forEach(task => {
        const teamName = task.assignedTeam || "Unassigned";
        
        if (!teamData[teamName]) {
          teamData[teamName] = {
            name: teamName,
            taskCount: 0,
            totalExpectedDays: 0,
            totalActualDays: 0,
            tasks: []
          };
        }
        
        teamData[teamName].taskCount += 1;
        teamData[teamName].totalExpectedDays += task.expectedDays || 0;
        teamData[teamName].totalActualDays += task.actualDays || 0;
        teamData[teamName].tasks.push(task);
      });

      // Convert object to array for rendering
      setTeams(Object.values(teamData));
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch team capacity", error);
      setLoading(false);
    }
  };

  const getWorkloadColor = (actual, expected) => {
    if (actual > expected) return 'text-red-600 bg-red-50'; // Overworked
    if (actual === expected) return 'text-amber-600 bg-amber-50'; // At Capacity
    return 'text-emerald-600 bg-emerald-50'; // Has Bandwidth
  };

  return (
    <div className="max-w-6xl mx-auto font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Team Capacity</h1>
        <p className="text-slate-500 font-medium">Resource Utilization & Workload Distribution</p>
      </div>

      {loading ? (
        <div className="text-slate-500">Calculating team workloads...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500">No tasks assigned to any teams yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team, index) => {
            const isOverloaded = team.totalActualDays > team.totalExpectedDays;
            
            return (
              <div key={index} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{team.name} Team</h3>
                    <p className="text-sm text-slate-500">{team.taskCount} Active Tasks</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getWorkloadColor(team.totalActualDays, team.totalExpectedDays)}`}>
                    {isOverloaded ? 'Over Capacity' : 'Optimal'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Expected Workload</span>
                      <span className="font-semibold text-slate-700">{team.totalExpectedDays} Days</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Actual/Projected Time</span>
                      <span className={`font-semibold ${isOverloaded ? 'text-red-600' : 'text-slate-700'}`}>
                        {team.totalActualDays} Days
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div 
                        className={`${isOverloaded ? 'bg-red-500' : 'bg-emerald-500'} h-1.5 rounded-full transition-all`} 
                        style={{ width: `${Math.min((team.totalActualDays / Math.max(team.totalExpectedDays, 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}